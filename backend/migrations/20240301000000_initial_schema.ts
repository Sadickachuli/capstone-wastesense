import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum for user roles
  await knex.raw(`
    CREATE TYPE user_role AS ENUM ('resident', 'dispatcher', 'recycler');
  `);

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.specificType('role', 'user_role').notNullable();
    table.string('name').notNullable();
    table.string('phone');
    table.string('zone');
    table.string('facility');
    table.string('employee_id').unique(); // For dispatchers and recyclers
    table.timestamps(true, true);
  });

  // Waste sites table
  await knex.schema.createTable('waste_sites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('location').notNullable();
    table.decimal('current_capacity').notNullable();
    table.decimal('max_capacity').notNullable();
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  // Waste compositions table
  await knex.schema.createTable('waste_compositions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('site_id').references('id').inTable('waste_sites').onDelete('CASCADE');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.decimal('plastic_percent').notNullable();
    table.decimal('paper_percent').notNullable();
    table.decimal('glass_percent').notNullable();
    table.decimal('metal_percent').notNullable();
    table.decimal('organic_percent').notNullable();
    table.timestamps(true, true);

    // Add check constraint for total 100%
    table.check(
      '?? + ?? + ?? + ?? + ?? = 100',
      ['plastic_percent', 'paper_percent', 'glass_percent', 'metal_percent', 'organic_percent']
    );
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.specificType('for_role', 'user_role').notNullable();
    table.jsonb('metadata');
    table.timestamps(true, true);
  });

  // User notifications junction table
  await knex.schema.createTable('user_notifications', (table) => {
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('notification_id').references('id').inTable('notifications').onDelete('CASCADE');
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
    table.primary(['user_id', 'notification_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_notifications');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('waste_compositions');
  await knex.schema.dropTableIfExists('waste_sites');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
} 