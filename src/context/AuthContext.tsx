import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  signup: (data: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
    phone?: string;
    zone?: string;
    facility?: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wastesense_auth';

interface StoredAuth {
  user: User;
  token: string;
}

const API_URL = 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
          const { user, token } = JSON.parse(storedAuth) as StoredAuth;
          setUser(user);
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
        // Clear invalid data
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // If the input matches the employee ID pattern, send as employee_id
      const isEmployeeId = /^[A-Z]{3,4}\d{3}$/i.test(email);
      const body = isEmployeeId
        ? { employee_id: email, password }
        : { email, password };

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store both user and token
      const authData: StoredAuth = {
        user: data.user,
        token: data.token,
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const signup = async (data: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
    phone?: string;
    zone?: string;
    facility?: string;
  }) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const responseData = await response.json();
      
      // Store both user and token
      const authData: StoredAuth = {
        user: responseData.user,
        token: responseData.token,
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setUser(responseData.user);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      // TODO: Implement actual forgot password API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Password reset requested for:', email);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signup,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 