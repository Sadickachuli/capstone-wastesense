const { Client } = require('pg');

async function checkAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check total users
    const totalUsers = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total users in database: ${totalUsers.rows[0].count}`);

    // Check for admin users
    const adminUsers = await client.query(
      "SELECT id, email, employee_id, name, role FROM users WHERE role = 'admin'"
    );

    if (adminUsers.rows.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      console.log('✅ Admin users found:');
      adminUsers.rows.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Employee ID: ${user.employee_id}`);
        console.log(`  - Name: ${user.name}`);
        console.log(`  - Role: ${user.role}`);
        console.log('  ---');
      });
    }

    // Check all users by role
    const usersByRole = await client.query(
      'SELECT role, COUNT(*) FROM users GROUP BY role'
    );
    console.log('\n📋 Users by role:');
    usersByRole.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkAdmin(); 