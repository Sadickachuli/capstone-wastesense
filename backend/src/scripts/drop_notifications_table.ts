import { db } from '../db';

async function main() {
  try {
    await db.schema.dropTableIfExists('user_notifications');
    console.log('Dropped user_notifications table.');
    await db.schema.dropTableIfExists('notifications');
    console.log('Dropped notifications table.');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping tables:', err);
    process.exit(1);
  }
}

main(); 