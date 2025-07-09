const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE email = 'admin@wastesense.com' OR employee_id = 'ADMIN001'"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists!');
      return;
    }

    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create admin user
    const result = await client.query(`
      INSERT INTO users (email, password_hash, name, employee_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, name, employee_id, role
    `, ['admin@wastesense.com', passwordHash, 'System Admin', 'ADMIN001', 'admin']);

    console.log('✅ Admin user created successfully:');
    console.log('Email: admin@wastesense.com');
    console.log('Employee ID: ADMIN001');
    console.log('Password: password123');
    console.log('Role: admin');
    console.log('User ID:', result.rows[0].id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createAdmin(); 