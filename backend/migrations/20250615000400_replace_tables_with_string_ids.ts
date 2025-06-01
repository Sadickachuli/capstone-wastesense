import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create new tables with string IDs
  await knex.schema.createTable('waste_sites_new', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('location').notNullable();
    table.decimal('current_capacity').notNullable();
    table.decimal('max_capacity').notNullable();
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
  await knex.schema.createTable('waste_compositions_new', (table) => {
    table.string('id').primary();
    table.string('site_id').references('waste_sites_new.id').onDelete('CASCADE');
    table.uuid('updated_by').nullable();
    table.decimal('plastic_percent').notNullable();
    table.decimal('paper_percent').notNullable();
    table.decimal('glass_percent').notNullable();
    table.decimal('metal_percent').notNullable();
    table.decimal('organic_percent').notNullable();
    table.timestamps(true, true);
  });

  // 2. Copy data
  await knex.raw('INSERT INTO waste_sites_new (id, name, location, current_capacity, max_capacity, last_updated, created_at, updated_at) SELECT id, name, location, current_capacity, max_capacity, last_updated, created_at, updated_at FROM waste_sites');
  await knex.raw('INSERT INTO waste_compositions_new (id, site_id, updated_by, plastic_percent, paper_percent, glass_percent, metal_percent, organic_percent, created_at, updated_at) SELECT id, site_id, updated_by, plastic_percent, paper_percent, glass_percent, metal_percent, organic_percent, created_at, updated_at FROM waste_compositions');

  // 3. Drop old tables
  await knex.schema.dropTable('waste_compositions');
  await knex.schema.dropTable('waste_sites');

  // 4. Rename new tables
  await knex.schema.renameTable('waste_sites_new', 'waste_sites');
  await knex.schema.renameTable('waste_compositions_new', 'waste_compositions');
}

export async function down(knex: Knex): Promise<void> {
  // Not implemented: would require reversing the above steps
} 