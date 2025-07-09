import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWasteSites } from '../../hooks/useWasteSites';
import { WasteSite } from '../../types';

export default function WasteSiteDetails() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { sites } = useWasteSites();
  const [site, setSite] = useState<WasteSite | null>(null);
  const [animationInView, setAnimationInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setAnimationInView(true);
    }
  }, []);

  useEffect(() => {
    if (siteId && sites.length > 0) {
      const foundSite = sites.find(s => s.id === siteId);
      setSite(foundSite || null);
    }
  }, [siteId, sites]);

  const getCapacityColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCapacityIcon = (percentage: number) => {
    if (percentage > 90) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (percentage > 70) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getWasteIcon = (type: string) => {
    switch (type) {
      case 'plastic':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2 M 19 8 L 5 8 M 10 8 L 10 18 M 14 8 L 14 18" />
          </svg>
        );
      case 'paper':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'glass':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2l3 7h6l3-7M9 9v13a1 1 0 001 1h4a1 1 0 001-1V9" />
          </svg>
        );
      case 'metal':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        );
      case 'organic':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 8.5c0-1.5 1.5-3 3-3s3 1.5 3 3-1.5 3-3 3-3-1.5-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13c3 0 3-2 3-2s0 2 3 2c3 0 3-2 3-2s0 2-3 2c-3 0-3 2-3 2s0-2-3-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c0-1.5 1.5-3 3-3s3 1.5 3 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
    }
  };

  const getWasteColor = (type: string) => {
    switch (type) {
      case 'plastic': return 'bg-blue-500';
      case 'paper': return 'bg-yellow-500';
      case 'glass': return 'bg-green-500';
      case 'metal': return 'bg-gray-500';
      case 'organic': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const fadeInAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  };

  const slideInAnimation = (delay: number = 0) => ({
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
  });

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Site Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The requested waste site could not be found or may have been removed.
            </p>
          <button
            onClick={() => navigate('/recycler/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            Return to Dashboard
          </button>
          </div>
        </div>
      </div>
    );
  }

  const capacityPercentage = Math.round((site.currentCapacity / site.maxCapacity) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
      <div className="max-w-6xl mx-auto px-4 py-8" ref={containerRef}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8" style={fadeInAnimation}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
        >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
        </button>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0h6" />
                </svg>
      </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {site.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {site.location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {site.lastUpdated 
                  ? new Date(site.lastUpdated).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            </div>
          </div>

        {/* Site Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Capacity Status */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8" style={slideInAnimation(0.1)}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${getCapacityColor(capacityPercentage)} rounded-lg flex items-center justify-center`}>
                  {getCapacityIcon(capacityPercentage)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Capacity Status</h2>
                  <p className="text-gray-600 dark:text-gray-400">Current site utilization</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Capacity Progress */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Current Usage</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {capacityPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full ${getCapacityColor(capacityPercentage)} transition-all duration-500`}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>0 tons</span>
                    <span>{site.maxCapacity} tons</span>
                  </div>
                </div>

                {/* Capacity Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                  <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Current Load</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active waste volume</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {site.currentCapacity} tons
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                  <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Maximum Capacity</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Site limit</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {site.maxCapacity} tons
                    </p>
                  </div>
                </div>

                {/* Remaining Capacity */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-white">Remaining Capacity</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {site.maxCapacity - site.currentCapacity} tons
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Site Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" style={slideInAnimation(0.2)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Site Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Site ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{site.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-900 dark:text-white">{site.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    capacityPercentage > 90 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    capacityPercentage > 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {capacityPercentage > 90 ? 'Critical' :
                     capacityPercentage > 70 ? 'High' :
                     'Normal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" style={slideInAnimation(0.3)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Utilization</span>
                  <span className="font-medium text-gray-900 dark:text-white">{capacityPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free Space</span>
                  <span className="font-medium text-gray-900 dark:text-white">{100 - capacityPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Waste Types</span>
                  <span className="font-medium text-gray-900 dark:text-white">{Object.keys(site.composition).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Composition */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8" style={slideInAnimation(0.4)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0v4l5-5-5-5v4zm8-8V7a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h1" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Waste Composition</h2>
              <p className="text-gray-600 dark:text-gray-400">Material breakdown by type</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(site.composition).map(([type, percentage]) => (
              <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${getWasteColor(type)} rounded-lg flex items-center justify-center`}>
                    {getWasteIcon(type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{type}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Material type</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Percentage</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                    </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                      className={`h-3 rounded-full ${getWasteColor(type)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ≈ {((percentage / 100) * site.currentCapacity).toFixed(1)} tons
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Data Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8" style={slideInAnimation(0.5)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Data</h2>
              <p className="text-gray-600 dark:text-gray-400">Trends and analytics over time</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Historical Analytics Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We're working on detailed historical data visualization including capacity trends, composition changes, and predictive analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 