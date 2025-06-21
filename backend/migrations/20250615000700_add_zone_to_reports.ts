import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reports', (table) => {
    table.string('zone');
    table.jsonb('location').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reports', (table) => {
    table.dropColumn('zone');
    table.jsonb('location').notNullable().alter();
  });
} 