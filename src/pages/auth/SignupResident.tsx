import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

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
    .matches(/^\+?[\d\s-]+$/, 'Invalid phone number'),
  zone: Yup.string(),
});

export default function SignupResident() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      zone: '',
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600">
            WasteSense
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your resident account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
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
                className={`input rounded-t-md ${
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
                className={`input ${
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
                className={`input ${
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
                className={`input ${
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
              <label htmlFor="zone" className="sr-only">
                Zone
              </label>
              <input
                id="zone"
                name="zone"
                type="text"
                className={`input rounded-b-md ${
                  formik.touched.zone && formik.errors.zone
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder="Zone (optional)"
                {...formik.getFieldProps('zone')}
              />
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