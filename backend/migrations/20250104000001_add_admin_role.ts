import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First, check if admin role already exists
  const result = await knex.raw(`
    SELECT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'admin' 
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'user_role'
      )
    ) AS admin_exists
  `);

  if (!result.rows[0].admin_exists) {
    // Add admin role to the existing enum
    await knex.raw(`ALTER TYPE user_role ADD VALUE 'admin'`);
    console.log('✅ Added admin role to user_role enum');
  } else {
    console.log('✅ Admin role already exists in user_role enum');
  }

  // Insert admin user if it doesn't exist
  const adminExists = await knex('users').where('employee_id', 'ADMIN001').first();
  
  if (!adminExists) {
    await knex('users').insert({
      employee_id: 'ADMIN001',
      email: 'admin@wastesense.com',
      // bcrypt hash for 'password123'
      password_hash: '$2b$10$nhww01gyXhTrn1wsTFRJ5ux1TUGIqpVmYeOOdnIT/hNQux5rrdxoS',
      role: 'admin',
      name: 'WasteSense Admin',
      facility: 'Admin Panel',
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('✅ Created admin user');
  } else {
    console.log('✅ Admin user already exists');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove admin user
  await knex('users').where('employee_id', 'ADMIN001').del();
  
  // Note: PostgreSQL doesn't support removing enum values once added
  // The admin role will remain in the enum type
  console.log('⚠️  Admin user removed, but admin role remains in enum (PostgreSQL limitation)');
} 