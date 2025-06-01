import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_sites', (table) => {
    table.decimal('composition_plastic').defaultTo(0);
    table.decimal('composition_paper').defaultTo(0);
    table.decimal('composition_glass').defaultTo(0);
    table.decimal('composition_metal').defaultTo(0);
    table.decimal('composition_organic').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('waste_sites', (table) => {
    table.dropColumn('composition_plastic');
    table.dropColumn('composition_paper');
    table.dropColumn('composition_glass');
    table.dropColumn('composition_metal');
    table.dropColumn('composition_organic');
  });
} 