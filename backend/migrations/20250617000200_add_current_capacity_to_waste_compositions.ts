import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.float('current_capacity');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.dropColumn('current_capacity');
  });
} 