const axios = require('axios');

const BACKEND_URL = 'https://wastesense-backend.onrender.com';

console.log('🔧 FIXING DATABASE ENUM TO INCLUDE ADMIN ROLE\n');

async function fixDatabaseEnum() {
  console.log('1. Adding admin role to database enum...');
  
  try {
    // Call the database setup endpoint which should handle the enum update
    const response = await axios.post(`${BACKEND_URL}/setup-database`, {}, { 
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Database enum update completed');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    // Wait a moment for the change to take effect
    console.log('\n⏳ Waiting 5 seconds for changes to take effect...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.log('❌ Database enum update failed:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  console.log('2. Testing admin login after enum fix...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      employee_id: 'ADMIN001',
      password: 'password123'
    }, { timeout: 15000 });

    if (response.data.token && response.data.user.role === 'admin') {
      console.log('✅ Admin login successful!');
      console.log(`   Admin name: ${response.data.user.name}`);
      console.log(`   Admin role: ${response.data.user.role}`);
      console.log(`   Admin facility: ${response.data.user.facility}`);
      return response.data.token;
    } else {
      console.log('❌ Admin login failed - no token or wrong role');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Admin login still failing:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function testAdminEndpoint(token) {
  console.log('\n3. Testing admin endpoint...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 15000
    });

    console.log('✅ Admin endpoint working!');
    console.log(`   Total Users: ${response.data.totalUsers}`);
    console.log(`   Total Reports: ${response.data.totalReports}`);
    console.log(`   Total Waste Sites: ${response.data.totalWasteSites}`);
    
    return true;
  } catch (error) {
    console.log('❌ Admin endpoint failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runFix() {
  console.log('🛠️  FIXING ADMIN ROLE ISSUES');
  console.log('===============================');
  
  // Step 1: Fix database enum
  const enumFixed = await fixDatabaseEnum();
  
  if (!enumFixed) {
    console.log('\n❌ Could not fix database enum. Manual intervention may be needed.');
    return;
  }
  
  // Step 2: Test admin login
  const adminToken = await testAdminLogin();
  
  if (!adminToken) {
    console.log('\n❌ Admin login still not working. Need to investigate further.');
    return;
  }
  
  // Step 3: Test admin endpoints
  const endpointWorking = await testAdminEndpoint(adminToken);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL STATUS:');
  console.log('='.repeat(60));
  
  if (adminToken && endpointWorking) {
    console.log('🎉 ADMIN FUNCTIONALITY IS NOW WORKING!');
    console.log('✅ Database Enum: Updated');
    console.log('✅ Admin Login: Working');
    console.log('✅ Admin Endpoints: Available');
    console.log('✅ Admin Dashboard: Ready to use');
    
    console.log('\n📝 Admin Access:');
    console.log('👤 Employee ID: ADMIN001');
    console.log('🔐 Password: password123');
    console.log('🌐 Login at: https://wastesense-frontend.onrender.com');
    console.log('🏠 Dashboard: Navigate to Admin Dashboard after login');
  } else {
    console.log('❌ ADMIN FUNCTIONALITY STILL HAS ISSUES');
    console.log('Need to check backend logs and database status');
  }
}

runFix().catch(console.error); 