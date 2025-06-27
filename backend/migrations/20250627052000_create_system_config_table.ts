import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_config', (table) => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.string('description');
    table.timestamps(true, true);
  });

  // Insert default configuration
  await knex('system_config').insert([
    {
      key: 'zone_customers',
      value: JSON.stringify({
        'Ablekuma North': { totalCustomers: 145 },
        'Ayawaso West': { totalCustomers: 82 }
      }),
      description: 'Customer counts per zone for threshold calculations'
    },
    {
      key: 'dumping_sites',
      value: JSON.stringify([
        { name: 'Borteyman Landfill', distance: 25, coordinates: '5.8037, -0.0874' },
        { name: 'Kpone Engineered Landfill', distance: 18, coordinates: '5.7081, 0.0074' }
      ]),
      description: 'Available dumping sites with distances'
    },
    {
      key: 'fuel_prices',
      value: JSON.stringify({
        petrol: 12.0,
        diesel: 9.5
      }),
      description: 'Current fuel prices per liter in GHS'
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('system_config');
} 