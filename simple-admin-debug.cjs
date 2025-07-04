const axios = require('axios');

const LOCAL_URL = 'http://localhost:3001';

async function debugAdminLogin() {
  console.log('🐛 Debugging Admin Login Issue\n');
  
  // Test different login variations
  console.log('1. Testing different login combinations...');
  
  const loginAttempts = [
    { employee_id: 'ADMIN001', password: 'password123' },
    { email: 'admin@wastesense.com', password: 'password123' },
    { employee_id: 'admin001', password: 'password123' }, // lowercase
    { employee_id: 'ADMIN001', password: 'Password123' }, // different case
    { employee_id: 'ADMIN001', password: 'admin123' },    // different password
  ];
  
  for (const attempt of loginAttempts) {
    try {
      console.log(`   Trying: ${JSON.stringify(attempt)}`);
      const response = await axios.post(`${LOCAL_URL}/api/auth/login`, attempt);
      console.log(`   ✅ SUCCESS! User: ${response.data.user.name}, Role: ${response.data.user.role}`);
      return response.data.token;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Test if dispatcher login still works (for comparison)
  console.log('\n2. Testing dispatcher login for comparison...');
  try {
    const dispResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    console.log(`   ✅ Dispatcher login works: ${dispResponse.data.user.name} (${dispResponse.data.user.role})`);
  } catch (error) {
    console.log(`   ❌ Dispatcher login also failed: ${error.message}`);
  }
  
  return null;
}

async function recreateAdminUser() {
  console.log('\n🔧 Attempting to recreate admin user...');
  
  try {
    // Call setup-database multiple times
    console.log('   Calling setup-database (1st time)...');
    const response1 = await axios.post(`${LOCAL_URL}/setup-database`);
    console.log(`   Response: ${JSON.stringify(response1.data)}`);
    
    console.log('   Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('   Calling setup-database (2nd time)...');
    const response2 = await axios.post(`${LOCAL_URL}/setup-database`);
    console.log(`   Response: ${JSON.stringify(response2.data)}`);
    
    console.log('   Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try admin login again
    console.log('   Testing admin login after recreation...');
    const loginResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'ADMIN001',
      password: 'password123'
    });
    
    console.log('🎉 ADMIN LOGIN NOW WORKS!');
    console.log(`   Admin: ${loginResponse.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.user.role}`);
    console.log(`   Employee ID: ${loginResponse.data.user.employee_id}`);
    return loginResponse.data.token;
    
  } catch (error) {
    console.log('❌ Recreation failed:', error.response?.data?.message || error.message);
    console.log('   Status:', error.response?.status);
    console.log('   Full error:', error.response?.data);
    return null;
  }
}

async function checkUsersInDatabase() {
  console.log('\n📊 Checking users in database...');
  
  try {
    // Get dispatcher token first
    const dispResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    
    const token = dispResponse.data.token;
    
    // Get all users
    const usersResponse = await axios.get(`${LOCAL_URL}/api/auth/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   Users found:');
    usersResponse.data.users.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`);
      console.log(`     Employee ID: ${user.employee_id || 'N/A'}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Created: ${user.created_at}`);
      console.log('');
    });
    
    const adminUser = usersResponse.data.users.find(u => u.role === 'admin');
    return adminUser ? adminUser : null;
    
  } catch (error) {
    console.log('❌ Could not check users:', error.message);
    return null;
  }
}

async function runDebug() {
  console.log('🔍 ADMIN LOGIN DEBUG SESSION');
  console.log('===============================');
  
  // Step 1: Check current database state
  const adminUser = await checkUsersInDatabase();
  
  // Step 2: Try login variations
  let token = await debugAdminLogin();
  
  // Step 3: Try recreation if needed
  if (!token) {
    token = await recreateAdminUser();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEBUG RESULTS');
  console.log('='.repeat(60));
  
  if (token) {
    console.log('🎉 ADMIN LOGIN IS NOW WORKING!');
    console.log('✅ Ready for frontend testing');
    console.log('\n📝 Admin Credentials:');
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: password123');
    console.log('\n🚀 Next steps:');
    console.log('1. Start frontend: npm run dev');
    console.log('2. Go to: http://localhost:5173');
    console.log('3. Login with admin credentials');
    console.log('4. Navigate to admin dashboard');
  } else {
    console.log('❌ ADMIN LOGIN STILL FAILING');
    
    if (adminUser) {
      console.log('\n🔍 Admin user exists in database:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Employee ID: ${adminUser.employee_id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log('\n💡 This suggests a backend authentication logic issue');
      console.log('   Check backend server console for more detailed error logs');
    } else {
      console.log('\n❌ Admin user not found in database');
      console.log('   Database creation might be failing');
    }
  }
}

runDebug().catch(console.error); 