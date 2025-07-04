const axios = require('axios');

// URLs
const FRONTEND_URL = 'https://wastesense-frontend.onrender.com';
const BACKEND_URL = 'https://wastesense-backend.onrender.com';
const ML_URL = 'https://wastesense-ml-forecasting.onrender.com';

console.log('🔍 PRODUCTION DIAGNOSIS STARTING...\n');

async function testService(url, name) {
  try {
    console.log(`Testing ${name}...`);
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ ${name}: WORKING (${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testCriticalEndpoints() {
  console.log('🧪 TESTING CRITICAL ENDPOINTS:\n');
  
  const tests = [
    [`${BACKEND_URL}/health`, 'Backend Health'],
    [`${BACKEND_URL}/api/auth/waste-sites`, 'Waste Sites'],
    [`${BACKEND_URL}/api/auth/notifications/recycler`, 'Recycler Notifications'],
    [`${BACKEND_URL}/api/auth/notifications/dispatcher`, 'Dispatcher Notifications'], 
    [`${BACKEND_URL}/api/auth/reports/active`, 'Active Reports'],
    [`${BACKEND_URL}/api/fuel/vehicles`, 'Fuel Vehicles'],
    [`${BACKEND_URL}/api/fuel/analytics?period=7`, 'Fuel Analytics'],
    [`${BACKEND_URL}/api/auth/reports/threshold-status`, 'Threshold Status'],
    [`${ML_URL}/health`, 'ML Service Health'],
    [`${ML_URL}/forecast/next-day`, 'ML Forecast'],
  ];
  
  let working = 0;
  for (const [url, name] of tests) {
    if (await testService(url, name)) working++;
    console.log('');
  }
  
  console.log(`📊 RESULT: ${working}/${tests.length} endpoints working\n`);
  return working === tests.length;
}

async function testDatabaseSetup() {
  console.log('🗄️ TESTING DATABASE SETUP:\n');
  
  try {
    console.log('Checking if database is populated...');
    const response = await axios.get(`${BACKEND_URL}/api/auth/waste-sites`, { timeout: 10000 });
    
    if (response.data && response.data.length > 0) {
      console.log(`✅ Database has ${response.data.length} waste sites`);
      console.log(`   Sample site: ${response.data[0].name}`);
      return true;
    } else {
      console.log('❌ Database appears empty - need to setup');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot check database status');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function setupDatabase() {
  console.log('🛠️ SETTING UP DATABASE...\n');
  
  try {
    console.log('Calling setup-database endpoint...');
    const response = await axios.post(`${BACKEND_URL}/setup-database`, {}, { 
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Database setup completed');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log('❌ Database setup failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testAuth() {
  console.log('🔐 TESTING AUTHENTICATION:\n');
  
  try {
    console.log('Testing login with test credentials...');
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    }, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Authentication working');
      console.log(`   User: ${response.data.user.name} (${response.data.user.role})`);
      return response.data.token;
    } else {
      console.log('❌ No token returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return null;
  }
}

async function runFullDiagnosis() {
  console.log('=' * 60);
  console.log('🚀 FULL PRODUCTION DIAGNOSIS');
  console.log('=' * 60);
  
  // Step 1: Test basic connectivity
  const endpointsWorking = await testCriticalEndpoints();
  
  // Step 2: Check database
  let databaseReady = await testDatabaseSetup();
  
  // Step 3: Setup database if needed
  if (!databaseReady) {
    console.log('⚙️ Database needs setup, attempting...\n');
    databaseReady = await setupDatabase();
    
    if (databaseReady) {
      console.log('\n✅ Database setup completed, retesting...\n');
      databaseReady = await testDatabaseSetup();
    }
  }
  
  // Step 4: Test authentication
  const authToken = await testAuth();
  
  // Final assessment
  console.log('\n' + '=' * 60);
  console.log('📋 FINAL DIAGNOSIS:');
  console.log('=' * 60);
  
  const issues = [];
  
  if (!endpointsWorking) issues.push('❌ Some endpoints not working');
  if (!databaseReady) issues.push('❌ Database not properly set up');
  if (!authToken) issues.push('❌ Authentication not working');
  
  if (issues.length === 0) {
    console.log('🎉 ALL SYSTEMS WORKING! The app should be functional.');
  } else {
    console.log('🚨 ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Check Render service logs');
    console.log('2. Restart all services on Render');
    console.log('3. Verify environment variables');
    console.log('4. Check database connection');
  }
  
  console.log('\n🌐 Access your app: ' + FRONTEND_URL);
}

runFullDiagnosis().catch(console.error); 