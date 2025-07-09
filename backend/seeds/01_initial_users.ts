import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // First, delete existing entries
  await knex('waste_sites').del();
  await knex('users').del();

  // Create password hash
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // Insert test users
  await knex('users').insert([
    {
      email: 'resident.ablekuma@test.com',
      password_hash: password,
      name: 'Ablekuma Resident',
      phone: '1234567890',
      zone: 'Ablekuma North',
      role: 'resident'
    },
    {
      email: 'resident.ayawaso@test.com',
      password_hash: password,
      name: 'Ayawaso Resident',
      phone: '0987654321',
      zone: 'Ayawaso West',
      role: 'resident'
    },
    {
      email: 'dispatcher@wastesense.com',
      password_hash: password,
      name: 'Test Dispatcher',
      employee_id: 'DISP001',
      role: 'dispatcher'
    },
    {
      email: 'recycler@wastesense.com',
      password_hash: password,
      name: 'Test Recycler',
      employee_id: 'REC001',
      facility: 'Main Recycling Center',
      role: 'recycler'
    },
    // Added admin user
    {
      email: 'admin@wastesense.com',
      password_hash: password,
      name: 'System Admin',
      employee_id: 'ADMIN001',
      role: 'admin'
    }
  ]);

  // Insert waste sites
  await knex('waste_sites').insert([
    {
      id: 'WS001',
      name: 'North Dumping Site',
      location: 'Ablekuma North Industrial Area',
      current_capacity: 750,
      max_capacity: 1000,
      composition_plastic: 40,
      composition_paper: 25,
      composition_glass: 15,
      composition_metal: 10,
      composition_organic: 10,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'WS002',
      name: 'South Dumping Site',
      location: 'Ayawaso West Industrial Zone',
      current_capacity: 500,
      max_capacity: 1000,
      composition_plastic: 30,
      composition_paper: 30,
      composition_glass: 20,
      composition_metal: 15,
      composition_organic: 5,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]);
} 