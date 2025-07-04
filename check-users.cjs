const axios = require('axios');

const BACKEND_URL = 'https://wastesense-backend.onrender.com';

console.log('🔍 CHECKING DATABASE USERS\n');

async function checkUsers() {
  try {
    console.log('Getting all users from the database...');
    
    // Try to login with a known user first to get a token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      employee_id: 'DISP001',
      password: 'password123'
    }, { timeout: 10000 });

    if (!loginResponse.data.token) {
      console.log('❌ Could not get auth token');
      return;
    }

    console.log('✅ Got auth token from dispatcher login');
    
    // Try to get all users (assuming admin endpoints work with any auth token for now)
    try {
      const usersResponse = await axios.get(`${BACKEND_URL}/api/auth/admin/users`, {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
        timeout: 10000
      });

      console.log('✅ Users in database:');
      usersResponse.data.users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - Employee ID: ${user.employee_id || 'N/A'} - Email: ${user.email}`);
      });
      
      // Check if admin user exists
      const adminUser = usersResponse.data.users.find(u => u.role === 'admin');
      if (adminUser) {
        console.log('\n✅ Admin user found!');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Employee ID: ${adminUser.employee_id}`);
        console.log(`   Email: ${adminUser.email}`);
      } else {
        console.log('\n❌ No admin user found in database');
      }
      
    } catch (error) {
      console.log('❌ Could not get users list:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Could not login with test credentials:', error.message);
  }
}

async function manuallyCreateAdmin() {
  console.log('\n🔧 Attempting to manually create admin user...');
  
  try {
    // Call setup-database again to ensure admin user is created
    const response = await axios.post(`${BACKEND_URL}/setup-database`, {}, { 
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Database setup called again');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    // Wait and test admin login
    console.log('\n⏳ Waiting 10 seconds then testing admin login...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const adminLoginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      employee_id: 'ADMIN001',
      password: 'password123'
    }, { timeout: 10000 });

    console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
    console.log(`   Admin: ${adminLoginResponse.data.user.name}`);
    console.log(`   Role: ${adminLoginResponse.data.user.role}`);
    
    return adminLoginResponse.data.token;
    
  } catch (error) {
    console.log('❌ Admin creation/login still failing:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function runCheck() {
  console.log('🕵️ USER DATABASE INVESTIGATION');
  console.log('==============================');
  
  await checkUsers();
  
  const adminToken = await manuallyCreateAdmin();
  
  if (adminToken) {
    console.log('\n🎉 ADMIN FUNCTIONALITY IS NOW WORKING!');
    console.log('✅ Admin user created and login successful');
    console.log('✅ Ready to use admin dashboard');
    
    console.log('\n📝 Admin Credentials:');
    console.log('👤 Employee ID: ADMIN001');
    console.log('🔐 Password: password123');
    console.log('🌐 Frontend: https://wastesense-frontend.onrender.com');
  } else {
    console.log('\n❌ Admin functionality still not working');
    console.log('Need to investigate database and backend logs');
  }
}

runCheck().catch(console.error); 