const axios = require('axios');

const LOCAL_URL = 'http://localhost:3001';

async function testLocalAdmin() {
  console.log('🔍 Testing Local Admin Setup\n');
  
  // Step 1: Login as dispatcher to get a token
  console.log('1. Getting dispatcher token...');
  try {
    const dispatcherLogin = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    });
    
    console.log('✅ Dispatcher login successful');
    const token = dispatcherLogin.data.token;
    
    // Step 2: Try to get all users
    console.log('\n2. Getting all users...');
    try {
      const usersResponse = await axios.get(`${LOCAL_URL}/api/auth/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Users in local database:');
      usersResponse.data.users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - Employee ID: ${user.employee_id || 'N/A'}`);
      });
      
      const adminUser = usersResponse.data.users.find(u => u.role === 'admin');
      if (adminUser) {
        console.log('\n✅ Admin user found!');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Employee ID: ${adminUser.employee_id}`);
        console.log(`   Email: ${adminUser.email}`);
        
        // Step 3: Try admin login
        console.log('\n3. Testing admin login...');
        try {
          const adminLogin = await axios.post(`${LOCAL_URL}/api/auth/login`, {
            employee_id: 'ADMIN001',
            password: 'password123'
          });
          
          console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
          console.log(`   Admin: ${adminLogin.data.user.name}`);
          console.log(`   Role: ${adminLogin.data.user.role}`);
          console.log(`   Token: ${adminLogin.data.token ? 'Generated' : 'Missing'}`);
          
          return true;
        } catch (error) {
          console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
          return false;
        }
      } else {
        console.log('\n❌ No admin user found in local database');
        
        // Step 4: Try to create admin user manually
        console.log('\n4. Calling setup-database again...');
        try {
          await axios.post(`${LOCAL_URL}/setup-database`);
          console.log('✅ Database setup called again');
          
          // Wait and retry
          setTimeout(async () => {
            try {
              const adminLogin = await axios.post(`${LOCAL_URL}/api/auth/login`, {
                employee_id: 'ADMIN001',
                password: 'password123'
              });
              
              console.log('🎉 ADMIN LOGIN NOW WORKS!');
              console.log(`   Admin: ${adminLogin.data.user.name}`);
            } catch (error) {
              console.log('❌ Admin login still failing after retry');
            }
          }, 2000);
        } catch (error) {
          console.log('❌ Database setup failed:', error.message);
        }
        
        return false;
      }
    } catch (error) {
      console.log('❌ Could not get users:', error.response?.data?.message || error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Dispatcher login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTest() {
  const success = await testLocalAdmin();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 LOCAL ADMIN TEST RESULTS');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('🎉 LOCAL ADMIN SETUP SUCCESSFUL!');
    console.log('✅ You can now login with:');
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: password123');
    console.log('\n🚀 Start the frontend with: npm run dev');
    console.log('🌐 Then go to: http://localhost:5173');
  } else {
    console.log('❌ LOCAL ADMIN SETUP FAILED');
    console.log('Need to check backend logs for more details');
  }
}

runTest().catch(console.error); 