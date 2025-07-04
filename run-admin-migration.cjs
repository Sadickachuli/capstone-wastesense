const axios = require('axios');

const BACKEND_URL = 'https://wastesense-backend.onrender.com';

console.log('🔧 RUNNING ADMIN MIGRATION AND TESTING\n');

async function runMigration() {
  console.log('1. Triggering database setup to run migrations...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/setup-database`, {}, { 
      timeout: 90000, // Longer timeout for migration
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Database setup and migration completed');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n2. Testing admin login...');
  
  // Wait a bit for the migration to be fully applied
  console.log('   Waiting 10 seconds for migration to take effect...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      employee_id: 'ADMIN001',
      password: 'password123'
    }, { timeout: 15000 });

    console.log('✅ Admin login successful!');
    console.log(`   Admin name: ${response.data.user.name}`);
    console.log(`   Admin role: ${response.data.user.role}`);
    console.log(`   Token received: ${response.data.token ? 'Yes' : 'No'}`);
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Admin login failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function testAdminEndpoints(token) {
  console.log('\n3. Testing admin endpoints...');
  
  const endpoints = [
    { url: '/api/auth/admin/stats', name: 'System Stats' },
    { url: '/api/auth/admin/users', name: 'All Users' },
    { url: '/api/auth/admin/reports', name: 'All Reports' }
  ];

  let workingEndpoints = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing ${endpoint.name}...`);
      const response = await axios.get(`${BACKEND_URL}${endpoint.url}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });

      console.log(`   ✅ ${endpoint.name}: Working`);
      workingEndpoints++;
      
      if (endpoint.url.includes('stats')) {
        console.log(`      - Total Users: ${response.data.totalUsers}`);
        console.log(`      - Total Reports: ${response.data.totalReports}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Failed - ${error.message}`);
    }
  }
  
  return workingEndpoints === endpoints.length;
}

async function testAccountDeletion() {
  console.log('\n4. Testing account deletion endpoint...');
  
  try {
    // Test with invalid user ID (should fail gracefully)
    await axios.delete(`${BACKEND_URL}/api/auth/account/invalid-id`, {
      data: { password: 'test123' },
      timeout: 10000
    });
    
    console.log('❌ Account deletion should have failed for invalid user');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Account deletion endpoint working (correctly rejected invalid user)');
      return true;
    } else {
      console.log(`❌ Account deletion endpoint error: ${error.message}`);
      return false;
    }
  }
}

async function runFullTest() {
  console.log('🚀 ADMIN FUNCTIONALITY COMPLETE TEST');
  console.log('====================================');
  
  // Step 1: Run migration
  const migrationSuccess = await runMigration();
  if (!migrationSuccess) {
    console.log('\n❌ Migration failed. Cannot proceed with testing.');
    return;
  }
  
  // Step 2: Test admin login
  const adminToken = await testAdminLogin();
  if (!adminToken) {
    console.log('\n❌ Admin login failed. Cannot test admin endpoints.');
    return;
  }
  
  // Step 3: Test admin endpoints
  const endpointsWorking = await testAdminEndpoints(adminToken);
  
  // Step 4: Test account deletion
  const deletionWorking = await testAccountDeletion();
  
  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 FINAL TEST RESULTS:');
  console.log('='.repeat(70));
  
  console.log(`✅ Database Migration: ${migrationSuccess ? 'Success' : 'Failed'}`);
  console.log(`✅ Admin Login: ${adminToken ? 'Working' : 'Failed'}`);
  console.log(`✅ Admin Endpoints: ${endpointsWorking ? 'All Working' : 'Some Failed'}`);
  console.log(`✅ Account Deletion: ${deletionWorking ? 'Working' : 'Failed'}`);
  
  if (migrationSuccess && adminToken && endpointsWorking && deletionWorking) {
    console.log('\n🎉 ALL FEATURES WORKING PERFECTLY!');
    console.log('\n📱 How to use your new features:');
    console.log('👤 Admin Access:');
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: password123');
    console.log('   Dashboard: Navigate to Admin Dashboard after login');
    console.log('\n🏠 Resident Account Deletion:');
    console.log('   Go to Profile page → Delete Account button');
    console.log('   Enter password to confirm deletion');
    console.log('\n🌐 Frontend: https://wastesense-frontend.onrender.com');
  } else {
    console.log('\n⚠️  Some features may not be working correctly.');
    console.log('   Check the test results above for details.');
  }
}

runFullTest().catch(console.error); 