import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schedules', (table) => {
    table.string('id').primary();
    table.string('vehicle_id').notNullable();
    table.string('zone').notNullable();
    table.datetime('scheduled_start').notNullable();
    table.datetime('estimated_completion').notNullable();
    table.string('status').defaultTo('scheduled'); // scheduled, in-progress, completed, cancelled
    table.integer('reports_count').defaultTo(0);
    table.integer('estimated_distance_km').notNullable();
    table.decimal('estimated_fuel_consumption', 8, 2);
    table.string('driver_name');
    table.string('driver_contact');
    table.string('created_by');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('schedules');
} 