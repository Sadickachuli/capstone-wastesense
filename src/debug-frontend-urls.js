// Debug script to show frontend URLs
import { environment } from './config/environment.ts';

console.log('🔍 FRONTEND URL DEBUGGING:');
console.log('================================');

console.log('Environment Details:');
console.log('- MODE:', import.meta.env.MODE);
console.log('- PROD:', import.meta.env.PROD);
console.log('- DEV:', import.meta.env.DEV);
console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('- VITE_ML_SERVICE_URL:', import.meta.env.VITE_ML_SERVICE_URL);
console.log('- VITE_YOLO_API_URL:', import.meta.env.VITE_YOLO_API_URL);

console.log('\nComputed URLs:');
console.log('- API URL:', environment.getApiUrl());
console.log('- ML Service URL:', environment.getMlServiceUrl());
console.log('- YOLO API URL:', environment.getYoloApiUrl());

console.log('\nExpected Production URLs:');
console.log('- API URL: https://wastesense-backend.onrender.com/api');
console.log('- ML Service URL: https://wastesense-ml-forecasting.onrender.com');
console.log('- YOLO API URL: https://waste-sense-api.onrender.com');

// Add this to the window object so we can access it in the browser
window.debugUrls = {
  environment: import.meta.env,
  computed: {
    apiUrl: environment.getApiUrl(),
    mlServiceUrl: environment.getMlServiceUrl(),
    yoloApiUrl: environment.getYoloApiUrl(),
  }
}; 