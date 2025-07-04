const axios = require('axios');

const LOCAL_URL = 'http://localhost:3001';

async function directlyFixAdmin() {
  console.log('🔧 DIRECTLY FIXING ADMIN USER\n');
  
  // Step 1: Fresh database setup
  console.log('1. Running fresh database setup...');
  try {
    const setupResponse = await axios.post(`${LOCAL_URL}/setup-database`);
    console.log(`   ✅ Setup response: ${JSON.stringify(setupResponse.data)}`);
  } catch (error) {
    console.log(`   ❌ Setup failed: ${error.message}`);
    return false;
  }
  
  // Step 2: Wait a moment for database operations to complete
  console.log('\n2. Waiting for database operations to complete...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 3: Test a few login attempts with delays
  console.log('\n3. Testing admin login with delays...');
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`   Attempt ${attempt}...`);
      
      const response = await axios.post(`${LOCAL_URL}/api/auth/login`, {
        employee_id: 'ADMIN001',
        password: 'password123'
      }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('   🎉 ADMIN LOGIN SUCCESSFUL!');
      console.log(`   User: ${response.data.user.name}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
      
      return response.data.token;
      
    } catch (error) {
      console.log(`   ❌ Attempt ${attempt} failed: ${error.response?.data?.message || error.message}`);
      
      if (attempt < 3) {
        console.log(`   Waiting 2 seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return null;
}

async function testDispatcherForComparison() {
  console.log('\n🔄 Testing dispatcher login for comparison...');
  
  try {
    const response = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    
    console.log('   ✅ Dispatcher login works!');
    console.log(`   User: ${response.data.user.name} (${response.data.user.role})`);
    return true;
    
  } catch (error) {
    console.log('   ❌ Dispatcher login also failing');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    
    // If dispatcher is also failing, there might be a backend issue
    if (error.response?.status === 401) {
      console.log('\n   💡 Both admin and dispatcher failing suggests:');
      console.log('   - Backend authentication logic issue');
      console.log('   - Database connectivity problem');
      console.log('   - Password hash verification problem');
    }
    
    return false;
  }
}

async function runDirectFix() {
  console.log('⚡ DIRECT ADMIN FIX ATTEMPT');
  console.log('===========================');
  
  // Test dispatcher first to check if backend auth is working at all
  const dispatcherWorks = await testDispatcherForComparison();
  
  if (!dispatcherWorks) {
    console.log('\n🚨 CRITICAL: Backend authentication appears broken');
    console.log('Need to restart backend server or check database connection');
    console.log('\n🛠️ Suggested actions:');
    console.log('1. Restart backend: cd backend && npm run dev');
    console.log('2. Check database connection');
    console.log('3. Check backend console for errors');
    return;
  }
  
  // Try to fix admin
  const adminToken = await directlyFixAdmin();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 DIRECT FIX RESULTS');
  console.log('='.repeat(50));
  
  if (adminToken) {
    console.log('🎉 ADMIN LOGIN NOW WORKING!');
    console.log('✅ Backend authentication is functional');
    console.log('✅ Admin user properly created and accessible');
    
    console.log('\n🚀 READY FOR FRONTEND TESTING:');
    console.log('1. Start frontend: npm run dev');
    console.log('2. Go to: http://localhost:5173');
    console.log('3. Login with:');
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: password123');
    console.log('4. Navigate to admin dashboard');
    console.log('5. Test account deletion on resident profile');
    
  } else {
    console.log('❌ ADMIN LOGIN STILL NOT WORKING');
    console.log('Even after direct fix attempts');
    
    console.log('\n🔍 This indicates a deeper issue:');
    console.log('- Check backend server logs immediately');
    console.log('- Verify database schema is correct');
    console.log('- Check for any constraint violations');
    console.log('- Consider restarting the entire backend');
  }
}

runDirectFix().catch(console.error); 