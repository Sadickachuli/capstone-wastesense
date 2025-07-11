// Environment configuration for WasteSense
export const environment = {
  // API URLs
  API_BASE_URL: (import.meta as any).env.PROD === true
    ? 'https://wastesense-app.onrender.com'
    : 'http://localhost:3001',
  ML_SERVICE_URL: (import.meta as any).env.VITE_ML_SERVICE_URL || 'http://localhost:8000',
  YOLO_API_URL: (import.meta as any).env.VITE_YOLO_API_URL || 'https://waste-sense-api.onrender.com',
  
  // Environment flags
  isDevelopment: (import.meta as any).env.DEV || false,
  isProduction: (import.meta as any).env.PROD || false,
  mode: (import.meta as any).env.MODE || 'development',
  
  // Production URLs (fallback)
  production: {
    API_URL: 'https://wastesense-backend.onrender.com/api',
    ML_SERVICE_URL: 'https://wastesense-ml-forecasting.onrender.com',
    YOLO_API_URL: 'https://waste-sense-api.onrender.com',
  },
  
  // Get the appropriate API URL based on environment
  getApiUrl(): string {
    const envUrl = (import.meta as any).env.VITE_API_URL;
    const mode = (import.meta as any).env.MODE;
    const prod = (import.meta as any).env.PROD;
    
    // If environment variable is set, use it
    if (envUrl) {
      return envUrl;
    }
    
    // Check if we're in production based on multiple indicators
    const isProduction = 
      (import.meta as any).env.PROD === true ||
      (import.meta as any).env.MODE === 'production' ||
      window.location.hostname.includes('onrender.com') ||
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('vercel.app');
    
    // If we're in production mode, use production URL
    if (isProduction) {
      return this.production.API_URL;
    }
    
    // Otherwise use localhost with correct port
    return 'http://localhost:3001/api';
  },
  
  // Get the appropriate ML service URL
  getMlServiceUrl(): string {
    const envUrl = (import.meta as any).env.VITE_ML_SERVICE_URL;
    
    if (envUrl) {
      return envUrl;
    }
    
    // Check if we're in production based on multiple indicators
    const isProduction = 
      (import.meta as any).env.PROD === true ||
      (import.meta as any).env.MODE === 'production' ||
      window.location.hostname.includes('onrender.com') ||
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('vercel.app');
    
    if (isProduction) {
      return this.production.ML_SERVICE_URL;
    }
    
    return 'http://localhost:8000';
  },
  
  // Get the appropriate YOLO API URL
  getYoloApiUrl(): string {
    const envUrl = (import.meta as any).env.VITE_YOLO_API_URL;
    
    if (envUrl) {
      return envUrl;
    }
    
    // YOLO API is always on Render
    return this.production.YOLO_API_URL;
  }
}; 