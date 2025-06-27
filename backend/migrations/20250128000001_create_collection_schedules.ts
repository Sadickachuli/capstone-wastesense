import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // This migration was probably run before but the file was deleted
  // We'll check if the table exists and create it only if it doesn't
  const hasTable = await knex.schema.hasTable('collection_schedules');
  
  if (!hasTable) {
    await knex.schema.createTable('collection_schedules', (table) => {
      table.string('id').primary();
      table.string('vehicle_id').notNullable();
      table.string('zone').notNullable();
      table.datetime('scheduled_start').notNullable();
      table.datetime('estimated_completion').notNullable();
      table.string('status').defaultTo('scheduled');
      table.integer('reports_count').defaultTo(0);
      table.timestamps(true, true);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('collection_schedules');
} 