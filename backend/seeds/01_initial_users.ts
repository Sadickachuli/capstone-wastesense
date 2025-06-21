import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // First, delete existing entries
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
    }
  ]);
} 