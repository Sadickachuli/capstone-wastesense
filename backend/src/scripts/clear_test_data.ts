import { db } from '../db';

async function clearTestData() {
  try {
    console.log('🧹 Starting to clear test data...');

    // Clear reports (bin full reports)
    const deletedReports = await db('reports').del();
    console.log(`✅ Cleared ${deletedReports} reports`);

    // Clear schedules
    const deletedSchedules = await db('schedules').del();
    console.log(`✅ Cleared ${deletedSchedules} schedules`);

    // Clear deliveries  
    const deletedDeliveries = await db('deliveries').del();
    console.log(`✅ Cleared ${deletedDeliveries} deliveries`);

    // Clear notifications (threshold alerts, etc.)
    const deletedNotifications = await db('notifications').del();
    console.log(`✅ Cleared ${deletedNotifications} notifications`);

    // Clear fuel logs
    const deletedFuelLogs = await db('fuel_logs').del();
    console.log(`✅ Cleared ${deletedFuelLogs} fuel logs`);

    // Reset vehicle status to available
    const updatedVehicles = await db('vehicles')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      });
    console.log(`✅ Reset ${updatedVehicles} vehicles to available status`);

    console.log('\n🎉 Test data cleared successfully!');
    console.log('📋 Preserved:');
    console.log('   - Users (residents, dispatchers, recyclers)');
    console.log('   - Vehicles (reset to available status)');
    console.log('   - Waste sites and their compositions');
    console.log('   - System configuration');

    // Show remaining data summary
    const userCount = await db('users').count('* as count').first();
    const vehicleCount = await db('vehicles').count('* as count').first();
    const wasteSiteCount = await db('waste_sites').count('* as count').first();

    console.log('\n📊 Remaining data:');
    console.log(`   - Users: ${userCount?.count || 0}`);
    console.log(`   - Vehicles: ${vehicleCount?.count || 0}`);
    console.log(`   - Waste Sites: ${wasteSiteCount?.count || 0}`);

  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  } finally {
    process.exit(0);
  }
}

clearTestData(); 