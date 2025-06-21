import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.text('annotated_image');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_compositions', (table) => {
    table.dropColumn('annotated_image');
  });
} 