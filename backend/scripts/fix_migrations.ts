import knexConfig from '../knexfile';
import Knex from 'knex';

async function fixMigrations() {
  const knex = Knex(knexConfig.development);
  try {
    const deleted = await knex('knex_migrations')
      .where('name', '20250615000800_create_images_table.ts')
      .del();
    console.log(`Deleted ${deleted} broken migration entries.`);
  } catch (err) {
    console.error('Error deleting migration entry:', err);
  } finally {
    await knex.destroy();
  }
}

fixMigrations(); 