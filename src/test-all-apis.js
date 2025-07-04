// Comprehensive API test from frontend perspective
import { environment } from './config/environment.ts';

console.log('🧪 COMPREHENSIVE API TESTING FROM FRONTEND...');
console.log('============================================');

const API_BASE_URL = environment.getApiUrl();
const ML_SERVICE_URL = environment.getMlServiceUrl();
const YOLO_API_URL = environment.getYoloApiUrl();

console.log('Using URLs:');
console.log('- API Base:', API_BASE_URL);
console.log('- ML Service:', ML_SERVICE_URL);
console.log('- YOLO API:', YOLO_API_URL);

async function testEndpoint(url, name) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data sample: ${JSON.stringify(data).substring(0, 200)}...`);
      return true;
    } else {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   StatusText: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('\n🚀 STARTING COMPREHENSIVE API TESTS...\n');
  
  const tests = [
    // Backend endpoints
    [`${API_BASE_URL.replace('/api', '')}/health`, 'Backend Health'],
    [`${API_BASE_URL}/auth/waste-sites`, 'Waste Sites'],
    [`${API_BASE_URL}/auth/notifications/recycler`, 'Recycler Notifications'],
    [`${API_BASE_URL}/auth/notifications/dispatcher`, 'Dispatcher Notifications'],
    [`${API_BASE_URL}/auth/reports/active`, 'Active Reports'],
    [`${API_BASE_URL}/auth/reports/threshold-status`, 'Threshold Status'],
    [`${API_BASE_URL}/fuel/vehicles`, 'Fuel Vehicles'],
    [`${API_BASE_URL}/fuel/analytics?period=7`, 'Fuel Analytics'],
    
    // ML Service endpoints
    [`${ML_SERVICE_URL}/health`, 'ML Service Health'],
    [`${ML_SERVICE_URL}/forecast/next-day`, 'ML Forecast'],
    
    // YOLO API
    [`${YOLO_API_URL}/health`, 'YOLO API Health'],
  ];
  
  let passed = 0;
  const total = tests.length;
  
  for (const [url, name] of tests) {
    if (await testEndpoint(url, name)) {
      passed++;
    }
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS:');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`❌ Failed: ${total - passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 ALL APIS WORKING! Your app should be fully functional!');
  } else {
    console.log('\n🚨 Some APIs are failing. Check the errors above.');
  }
  
  return passed === total;
}

// Run the test
testAllEndpoints().then(success => {
  if (success) {
    console.log('\n🌟 Ready to deploy! Everything is working!');
  } else {
    console.log('\n⚠️  Need to fix failing APIs before deployment.');
  }
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});

// Export for use in components
export { testAllEndpoints }; 