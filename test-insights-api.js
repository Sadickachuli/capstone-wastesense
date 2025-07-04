const axios = require('axios');

// Test the waste-compositions API endpoints
async function testInsightsAPI() {
  try {
    console.log('Testing waste-compositions API endpoints...');
    
    // Test 1: Get all waste compositions history
    console.log('\n1. Testing GET /api/auth/waste-compositions/history');
    const response1 = await axios.get('http://localhost:3001/api/auth/waste-compositions/history');
    console.log('Status:', response1.status);
    console.log('History length:', response1.data.history.length);
    if (response1.data.history.length > 0) {
      console.log('First record:', response1.data.history[0]);
    }
    
    // Test 2: Get waste compositions for specific site
    console.log('\n2. Testing GET /api/auth/waste-compositions/history?site_id=WS001');
    const response2 = await axios.get('http://localhost:3001/api/auth/waste-compositions/history?site_id=WS001');
    console.log('Status:', response2.status);
    console.log('WS001 history length:', response2.data.history.length);
    if (response2.data.history.length > 0) {
      console.log('First WS001 record:', response2.data.history[0]);
    }
    
    // Test 3: Check for available dates
    console.log('\n3. Checking available dates...');
    const history = response1.data.history;
    const dates = Array.from(new Set(history.map(record => record.date))).sort();
    console.log('Available dates:', dates);
    
    console.log('\n✅ All tests passed! The API endpoints are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testInsightsAPI(); 