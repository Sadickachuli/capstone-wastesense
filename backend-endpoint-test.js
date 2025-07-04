const axios = require('axios');

const API_BASE_URL = 'https://wastesense-backend.onrender.com/api';
const ML_SERVICE_URL = 'https://wastesense-ml-forecasting.onrender.com';

async function testEndpoint(url, description) {
  try {
    console.log(`Testing ${description}...`);
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ ${description}: Status ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      console.log(`   Response data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  const tests = [
    // Health checks
    [`${API_BASE_URL}/../health`, 'Backend Health Check'],
    [`${ML_SERVICE_URL}/health`, 'ML Service Health Check'],
    
    // Auth endpoints
    [`${API_BASE_URL}/auth/reports/threshold-status`, 'Threshold Status'],
    [`${API_BASE_URL}/auth/notifications/dispatcher`, 'Dispatcher Notifications'],
    [`${API_BASE_URL}/auth/notifications/recycler`, 'Recycler Notifications'],
    [`${API_BASE_URL}/auth/reports/active`, 'Active Reports'],
    [`${API_BASE_URL}/auth/dispatch/recommendation`, 'Dispatch Recommendation'],
    [`${API_BASE_URL}/auth/waste-sites`, 'Waste Sites'],
    [`${API_BASE_URL}/auth/config`, 'System Config'],
    
    // Fuel endpoints
    [`${API_BASE_URL}/fuel/vehicles`, 'Fuel Vehicles'],
    [`${API_BASE_URL}/fuel/analytics?period=7`, 'Fuel Analytics'],
    
    // Forecast endpoints
    [`${API_BASE_URL}/forecast/next-day`, 'Backend Forecast'],
    [`${ML_SERVICE_URL}/forecast/next-day`, 'ML Service Forecast'],
    [`${ML_SERVICE_URL}/forecast/history`, 'ML Service History'],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [url, description] of tests) {
    if (await testEndpoint(url, description)) {
      passed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed < total) {
    console.log('\n🔧 Fix needed endpoints:');
    console.log('1. Check if backend is fully deployed');
    console.log('2. Check if ML service is running');
    console.log('3. Verify CORS configuration');
    console.log('4. Check environment variables');
  } else {
    console.log('\n🎉 All endpoints are working!');
  }
}

runTests().catch(console.error); 