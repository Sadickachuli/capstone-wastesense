const axios = require('axios');

async function quickTest() {
  console.log('🚀 QUICK BACKEND TEST & ADMIN SETUP\n');
  
  // Wait for backend to start
  console.log('1. Waiting for backend to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Test backend health
  console.log('2. Testing backend health...');
  try {
    const health = await axios.get('http://localhost:3001/health', { timeout: 5000 });
    console.log('   ✅ Backend is running!');
  } catch (error) {
    console.log('   ❌ Backend not responding:', error.message);
    return false;
  }
  
  // Setup database
  console.log('\n3. Setting up database...');
  try {
    const setup = await axios.post('http://localhost:3001/setup-database', {}, { timeout: 30000 });
    console.log('   ✅ Database setup complete:', setup.data.message);
  } catch (error) {
    console.log('   ❌ Database setup failed:', error.message);
    return false;
  }
  
  // Test admin login
  console.log('\n4. Testing admin login...');
  try {
    const adminLogin = await axios.post('http://localhost:3001/api/auth/login', {
      employee_id: 'ADMIN001',
      password: 'password123'
    }, { timeout: 10000 });
    
    console.log('   🎉 ADMIN LOGIN SUCCESSFUL!');
    console.log(`   User: ${adminLogin.data.user.name}`);
    console.log(`   Role: ${adminLogin.data.user.role}`);
    
    // Test admin endpoint
    console.log('\n5. Testing admin functionality...');
    const stats = await axios.get('http://localhost:3001/api/auth/admin/stats', {
      headers: { Authorization: `Bearer ${adminLogin.data.token}` },
      timeout: 10000
    });
    
    console.log('   ✅ Admin endpoints working!');
    console.log(`   Total users: ${stats.data.totalUsers}`);
    
    return true;
    
  } catch (error) {
    console.log('   ❌ Admin login failed:', error.response?.data?.message || error.message);
    
    // Try dispatcher for comparison
    console.log('\n   Testing dispatcher login for comparison...');
    try {
      const dispLogin = await axios.post('http://localhost:3001/api/auth/login', {
        employee_id: 'DISP001',
        password: 'password123'
      });
      console.log('   ✅ Dispatcher login works - admin user issue confirmed');
    } catch (dispError) {
      console.log('   ❌ Dispatcher also fails - backend auth issue');
    }
    
    return false;
  }
}

async function runQuickTest() {
  const success = await quickTest();
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 SUCCESS! EVERYTHING IS WORKING!');
    console.log('='.repeat(60));
    console.log('✅ Backend running on port 3001');
    console.log('✅ Database properly set up');
    console.log('✅ Admin login working: ADMIN001 / password123');
    console.log('✅ Admin endpoints functional');
    
    console.log('\n🚀 READY TO TEST FRONTEND:');
    console.log('1. Start frontend: npm run dev');
    console.log('2. Go to: http://localhost:5173');
    console.log('3. Login with: ADMIN001 / password123');
    console.log('4. Test admin dashboard and account deletion!');
    
  } else {
    console.log('❌ STILL HAVING ISSUES');
    console.log('='.repeat(60));
    console.log('Something is still not working correctly.');
    console.log('Check the error messages above for details.');
  }
}

runQuickTest().catch(console.error); 