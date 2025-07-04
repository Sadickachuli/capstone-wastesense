const axios = require('axios');

const ML_URL = 'https://wastesense-ml-forecasting.onrender.com';

console.log('💤 WAKING UP ML SERVICE...\n');

async function wakeAndTest() {
  console.log('🔄 Step 1: Waking up ML service...');
  
  try {
    // Wake up with root endpoint
    const rootResponse = await axios.get(`${ML_URL}/`, { timeout: 60000 });
    console.log('✅ ML Service Root Response:', rootResponse.data);
    
    // Wait a bit for service to fully start
    console.log('\n⏳ Waiting 5 seconds for service to fully start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test health
    console.log('\n🩺 Step 2: Testing health...');
    const healthResponse = await axios.get(`${ML_URL}/health`, { timeout: 30000 });
    console.log('✅ Health Response:', healthResponse.data);
    
    // Test forecast endpoint
    console.log('\n🔮 Step 3: Testing forecast endpoint...');
    const forecastResponse = await axios.get(`${ML_URL}/forecast/next-day`, { timeout: 60000 });
    console.log('✅ Forecast Response:', JSON.stringify(forecastResponse.data, null, 2));
    
    console.log('\n🎉 ML SERVICE IS FULLY WORKING!');
    console.log('The forecasting page should now work properly.');
    
  } catch (error) {
    console.log('❌ Failed to wake up ML service:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    
    // Try alternative approach
    console.log('\n🔄 Trying alternative wake-up approach...');
    try {
      const altResponse = await axios.get(`${ML_URL}/health`, { timeout: 90000 });
      console.log('✅ Alternative approach worked:', altResponse.data);
      
      // Now test forecast
      const forecastResponse = await axios.get(`${ML_URL}/forecast/next-day`, { timeout: 60000 });
      console.log('✅ Forecast working:', JSON.stringify(forecastResponse.data, null, 2));
    } catch (altError) {
      console.log('❌ Alternative approach also failed:', altError.message);
    }
  }
}

wakeAndTest().catch(console.error); 