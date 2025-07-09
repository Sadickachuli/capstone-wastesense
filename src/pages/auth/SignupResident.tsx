import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  name: Yup.string()
    .required('Name is required'),
  phone: Yup.string()
    .matches(/^[+]?\d[\d\s-]+$/, 'Invalid phone number'),
  zone: Yup.string().oneOf(['Ablekuma North', 'Ayawaso West'], 'Select a valid zone').required('Zone is required'),
});

export default function SignupResident() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      zone: 'Ablekuma North',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        await signup({
          ...values,
          role: 'resident',
        });
        navigate('/resident/dashboard', { replace: true });
      } catch (err) {
        setError('Failed to create account. Please try again.');
      }
    },
  });

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-green-50 to-blue-100'}`}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="flex flex-col justify-center items-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">🗂️</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            WasteSense
          </h1>
            </div>
            
            <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Join the waste management revolution
          </h2>
            
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Connect with your community, report bin statuses, and help create a cleaner Ghana
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏠</span>
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>One-Click Bin Reporting</span>
              </div>
              
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔔</span>
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Real-time Notifications</span>
              </div>
              
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Track Collection History</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/waste-bg1.jpg"
            alt="Community Waste Management"
            className="w-full h-full object-cover opacity-20"
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-gray-900/90 to-blue-900/90' : 'bg-gradient-to-r from-blue-50/90 to-green-50/90'}`}></div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🗂️</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                WasteSense
              </span>
            </div>
          </div>

          {/* Form Container */}
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl shadow-2xl border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} p-8 relative`}>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create your account
              </h2>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Join the waste management community
              </p>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Name Field */}
            <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>👤</span>
                  </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${
                  formik.touched.name && formik.errors.name
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : ''
                }`}
                    placeholder="Enter your full name"
                {...formik.getFieldProps('name')}
              />
                </div>
              {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">❌</span>
                    {formik.errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>📧</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${
                      formik.touched.email && formik.errors.email
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : ''
                    }`}
                    placeholder="Enter your email address"
                    {...formik.getFieldProps('email')}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">❌</span>
                    {formik.errors.email}
                  </p>
              )}
            </div>

              {/* Phone Field */}
            <div>
                <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Phone Number
                  <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}> (optional)</span>
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>📱</span>
                  </div>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${
                  formik.touched.phone && formik.errors.phone
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : ''
                }`}
                    placeholder="Enter your phone number"
                {...formik.getFieldProps('phone')}
              />
                </div>
              {formik.touched.phone && formik.errors.phone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">❌</span>
                    {formik.errors.phone}
                  </p>
              )}
            </div>

              {/* Zone Field */}
            <div>
                <label htmlFor="zone" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zone/Area
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>🏘️</span>
                  </div>
              <select
                id="zone"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${
                      formik.touched.zone && formik.errors.zone
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : ''
                }`}
                {...formik.getFieldProps('zone')}
              >
                <option value="Ablekuma North">Ablekuma North</option>
                <option value="Ayawaso West">Ayawaso West</option>
              </select>
                </div>
              {formik.touched.zone && formik.errors.zone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">❌</span>
                    {formik.errors.zone}
                  </p>
              )}
            </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>🔒</span>
          </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${
                      formik.touched.password && formik.errors.password
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : ''
                    }`}
                    placeholder="Create a strong password"
                    {...formik.getFieldProps('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">❌</span>
                    {formik.errors.password}
                  </p>
                )}
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

              {/* Submit Button */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {formik.isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Create Account
                  </span>
                )}
              </button>

              {/* Terms */}
              <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                By creating an account, you agree to our{' '}
                <a href="#" className={`underline hover:no-underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className={`underline hover:no-underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Privacy Policy
                </a>
              </p>

              {/* Sign In Link */}
              <div className="text-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already have an account?{' '}
                  <Link
                    to="/auth/signin"
                    className={`font-medium hover:underline transition-colors ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              to="/"
              className={`inline-flex items-center text-sm font-medium hover:underline transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
            >
              <span className="mr-1">←</span>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 