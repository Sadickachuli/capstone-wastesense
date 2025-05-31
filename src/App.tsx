import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import ResidentDashboard from './pages/resident/Dashboard';
import DispatcherDashboard from './pages/dispatcher/Dashboard';
import RecyclerDashboard from './pages/recycler/Dashboard';
import RecyclerNotifications from './pages/recycler/Notifications';
import WasteSiteDetails from './pages/recycler/WasteSiteDetails';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Resident Routes */}
          <Route
            path="/resident/*"
            element={
              <PrivateRoute role="resident">
                <Routes>
                  <Route path="dashboard" element={<ResidentDashboard />} />
                </Routes>
              </PrivateRoute>
            }
          />

          {/* Dispatcher Routes */}
          <Route
            path="/dispatcher/*"
            element={
              <PrivateRoute role="dispatcher">
                <Routes>
                  <Route path="dashboard" element={<DispatcherDashboard />} />
                </Routes>
              </PrivateRoute>
            }
          />

          {/* Recycler Routes */}
          <Route
            path="/recycler/*"
            element={
              <PrivateRoute role="recycler">
                <Routes>
                  <Route path="dashboard" element={<RecyclerDashboard />} />
                  <Route path="notifications" element={<RecyclerNotifications />} />
                  <Route path="sites/:siteId" element={<WasteSiteDetails />} />
                </Routes>
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 