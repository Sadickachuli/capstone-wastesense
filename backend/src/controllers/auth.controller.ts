import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

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

// Multer setup for image uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

// Define WasteDetectionResult type for backend use
// (should match frontend src/types/index.ts)
type WasteDetectionResult = {
  plastic: number;
  paper: number;
  glass: number;
  metal: number;
  organic: number;
};

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
    if (reportedCount >= threshold) {
      await notifyDispatchers(`Threshold reached: ${reportedCount}/${total} residents have reported their bins full in North.`);
    }
    console.log('DEBUG: reportedCount =', reportedCount, 'threshold =', threshold);
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
      .andWhere('archived', false)
      .orderBy('created_at', 'desc')
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Dispatcher Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update report status (for dispatcher)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'in-progress', 'collected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [updated] = await db('reports')
      .where({ id })
      .update({ status, updated_at: new Date().toISOString() })
      .returning(['id', 'user_id', 'location', 'description', 'status', 'timestamp']);
    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ report: updated });
  } catch (err) {
    console.error('Update Report Status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active reports (for dispatcher dashboard)
export const getActiveReports = async (req: Request, res: Response) => {
  try {
    const reports = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .select(
        'reports.id',
        'reports.user_id',
        'users.name as resident_name',
        'users.zone',
        'reports.location',
        'reports.description',
        'reports.status',
        'reports.timestamp'
      )
      .whereIn('reports.status', ['new', 'in-progress'])
      .orderBy('reports.timestamp', 'desc');
    res.json({ reports });
  } catch (err) {
    console.error('Get Active Reports error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark all active reports as collected
export const markAllReportsCollected = async (req: Request, res: Response) => {
  try {
    const reportsUpdated = await db('reports')
      .whereIn('status', ['new', 'in-progress'])
      .update({ status: 'collected', updated_at: new Date().toISOString() });
    console.log('DEBUG: Reports marked as collected:', reportsUpdated);
    // Archive all threshold notifications for dispatchers
    const notificationsUpdated = await db('notifications')
      .where('for_role', 'dispatcher')
      .andWhere('title', 'Bin Full Threshold Reached')
      .andWhere('archived', false)
      .update({ archived: true, updated_at: new Date().toISOString() });
    console.log('DEBUG: Notifications archived:', notificationsUpdated);
    res.json({ updatedCount: reportsUpdated });
  } catch (err) {
    console.error('Mark All Reports Collected error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get archived notifications for dispatchers
export const getArchivedDispatcherNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await db('notifications')
      .where('for_role', 'dispatcher')
      .andWhere('archived', true)
      .orderBy('created_at', 'desc')
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Archived Dispatcher Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ML Model Placeholder: Get dispatch recommendation
export const getDispatchRecommendation = async (req: Request, res: Response) => {
  // TODO: Replace with real ML model logic
  res.json({
    recommendation: 'Dispatch trucks to North zone. 3/3 bins reported full.',
    confidence: 0.95,
    nextCollectionTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    reason: 'Threshold reached based on current reports.'
  });
};

// Get notifications for recycler
export const getRecyclerNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await db('notifications')
      .where('for_role', 'recycler')
      .andWhere('archived', false)
      .orderBy('created_at', 'desc')
      .limit(20);
    console.log('Recycler notifications:', notifications);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Recycler Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update waste composition and notify recyclers
export const updateWasteComposition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let { plastic, paper, glass, metal, organic, updated_by, currentCapacity } = req.body;
    // Validate and normalize input
    let values = [Number(plastic), Number(paper), Number(glass), Number(metal), Number(organic)];
    let sum = values.reduce((a, b) => a + b, 0);
    if (sum !== 100 && sum > 0) {
      // Auto-normalize
      values = values.map(v => Math.round((v / sum) * 100));
      let newSum = values.reduce((a, b) => a + b, 0);
      if (newSum !== 100) {
        const diff = 100 - newSum;
        const maxIdx = values.indexOf(Math.max(...values));
        values[maxIdx] += diff;
      }
      [plastic, paper, glass, metal, organic] = values;
      console.warn(`Auto-normalized composition for site ${id}:`, { plastic, paper, glass, metal, organic });
    }
    if (Number(currentCapacity) <= 0 || isNaN(Number(currentCapacity))) {
      console.error('Missing or invalid currentCapacity for site', id);
      return res.status(400).json({ message: 'Current capacity (total weight) is required and must be a positive number.' });
    }
    // Generate a unique id for the new composition
    const newId = uuidv4();
    // Insert into waste_compositions table
    const [composition] = await db('waste_compositions')
      .insert({
        id: newId,
        site_id: id,
        updated_by: updated_by || null,
        plastic_percent: plastic,
        paper_percent: paper,
        glass_percent: glass,
        metal_percent: metal,
        organic_percent: organic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning(['id', 'site_id', 'plastic_percent', 'paper_percent', 'glass_percent', 'metal_percent', 'organic_percent', 'created_at']);

    // Update waste_sites table for current values and capacity
    const updateFields: any = {
      last_updated: new Date().toISOString(),
      'composition_plastic': plastic,
      'composition_paper': paper,
      'composition_glass': glass,
      'composition_metal': metal,
      'composition_organic': organic,
      current_capacity: Number(currentCapacity),
    };
    await db('waste_sites')
      .where({ id })
      .update(updateFields);

    // Get site info for notification
    const site = await db('waste_sites').where({ id }).first();

    // Create notification for recyclers
    await db('notifications').insert({
      type: 'info',
      title: 'New Waste Composition Update',
      message: `Waste composition updated at ${site.name}`,
      for_role: 'recycler',
      metadata: {
        siteId: id,
        siteName: site.name,
        updateType: 'composition',
        composition: { plastic, paper, glass, metal, organic },
        currentCapacity: Number(currentCapacity),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    });

    console.log('Waste composition updated for site', id, { plastic, paper, glass, metal, organic, currentCapacity });
    res.status(200).json({ message: 'Waste composition updated and recyclers notified', composition });
  } catch (err) {
    console.error('Update Waste Composition error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all waste sites
export const getWasteSites = async (req: Request, res: Response) => {
  try {
    const sites = await db('waste_sites').select(
      'id',
      'name',
      'location',
      'current_capacity',
      'max_capacity',
      'last_updated',
      'composition_plastic',
      'composition_paper',
      'composition_glass',
      'composition_metal',
      'composition_organic'
    );
    // Map DB fields to frontend WasteSite type
    const mapped = sites.map(site => ({
      id: site.id,
      name: site.name,
      location: site.location,
      currentCapacity: Number(site.current_capacity),
      maxCapacity: Number(site.max_capacity),
      lastUpdated: site.last_updated,
      composition: {
        plastic: Number(site.composition_plastic),
        paper: Number(site.composition_paper),
        glass: Number(site.composition_glass),
        metal: Number(site.composition_metal),
        organic: Number(site.composition_organic),
      },
    }));
    res.json({ sites: mapped });
  } catch (err) {
    console.error('Get Waste Sites error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Waste detection controller
// Note: req type is 'any' to allow req.file (for multer). For production, extend Request type for file.
export const detectWasteFromImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    // Prepare form data for ML API
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    // Send to ML API (correct endpoint)
    const mlRes = await axios.post('https://waste-sense-api.onrender.com/predict/', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    // Parse detections, total_weight, and annotated_image
    const { detections, total_weight, annotated_image } = mlRes.data;

    // Map class names to main types
    const classToType: Record<string, keyof WasteDetectionResult> = {
      // Plastic
      'Other plastic bottle': 'plastic',
      'Clear plastic bottle': 'plastic',
      'Plastic bottle cap': 'plastic',
      'Plastic lid': 'plastic',
      'Other plastic': 'plastic',
      'Plastic film': 'plastic',
      'Garbage bag': 'plastic',
      'Other plastic wrapper': 'plastic',
      'Single-use carrier bag': 'plastic',
      'Polypropylene bag': 'plastic',
      'Crisp packet': 'plastic',
      'Spread tub': 'plastic',
      'Tupperware': 'plastic',
      'Disposable food container': 'plastic',
      'Foam food container': 'plastic',
      'Other plastic container': 'plastic',
      'Plastic glooves': 'plastic',
      'Plastic utensils': 'plastic',
      'Squeezable tube': 'plastic',
      'Plastic straw': 'plastic',
      'Six pack rings': 'plastic',
      'Other plastic cup': 'plastic',
      'Disposable plastic cup': 'plastic',
      // Paper
      'Magazine paper': 'paper',
      'Tissues': 'paper',
      'Wrapping paper': 'paper',
      'Normal paper': 'paper',
      'Paper bag': 'paper',
      'Plastified paper bag': 'paper',
      'Toilet tube': 'paper',
      'Other carton': 'paper',
      'Egg carton': 'paper',
      'Drink carton': 'paper',
      'Corrugated carton': 'paper',
      'Meal carton': 'paper',
      'Pizza box': 'paper',
      'Paper cup': 'paper',
      'Paper straw': 'paper',
      // Glass
      'Glass bottle': 'glass',
      'Broken glass': 'glass',
      'Glass cup': 'glass',
      'Glass jar': 'glass',
      // Metal
      'Aluminium foil': 'metal',
      'Battery': 'metal',
      'Aluminium blister pack': 'metal',
      'Carded blister pack': 'metal',
      'Metal bottle cap': 'metal',
      'Food Can': 'metal',
      'Aerosol': 'metal',
      'Drink can': 'metal',
      'Metal lid': 'metal',
      'Pop tab': 'metal',
      'Scrap metal': 'metal',
      // Organic
      'Food waste': 'organic',
      'Shoe': 'organic', // assuming
      'Rope & strings': 'organic', // assuming
      // Styrofoam, foam, unlabeled, cigarette, etc. can be mapped as needed
    };

    // Aggregate weights by type
    const typeWeights: Record<keyof WasteDetectionResult, number> = {
      plastic: 0,
      paper: 0,
      glass: 0,
      metal: 0,
      organic: 0,
    };
    for (const det of detections) {
      const type = classToType[det.class];
      if (type) {
        typeWeights[type] += 1;
      }
    }
    const total = Object.values(typeWeights).reduce((a, b) => a + b, 0);
    let composition: WasteDetectionResult = { plastic: 0, paper: 0, glass: 0, metal: 0, organic: 0 };
    if (total > 0) {
      for (const type of Object.keys(typeWeights) as (keyof WasteDetectionResult)[]) {
        composition[type] = Math.round((typeWeights[type] / total) * 100);
      }
    }
    res.json({ result: composition, total_weight, annotated_image, raw: mlRes.data });
  } catch (err: any) {
    console.error('Waste detection error:', err);
    res.status(500).json({ message: 'Failed to detect waste', error: err.message });
  }
};

// GET /api/waste-compositions/history - Get waste detection composition history for insights
export const getWasteCompositionHistory = async (req: Request, res: Response) => {
  try {
    const { site_id } = req.query;
    let query = db('waste_compositions')
      .select(
        'site_id',
        db.raw('DATE(created_at) as date'),
        'plastic_percent',
        'paper_percent',
        'glass_percent',
        'metal_percent',
        'organic_percent'
      );
    if (site_id) {
      query = query.where('site_id', site_id);
    }
    const rows = await query.orderBy('date', 'desc');
    res.json({ history: rows });
  } catch (err) {
    console.error('Get Waste Composition History error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// LLM-based waste detection controller
export const detectWasteFromImageLLM = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not set in environment' });
    }

    // Prepare image as base64
    const imageBase64 = req.file.buffer.toString('base64');
    const prompt = `You are a waste management expert. Given the attached image of a waste pile, estimate the percentage composition by material type (plastic, metal, organic, paper, glass, textile, other). Return your answer as a JSON object with keys as material types and values as percentages (e.g., { "plastic": 70, "paper": 12, ... }).`;

    // Call OpenAI API (GPT-4 Vision)
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for waste composition analysis.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${req.file.mimetype};base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the response
    const content = openaiRes.data.choices[0].message.content;
    // Try to extract JSON from the response
    let composition = null;
    try {
      // Find the first JSON object in the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        composition = JSON.parse(match[0]);
      } else {
        throw new Error('No JSON object found in LLM response');
      }
    } catch (err) {
      return res.status(500).json({ message: 'Failed to parse LLM response', raw: content });
    }

    res.json({ composition, raw: content });
  } catch (err: any) {
    console.error('LLM waste detection error:', err.response?.data || err.message);
    res.status(500).json({ message: 'LLM waste detection failed', error: err.response?.data || err.message });
  }
};

// Export multer upload for use in routes
export { upload }; 