import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create vehicles table for fuel tracking
  await knex.schema.createTable('vehicles', (table) => {
    table.string('id').primary(); // 'T001', 'T002', etc.
    table.string('type').notNullable(); // 'truck', 'van'
    table.string('make').notNullable(); // 'Ford', 'Mercedes', etc.
    table.string('model').notNullable(); // 'Transit', 'Sprinter', etc.
    table.integer('year').notNullable();
    table.decimal('fuel_efficiency_kmpl', 8, 2).notNullable(); // km per liter
    table.decimal('tank_capacity_liters', 8, 2).notNullable();
    table.decimal('current_fuel_level', 8, 2).defaultTo(0); // current fuel in liters
    table.decimal('total_distance_km', 10, 2).defaultTo(0); // odometer reading
    table.string('status').defaultTo('available'); // 'available', 'on-route', 'maintenance'
    table.string('registration_number').nullable(); // Ghana vehicle registration
    table.string('driver_name').nullable(); // Assigned driver name
    table.string('driver_contact').nullable(); // Driver phone number
    table.integer('fuel_percentage').nullable(); // Calculated fuel percentage
    table.integer('estimated_range_km').nullable(); // Calculated range
    table.boolean('needs_refuel').defaultTo(false); // Auto-calculated refuel flag
    table.timestamps(true, true);
  });

  // Create fuel_logs table for tracking actual consumption
  await knex.schema.createTable('fuel_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    table.string('trip_type').notNullable(); // 'collection', 'delivery', 'maintenance'
    table.string('related_id').nullable(); // delivery_id or report_id
    table.decimal('distance_km', 8, 2).notNullable();
    table.decimal('fuel_consumed_liters', 8, 2).notNullable();
    table.decimal('actual_efficiency_kmpl', 8, 2).notNullable();
    table.decimal('fuel_cost', 8, 2).nullable(); // cost in local currency
    table.string('route_description').nullable();
    table.timestamp('trip_start').notNullable();
    table.timestamp('trip_end').notNullable();
    table.string('logged_by').nullable(); // dispatcher/driver ID
    table.timestamps(true, true);
  });

  // Add fuel tracking columns to deliveries table
  await knex.schema.alterTable('deliveries', (table) => {
    table.decimal('planned_distance_km', 8, 2).nullable();
    table.decimal('actual_distance_km', 8, 2).nullable();
    table.decimal('fuel_consumed_liters', 8, 2).nullable();
    table.decimal('fuel_cost', 8, 2).nullable();
    table.timestamp('actual_departure').nullable();
    table.timestamp('actual_arrival').nullable();
  });

  // Insert sample vehicles with realistic fuel efficiency data
  await knex('vehicles').insert([
    {
      id: 'T001',
      type: 'truck',
      make: 'Ford',
      model: 'F-450',
      year: 2020,
      fuel_efficiency_kmpl: 8.5, // Realistic for waste collection truck
      tank_capacity_liters: 150,
      current_fuel_level: 120,
      total_distance_km: 45000,
      status: 'available'
    },
    {
      id: 'T002',
      type: 'truck',
      make: 'Mercedes',
      model: 'Atego',
      year: 2019,
      fuel_efficiency_kmpl: 9.2,
      tank_capacity_liters: 140,
      current_fuel_level: 100,
      total_distance_km: 38000,
      status: 'available'
    },
    {
      id: 'T003',
      type: 'van',
      make: 'Ford',
      model: 'Transit',
      year: 2021,
      fuel_efficiency_kmpl: 12.5, // Better efficiency for smaller vehicle
      tank_capacity_liters: 80,
      current_fuel_level: 65,
      total_distance_km: 22000,
      status: 'available'
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('deliveries', (table) => {
    table.dropColumn('planned_distance_km');
    table.dropColumn('actual_distance_km');
    table.dropColumn('fuel_consumed_liters');
    table.dropColumn('fuel_cost');
    table.dropColumn('actual_departure');
    table.dropColumn('actual_arrival');
  });
  
  await knex.schema.dropTableIfExists('fuel_logs');
  await knex.schema.dropTableIfExists('vehicles');
} 