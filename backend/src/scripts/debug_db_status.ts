import { db } from '../db';

async function main() {
  console.log('--- Dispatcher Notifications ---');
  const notifications = await db('notifications')
    .where('for_role', 'dispatcher')
    .orderBy('created_at', 'desc')
    .select('id', 'title', 'message', 'archived', 'created_at');
  notifications.forEach(n => {
    console.log(n);
  });

  console.log('\n--- Reports ---');
  const reports = await db('reports')
    .orderBy('timestamp', 'desc')
    .select('id', 'user_id', 'status', 'location', 'description', 'timestamp');
  reports.forEach(r => {
    console.log(r);
  });

  process.exit(0);
}

// Print all waste_compositions records
async function printWasteCompositions() {
  console.log('\n--- Waste Compositions ---');
  const compositions = await db('waste_compositions')
    .orderBy('created_at', 'desc');
  compositions.forEach(c => {
    console.log(c);
  });
}

main()
  .then(printWasteCompositions)
  .catch(err => {
    console.error('Error running debug script:', err);
    process.exit(1);
  }); 