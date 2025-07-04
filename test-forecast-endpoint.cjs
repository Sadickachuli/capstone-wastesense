const axios = require('axios');

const ML_URL = 'https://wastesense-ml-forecasting.onrender.com';

console.log('🔮 TESTING FORECAST ENDPOINT SPECIFICALLY...\n');

async function testForecastEndpoint() {
  console.log('Testing ML Service Health...');
  try {
    const healthResponse = await axios.get(`${ML_URL}/health`, { timeout: 10000 });
    console.log('✅ ML Service Health:', healthResponse.data);
  } catch (error) {
    console.log('❌ ML Service Health failed:', error.message);
    return;
  }

  console.log('\nTesting Forecast Endpoint...');
  try {
    const forecastResponse = await axios.get(`${ML_URL}/forecast/next-day`, { 
      timeout: 60000 // 60 seconds timeout for ML processing
    });
    console.log('✅ Forecast Endpoint Working!');
    console.log('Response:', JSON.stringify(forecastResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Forecast Endpoint Failed:');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    
    // Try different forecast endpoints
    console.log('\n🔍 Trying alternative forecast endpoints...');
    
    const alternativeEndpoints = [
      `${ML_URL}/forecast`,
      `${ML_URL}/predict`,
      `${ML_URL}/forecast/daily`,
      `${ML_URL}/api/forecast`,
      `${ML_URL}/api/forecast/next-day`,
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`\nTrying: ${endpoint}`);
        const response = await axios.get(endpoint, { timeout: 30000 });
        console.log(`✅ ${endpoint} works!`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        break;
      } catch (altError) {
        console.log(`❌ ${endpoint} failed:`, altError.message);
      }
    }
  }
}

async function checkMlServiceRoutes() {
  console.log('\n🔍 CHECKING ML SERVICE AVAILABLE ROUTES...\n');
  
  try {
    // Try to get the ML service documentation or routes
    const routes = await axios.get(`${ML_URL}/docs`, { timeout: 10000 });
    console.log('✅ ML Service Documentation available');
  } catch (error) {
    console.log('❌ No documentation endpoint');
  }
  
  try {
    // Try to get the ML service info
    const info = await axios.get(`${ML_URL}/`, { timeout: 10000 });
    console.log('✅ ML Service Root:', info.data);
  } catch (error) {
    console.log('❌ No root endpoint:', error.message);
  }
}

async function runTests() {
  console.log('🧪 COMPREHENSIVE ML SERVICE TESTING');
  console.log('====================================');
  
  await checkMlServiceRoutes();
  await testForecastEndpoint();
}

runTests().catch(console.error); 