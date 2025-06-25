import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('deliveries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('truck_id').notNullable();
    table.string('facility_id').notNullable(); // 'WS001' or 'WS002'
    table.string('zone').notNullable(); // 'Ablekuma North' or 'Ayawaso West'
    table.timestamp('estimated_arrival').notNullable();
    table.string('status').notNullable().defaultTo('pending'); // 'pending', 'in-transit', 'completed'
    table.decimal('weight', 8, 2).notNullable().defaultTo(0);
    table.jsonb('composition').notNullable(); // {plastic: 30, paper: 25, ...}
    table.string('created_by').nullable(); // dispatcher ID who created it
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('deliveries');
} 