const db = require('./src/db.ts');

async function clearSchedules() {
  try {
    const deleted = await db('schedules').del();
    console.log('✅ Cleared', deleted, 'schedules');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing schedules:', error);
    process.exit(1);
  }
}

clearSchedules(); 