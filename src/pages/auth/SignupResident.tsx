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
    .matches(/^[+]?[\d\s-]+$/, 'Invalid phone number'),
  zone: Yup.string().oneOf(['North', 'South'], 'Select a valid zone').required('Zone is required'),
});

export default function SignupResident() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { isDarkMode, toggleDarkMode } = useTheme();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      zone: 'North',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
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
            Create your resident account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-green-300"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input rounded-t-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Email address"
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
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`input bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
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
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`input bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.name && formik.errors.name
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Full Name"
                {...formik.getFieldProps('name')}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className={`input bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.phone && formik.errors.phone
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Phone Number (optional)"
                {...formik.getFieldProps('phone')}
              />
              {formik.touched.phone && formik.errors.phone && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.phone}</p>
              )}
            </div>
            <div>
              <label htmlFor="zone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Zone
              </label>
              <select
                id="zone"
                name="zone"
                required
                className={`input rounded-b-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500 ${
                  formik.touched.zone && formik.errors.zone ? 'border-red-500' : ''
                }`}
                {...formik.getFieldProps('zone')}
              >
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
              {formik.touched.zone && formik.errors.zone && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.zone}</p>
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

          <div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 