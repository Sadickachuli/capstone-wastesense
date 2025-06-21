import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.float('textile_percent');
    table.float('other_percent');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.dropColumn('textile_percent');
    table.dropColumn('other_percent');
  });
} 