import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';

// Auth Pages
import Login from '../pages/auth/Login';
import SignupResident from '../pages/auth/SignupResident';
// import SignupRecycler from '../pages/auth/SignupRecycler';
// import ForgotPassword from '../pages/auth/ForgotPassword';

// Resident Pages
import ResidentDashboard from '../pages/resident/Dashboard';
import ResidentReports from '../pages/resident/Reports';
import ResidentSchedule from '../pages/resident/Schedule';
import ResidentProfile from '../pages/resident/Profile';

// Dispatcher Pages
import DispatcherDashboard from '../pages/dispatcher/Dashboard';
import DispatcherRoutes from '../pages/dispatcher/Routes';
import DispatcherAnalytics from '../pages/dispatcher/Analytics';
import DispatcherProfile from '../pages/dispatcher/Profile';

// Recycler Pages
import RecyclerDashboard from '../pages/recycler/Dashboard';
import RecyclerDeliveries from '../pages/recycler/Deliveries';
import RecyclerInsights from '../pages/recycler/Insights';
import RecyclerProfile from '../pages/recycler/Profile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return <Layout>{children}</Layout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup/resident" element={<SignupResident />} />
      {/* <Route path="/signup/recycler" element={<SignupRecycler />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> */}

      {/* Resident Routes */}
      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/reports"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ResidentReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/schedule"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ResidentSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/profile"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ResidentProfile />
          </ProtectedRoute>
        }
      />

      {/* Dispatcher Routes */}
      <Route
        path="/dispatcher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['dispatcher']}>
            <DispatcherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/routes"
        element={
          <ProtectedRoute allowedRoles={['dispatcher']}>
            <DispatcherRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/analytics"
        element={
          <ProtectedRoute allowedRoles={['dispatcher']}>
            <DispatcherAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/profile"
        element={
          <ProtectedRoute allowedRoles={['dispatcher']}>
            <DispatcherProfile />
          </ProtectedRoute>
        }
      />

      {/* Recycler Routes */}
      <Route
        path="/recycler/dashboard"
        element={
          <ProtectedRoute allowedRoles={['recycler']}>
            <RecyclerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recycler/deliveries"
        element={
          <ProtectedRoute allowedRoles={['recycler']}>
            <RecyclerDeliveries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recycler/insights"
        element={
          <ProtectedRoute allowedRoles={['recycler']}>
            <RecyclerInsights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recycler/profile"
        element={
          <ProtectedRoute allowedRoles={['recycler']}>
            <RecyclerProfile />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
} 