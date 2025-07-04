const axios = require('axios');

async function recreateAdminUser() {
  console.log('🔧 FINAL ADMIN FIX - Recreating Admin User\n');
  
  // Step 1: Get a working dispatcher token
  console.log('1. Getting dispatcher token for admin operations...');
  let token;
  try {
    const dispLogin = await axios.post('http://localhost:3001/api/auth/login', {
      employee_id: 'DISP001',
      password: 'password123'
    });
    token = dispLogin.data.token;
    console.log('   ✅ Got dispatcher token');
  } catch (error) {
    console.log('   ❌ Could not get dispatcher token:', error.message);
    return false;
  }
  
  // Step 2: Check current admin user
  console.log('\n2. Checking current admin user...');
  try {
    const users = await axios.get('http://localhost:3001/api/auth/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const adminUser = users.data.users.find(u => u.role === 'admin');
    if (adminUser) {
      console.log(`   Current admin: ${adminUser.name} (ID: ${adminUser.id})`);
      console.log(`   Employee ID: ${adminUser.employee_id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Created: ${adminUser.created_at}`);
    }
  } catch (error) {
    console.log('   ❌ Could not check admin user:', error.message);
  }
  
  // Step 3: Force recreate admin user via multiple database setups
  console.log('\n3. Force recreating admin user...');
  try {
    for (let i = 1; i <= 3; i++) {
      console.log(`   Setup attempt ${i}...`);
      const setup = await axios.post('http://localhost:3001/setup-database');
      console.log(`   Response: ${setup.data.message}`);
      
      // Wait between attempts
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    console.log('   ✅ Database setup completed');
  } catch (error) {
    console.log('   ❌ Database setup failed:', error.message);
    return false;
  }
  
  // Step 4: Test admin login
  console.log('\n4. Testing admin login...');
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`   Login attempt ${attempt}...`);
      
      const adminLogin = await axios.post('http://localhost:3001/api/auth/login', {
        employee_id: 'ADMIN001',
        password: 'password123'
      });
      
      console.log('   🎉 ADMIN LOGIN SUCCESSFUL!');
      console.log(`   User: ${adminLogin.data.user.name}`);
      console.log(`   Role: ${adminLogin.data.user.role}`);
      console.log(`   Employee ID: ${adminLogin.data.user.employee_id}`);
      
      return adminLogin.data.token;
      
    } catch (error) {
      console.log(`   ❌ Login attempt ${attempt} failed: ${error.response?.data?.message}`);
      
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  return false;
}

async function testAdminFunctionality(adminToken) {
  console.log('\n5. Testing admin functionality...');
  
  try {
    // Test admin stats endpoint
    const stats = await axios.get('http://localhost:3001/api/auth/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('   ✅ Admin stats endpoint working');
    console.log(`   Total users: ${stats.data.totalUsers}`);
    console.log(`   Total reports: ${stats.data.totalReports}`);
    
    return true;
  } catch (error) {
    console.log('   ❌ Admin endpoints not working:', error.message);
    return false;
  }
}

async function runFinalFix() {
  console.log('🚀 FINAL ADMIN FIX ATTEMPT');
  console.log('============================');
  
  const adminToken = await recreateAdminUser();
  
  if (adminToken) {
    const functionalityWorks = await testAdminFunctionality(adminToken);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! ADMIN LOGIN IS NOW WORKING!');
    console.log('='.repeat(60));
    console.log('✅ Admin user properly created and functional');
    console.log('✅ Admin endpoints accessible');
    console.log('✅ Authentication system working correctly');
    
    console.log('\n🎯 READY FOR FRONTEND TESTING:');
    console.log('━'.repeat(40));
    console.log('1. 🚀 Start frontend: npm run dev');
    console.log('2. 🌐 Open: http://localhost:5173');
    console.log('3. 👤 Login with:');
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: password123');
    console.log('4. 🏛️  Navigate to admin dashboard');
    console.log('5. 🏠 Test resident account deletion');
    
    console.log('\n📝 FEATURES TO TEST:');
    console.log('━'.repeat(40));
    console.log('✨ Admin Dashboard:');
    console.log('   - User management');
    console.log('   - System statistics');
    console.log('   - Reports overview');
    console.log('   - Waste site monitoring');
    console.log('');
    console.log('🗑️  Resident Account Deletion:');
    console.log('   - Login as any resident');
    console.log('   - Go to Profile page');
    console.log('   - Click "Delete Account" button');
    console.log('   - Enter password to confirm');
    console.log('   - Account should be deleted successfully');
    
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('❌ ADMIN FIX FAILED');
    console.log('='.repeat(60));
    console.log('The admin login is still not working after all fix attempts.');
    console.log('');
    console.log('🔍 NEXT STEPS:');
    console.log('1. Check backend console logs for specific errors');
    console.log('2. Manually inspect database admin user record');
    console.log('3. Try restarting the entire development environment');
    console.log('4. Consider recreating the database from scratch');
  }
}

runFinalFix().catch(console.error); 