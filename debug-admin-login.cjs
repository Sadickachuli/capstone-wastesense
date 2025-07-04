const axios = require('axios');
const bcrypt = require('bcryptjs');

const LOCAL_URL = 'http://localhost:3001';

async function debugAdminLogin() {
  console.log('🐛 Debugging Admin Login Issue\n');
  
  // Test 1: Check if the hash is correct
  console.log('1. Testing password hash...');
  const testHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  const passwordMatch = await bcrypt.compare('password123', testHash);
  console.log(`   Password123 matches test hash: ${passwordMatch}`);
  
  // Test 2: Try different login variations
  console.log('\n2. Testing different login combinations...');
  
  const loginAttempts = [
    { employee_id: 'ADMIN001', password: 'password123' },
    { email: 'admin@wastesense.com', password: 'password123' },
    { employee_id: 'admin001', password: 'password123' }, // lowercase
    { employee_id: 'ADMIN001', password: 'Password123' }, // different case
  ];
  
  for (const attempt of loginAttempts) {
    try {
      console.log(`   Trying: ${JSON.stringify(attempt)}`);
      const response = await axios.post(`${LOCAL_URL}/api/auth/login`, attempt);
      console.log(`   ✅ SUCCESS! Role: ${response.data.user.role}`);
      return response.data.token;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Test 3: Test if dispatcher login still works (for comparison)
  console.log('\n3. Testing dispatcher login for comparison...');
  try {
    const dispResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    console.log(`   ✅ Dispatcher login works: ${dispResponse.data.user.name}`);
  } catch (error) {
    console.log(`   ❌ Dispatcher login also failed: ${error.message}`);
  }
  
  // Test 4: Check admin endpoints without token (should fail)
  console.log('\n4. Testing admin endpoint access...');
  try {
    await axios.get(`${LOCAL_URL}/api/auth/admin/stats`);
    console.log('   ❌ Admin endpoint accessible without auth (security issue!)');
  } catch (error) {
    console.log('   ✅ Admin endpoint properly protected');
  }
  
  return null;
}

async function manuallyFixAdmin() {
  console.log('\n🔧 Attempting to manually fix admin user...');
  
  try {
    // Call setup-database multiple times to ensure admin creation
    console.log('   Calling setup-database...');
    await axios.post(`${LOCAL_URL}/setup-database`);
    await axios.post(`${LOCAL_URL}/setup-database`);
    
    console.log('   Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try admin login again
    console.log('   Testing admin login after fix...');
    const response = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'ADMIN001',
      password: 'password123'
    });
    
    console.log('🎉 ADMIN LOGIN NOW WORKS!');
    console.log(`   Admin: ${response.data.user.name}`);
    console.log(`   Role: ${response.data.user.role}`);
    return response.data.token;
    
  } catch (error) {
    console.log('❌ Manual fix failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runDebug() {
  console.log('🔍 ADMIN LOGIN DEBUG SESSION');
  console.log('===============================');
  
  let token = await debugAdminLogin();
  
  if (!token) {
    token = await manuallyFixAdmin();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEBUG RESULTS');
  console.log('='.repeat(60));
  
  if (token) {
    console.log('🎉 ADMIN LOGIN IS NOW WORKING!');
    console.log('✅ You can proceed with frontend testing');
    console.log('✅ Admin credentials: ADMIN001 / password123');
    console.log('\n🚀 Next steps:');
    console.log('1. Start frontend: npm run dev');
    console.log('2. Go to: http://localhost:5173');
    console.log('3. Login with: ADMIN001 / password123');
    console.log('4. You should see the admin dashboard');
  } else {
    console.log('❌ ADMIN LOGIN STILL NOT WORKING');
    console.log('This might require manual database inspection');
    console.log('or checking the backend server logs for more details');
  }
}

runDebug().catch(console.error); 