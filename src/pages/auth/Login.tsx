import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .test(
      'email-or-employee-id',
      'Enter a valid email or employee ID',
      value =>
        !!value &&
        (
          /^[A-Z]{3,4}\d{3}$/i.test(value) || // Matches DISP001, REC001, etc.
          Yup.string().email().isValidSync(value)
        )
    )
    .required('Email or Employee ID is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const { isDarkMode, toggleDarkMode } = useTheme();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const user = await login(values.email, values.password);
        // Navigate to the return URL if available, otherwise to the role-specific dashboard
        const returnUrl = location.state?.from || `/${user.role}/dashboard`;
        navigate(returnUrl, { replace: true });
      } catch (err) {
        setError('Invalid email or password');
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-0 right-0 mt-2 mr-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600 dark:text-green-300">
            WasteSense
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form onSubmit={formik.handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address or Employee ID
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                required
                className={`input rounded-t-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Email address or Employee ID"
                {...formik.getFieldProps('email')}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className={`input rounded-b-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Password"
                {...formik.getFieldProps('password')}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.password}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link
                to="/signup/resident"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 