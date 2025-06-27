import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vehicles', (table) => {
    table.string('registration_number').nullable(); // Ghana vehicle registration
    table.string('driver_name').nullable(); // Assigned driver name
    table.string('driver_contact').nullable(); // Driver phone number
    table.integer('fuel_percentage').nullable(); // Calculated fuel percentage
    table.integer('estimated_range_km').nullable(); // Calculated range
    table.boolean('needs_refuel').defaultTo(false); // Auto-calculated refuel flag
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vehicles', (table) => {
    table.dropColumn('registration_number');
    table.dropColumn('driver_name');
    table.dropColumn('driver_contact');
    table.dropColumn('fuel_percentage');
    table.dropColumn('estimated_range_km');
    table.dropColumn('needs_refuel');
  });
}

