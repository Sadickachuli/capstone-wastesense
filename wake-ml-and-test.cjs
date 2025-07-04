const axios = require('axios');

const BACKEND_URL = 'https://wastesense-backend.onrender.com';
const ML_URL = 'https://wastesense-ml-forecasting.onrender.com';

console.log('🚀 WAKING UP ML SERVICE & TESTING DATABASE...\n');

async function wakeUpMlService() {
  console.log('💤 Waking up ML service...');
  
  try {
    // Try to wake up the ML service with a simple GET request
    const response = await axios.get(`${ML_URL}/health`, { 
      timeout: 30000  // 30 second timeout
    });
    
    console.log('✅ ML Service is now AWAKE!');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log('❌ ML Service still sleeping or down');
    console.log(`   Error: ${error.message}`);
    
    // Try to wake it up with a POST request
    try {
      console.log('🔄 Trying to wake with POST request...');
      await axios.post(`${ML_URL}/forecast/next-day`, {}, { timeout: 30000 });
      console.log('✅ ML Service responded to POST!');
      return true;
    } catch (postError) {
      console.log('❌ ML Service completely unresponsive');
      return false;
    }
  }
}

async function testDatabaseData() {
  console.log('\n🗄️ TESTING DATABASE DATA...\n');
  
  try {
    // Test waste sites
    console.log('Testing waste sites...');
    const wasteSites = await axios.get(`${BACKEND_URL}/api/auth/waste-sites`, { timeout: 10000 });
    console.log(`✅ Waste Sites: ${JSON.stringify(wasteSites.data, null, 2)}`);
    
    // Test vehicles
    console.log('\nTesting vehicles...');
    const vehicles = await axios.get(`${BACKEND_URL}/api/fuel/vehicles`, { timeout: 10000 });
    console.log(`✅ Vehicles: ${JSON.stringify(vehicles.data, null, 2)}`);
    
    // Test system config
    console.log('\nTesting system config...');
    const config = await axios.get(`${BACKEND_URL}/api/auth/reports/threshold-status`, { timeout: 10000 });
    console.log(`✅ System Config: ${JSON.stringify(config.data, null, 2)}`);
    
    return true;
  } catch (error) {
    console.log('❌ Database test failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('=' * 60);
  console.log('🔥 AGGRESSIVE PRODUCTION FIXES');
  console.log('=' * 60);
  
  // Step 1: Wake up ML service
  const mlAwake = await wakeUpMlService();
  
  // Step 2: Test database data
  const dbWorking = await testDatabaseData();
  
  // Step 3: If ML service is awake, test forecast
  if (mlAwake) {
    console.log('\n🔮 TESTING FORECAST FUNCTIONALITY...\n');
    
    try {
      const forecastResponse = await axios.get(`${ML_URL}/forecast/next-day`, { timeout: 15000 });
      console.log('✅ Forecast working!');
      console.log(`   Response: ${JSON.stringify(forecastResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ Forecast failed');
      console.log(`   Error: ${error.message}`);
    }
  }
  
  // Final summary
  console.log('\n' + '=' * 60);
  console.log('📋 FINAL STATUS:');
  console.log('=' * 60);
  
  console.log(`ML Service: ${mlAwake ? '✅ AWAKE' : '❌ SLEEPING'}`);
  console.log(`Database: ${dbWorking ? '✅ WORKING' : '❌ ISSUES'}`);
  
  if (mlAwake && dbWorking) {
    console.log('\n🎉 EVERYTHING SHOULD BE WORKING NOW!');
    console.log('🌐 Go test your app: https://wastesense-frontend.onrender.com');
  } else {
    console.log('\n🚨 STILL HAVE ISSUES TO FIX');
  }
}

runTests().catch(console.error); 