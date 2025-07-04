const axios = require('axios');

const LOCAL_URL = 'http://localhost:3001';

async function testExactAdminLogin() {
  console.log('🎯 Testing Exact Admin Login\n');
  
  const adminCredentials = {
    employee_id: 'ADMIN001',
    password: 'password123'
  };
  
  console.log('Admin credentials being tested:');
  console.log(JSON.stringify(adminCredentials, null, 2));
  console.log('');
  
  try {
    console.log('Making login request...');
    const response = await axios.post(`${LOCAL_URL}/api/auth/login`, adminCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎉 LOGIN SUCCESSFUL!');
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.token;
    
  } catch (error) {
    console.log('❌ LOGIN FAILED');
    console.log('Error details:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message}`);
    console.log(`Full response data:`, error.response?.data);
    
    // Let's also check the exact request that was sent
    console.log('\nRequest details:');
    console.log(`URL: ${error.config?.url}`);
    console.log(`Method: ${error.config?.method}`);
    console.log(`Data: ${error.config?.data}`);
    
    return null;
  }
}

async function compareWithDispatcher() {
  console.log('\n🔄 Comparing with Dispatcher Login\n');
  
  const dispatcherCredentials = {
    employee_id: 'DISP001',
    password: 'password123'
  };
  
  console.log('Dispatcher credentials:');
  console.log(JSON.stringify(dispatcherCredentials, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(`${LOCAL_URL}/api/auth/login`, dispatcherCredentials);
    console.log('✅ Dispatcher login works!');
    console.log(`User: ${response.data.user.name} (${response.data.user.role})`);
    console.log(`Employee ID: ${response.data.user.employee_id}`);
    console.log(`Created: ${response.data.user.createdAt}`);
    
    return true;
  } catch (error) {
    console.log('❌ Dispatcher login failed too!');
    console.log(`Error: ${error.response?.data?.message}`);
    return false;
  }
}

async function checkDatabaseDirectly() {
  console.log('\n📊 Checking Database Directly\n');
  
  try {
    // Get a token from dispatcher
    const dispResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    
    // Get all users
    const usersResponse = await axios.get(`${LOCAL_URL}/api/auth/admin/users`, {
      headers: { 'Authorization': `Bearer ${dispResponse.data.token}` }
    });
    
    const adminUser = usersResponse.data.users.find(u => u.role === 'admin');
    
    if (adminUser) {
      console.log('Admin user found in database:');
      console.log(`ID: ${adminUser.id}`);
      console.log(`Name: ${adminUser.name}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Employee ID: ${adminUser.employee_id}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`Created: ${adminUser.created_at}`);
      console.log(`Facility: ${adminUser.facility}`);
      return adminUser;
    } else {
      console.log('❌ No admin user found in database');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Could not check database:', error.message);
    return null;
  }
}

async function runFocusedTest() {
  console.log('🔬 FOCUSED ADMIN LOGIN TEST');
  console.log('===========================');
  
  // Step 1: Check database
  const adminUser = await checkDatabaseDirectly();
  
  // Step 2: Test dispatcher for comparison
  const dispatcherWorks = await compareWithDispatcher();
  
  // Step 3: Test exact admin login
  const adminToken = await testExactAdminLogin();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 FOCUSED TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log(`Database has admin user: ${adminUser ? '✅ Yes' : '❌ No'}`);
  console.log(`Dispatcher login works: ${dispatcherWorks ? '✅ Yes' : '❌ No'}`);
  console.log(`Admin login works: ${adminToken ? '✅ Yes' : '❌ No'}`);
  
  if (adminUser && dispatcherWorks && !adminToken) {
    console.log('\n🔍 ANALYSIS:');
    console.log('- Admin user exists in database ✅');
    console.log('- Other logins work (dispatcher) ✅');
    console.log('- Admin login fails ❌');
    console.log('\n💡 This suggests:');
    console.log('1. Password hash issue for admin user specifically');
    console.log('2. Backend auth logic treating admin differently');
    console.log('3. Database constraint or validation issue');
    
    console.log('\n🛠️ SUGGESTED FIXES:');
    console.log('1. Check backend server console logs for detailed errors');
    console.log('2. Manually recreate admin user with known working hash');
    console.log('3. Add debug logging to backend auth controller');
  }
  
  if (adminToken) {
    console.log('\n🎉 ADMIN LOGIN WORKING!');
    console.log('You can now test the frontend with these credentials:');
    console.log('Employee ID: ADMIN001');
    console.log('Password: password123');
  }
}

runFocusedTest().catch(console.error); 