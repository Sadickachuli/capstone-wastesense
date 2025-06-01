import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';

// Validation schemas
const residentSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  phone: z.string().optional(),
  zone: z.string().optional(),
});

const staffLoginSchema = z.object({
  employee_id: z.string(),
  password: z.string(),
});

const residentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const data = residentSignupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db('users').where('email', data.email).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create new user
    const [user] = await db('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        phone: data.phone,
        zone: data.zone,
        role: 'resident',
      })
      .returning(['id', 'email', 'name', 'role']);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log('LOGIN BODY:', req.body);
  try {
    // Check if it's staff or resident login
    const isStaffLogin = 'employee_id' in req.body;
    let user;

    if (isStaffLogin) {
      // Staff login (dispatcher/recycler)
      const data = staffLoginSchema.parse(req.body);
      user = await db('users')
        .where('employee_id', data.employee_id)
        .whereIn('role', ['dispatcher', 'recycler'])
        .first();
    } else {
      // Resident login
      const data = residentLoginSchema.parse(req.body);
      user = await db('users')
        .where('email', data.email)
        .where('role', 'resident')
        .first();
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employee_id: user.employee_id,
      },
      token,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper to send notification to all dispatchers
async function notifyDispatchers(message: string) {
  const dispatchers = await db('users').where('role', 'dispatcher');
  for (const dispatcher of dispatchers) {
    await db('notifications').insert({
      type: 'alert',
      title: 'Bin Full Threshold Reached',
      message,
      for_role: 'dispatcher',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

export const reportBinFull = async (req: Request, res: Response) => {
  try {
    const { userId, location, description } = req.body;
    if (!userId || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Prevent duplicate report in the same cycle
    const existingReport = await db('reports')
      .where({ user_id: userId })
      .whereIn('status', ['new', 'in-progress'])
      .first();
    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported your bin full for this cycle. Please wait until collection is confirmed.' });
    }
    const [report] = await db('reports')
      .insert({
        user_id: userId,
        location: JSON.stringify(location),
        description,
        status: 'new',
        timestamp: new Date().toISOString(),
      })
      .returning(['id', 'user_id', 'location', 'description', 'status', 'timestamp']);

    // Count total residents in North
    const totalResidents = await db('users').where({ role: 'resident', zone: 'North' }).count('id as count');
    const residentCount = parseInt(String(totalResidents[0].count), 10) || 0;
    const total = 3;
    const threshold = 3;
    // Count unique residents who have reported
    const reported = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .where('users.zone', 'North')
      .whereIn('reports.status', ['new', 'in-progress'])
      .countDistinct('reports.user_id as count');
    const reportedCount = parseInt(String(reported[0].count), 10) || 0;
    // If threshold reached, notify dispatchers
    if (residentCount > 0) {
      await notifyDispatchers(`Threshold reached: ${residentCount}/${total} residents have reported their bins full in North.`);
    }
    res.status(201).json({ report, total, threshold, reportedCount });
  } catch (err) {
    console.error('Report Bin Full error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getThresholdStatus = async (req: Request, res: Response) => {
  try {
    // Count total residents in North
    const totalResidents = await db('users').where({ role: 'resident', zone: 'North' }).count('id as count');
    const total = 3;
    const threshold = 3;
    // Count unique residents who have reported
    const reported = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .where('users.zone', 'North')
      .whereIn('reports.status', ['new', 'in-progress'])
      .countDistinct('reports.user_id as count');
    const reportedCount = parseInt(String(reported[0].count), 10) || 0;
    res.json({ total, threshold, reportedCount });
  } catch (err) {
    console.error('Get Threshold Status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDispatcherNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await db('notifications')
      .where('for_role', 'dispatcher')
      .orderBy('created_at', 'desc')
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Dispatcher Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 