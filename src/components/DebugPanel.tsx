import React from 'react';

export const DebugPanel: React.FC = () => {
  const envVars = {
    VITE_API_URL: (import.meta as any).env.VITE_API_URL,
    VITE_ML_SERVICE_URL: (import.meta as any).env.VITE_ML_SERVICE_URL,
    VITE_YOLO_API_URL: (import.meta as any).env.VITE_YOLO_API_URL,
    NODE_ENV: (import.meta as any).env.NODE_ENV,
    MODE: (import.meta as any).env.MODE,
    DEV: (import.meta as any).env.DEV,
    PROD: (import.meta as any).env.PROD,
  };

  // Console log for debugging
  console.log('🚀 DEBUG PANEL ENVIRONMENT VARIABLES:', envVars);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '0px', 
      left: '0px', 
      right: '0px',
      background: 'rgba(255,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      fontSize: '14px',
      zIndex: 99999,
      fontFamily: 'monospace',
      borderBottom: '3px solid yellow'
    }}>
      <h2 style={{ margin: '0 0 10px 0', color: 'yellow' }}>🐛 DEBUG PANEL - ENVIRONMENT VARIABLES</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '3px' }}>
            <strong style={{ color: 'yellow' }}>{key}:</strong> <br/>
            <span style={{ color: value ? 'lime' : 'red' }}>{value || 'undefined'}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: 'yellow' }}>
        Check browser console for detailed logs. If you see this panel, the app is loading correctly.
      </div>
    </div>
  );
}; 