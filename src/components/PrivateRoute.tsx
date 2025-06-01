import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface PrivateRouteProps {
  children: React.ReactNode;
  role: UserRole;
}

export default function PrivateRoute({ children, role }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  // Debug: log user and loading
  console.log('PrivateRoute user:', user, 'loading:', loading);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user && !loading) {
    // Not logged in, redirect to login page with return URL
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (user && user.role !== role) {
    // Wrong role, redirect to their appropriate dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Authorized, render children
  return <>{children}</>;
} 