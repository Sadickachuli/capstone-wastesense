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

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px',
      fontFamily: 'monospace'
    }}>
      <h4>Environment Debug</h4>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {value || 'undefined'}
        </div>
      ))}
    </div>
  );
}; 