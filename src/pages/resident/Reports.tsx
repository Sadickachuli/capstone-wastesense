import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useReports } from '../../hooks/useReports';
import { environment } from '../../config/environment';
import axios from 'axios';

export default function Reports() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { reports, loading, error } = useReports();
  const [showReportModal, setShowReportModal] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in-progress' | 'completed'>('all');

  const hasActiveReport = reports.some(
    (r) => r.status === 'new' || r.status === 'in-progress'
  );

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'completed') return report.status === 'completed' || report.status === 'collected';
    return report.status === filter;
  });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError('Missing user');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const API_BASE_URL = environment.getApiUrl();
      await axios.post(`${API_BASE_URL}/auth/report-bin-full`, {
        userId: user.id,
        description,
      });
      setSuccess(true);
      setShowReportModal(false);
      setDescription('');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      setSubmitError(backendMsg || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'collected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'new':
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'collected':
        return '✅';
      case 'in-progress':
        return '⏳';
      case 'new':
      case 'pending':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getFilterCounts = () => {
    return {
      all: reports.length,
      new: reports.filter(r => r.status === 'new').length,
      'in-progress': reports.filter(r => r.status === 'in-progress').length,
      completed: reports.filter(r => r.status === 'completed' || r.status === 'collected').length
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading reports...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filterCounts = getFilterCounts();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                My Reports
              </h1>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Track all your bin collection reports
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowReportModal(true)}
                disabled={hasActiveReport}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">📝</span>
                  <span>New Report</span>
                </span>
              </button>
            </div>
      </div>

          {hasActiveReport && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-2">⏳</span>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You have an active report. Please wait for collection confirmation before submitting a new one.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'all', label: 'Total', icon: '📊', color: 'from-blue-500 to-purple-600' },
            { key: 'new', label: 'Pending', icon: '🔵', color: 'from-blue-500 to-cyan-500' },
            { key: 'in-progress', label: 'In Progress', icon: '⏳', color: 'from-yellow-500 to-orange-500' },
            { key: 'completed', label: 'Completed', icon: '✅', color: 'from-green-500 to-teal-500' }
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key as any)}
              className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
                filter === stat.key 
                  ? `${isDarkMode ? 'border-blue-600' : 'border-blue-500'} shadow-lg scale-105` 
                  : `${isDarkMode ? 'border-gray-700' : 'border-white/20'} hover:scale-102`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-lg">{stat.icon}</span>
                </div>
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filterCounts[stat.key as keyof typeof filterCounts]}
                </span>
              </div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {stat.label}
              </p>
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {filter === 'all' ? 'All Reports' : 
                 filter === 'new' ? 'Pending Reports' :
                 filter === 'in-progress' ? 'Reports In Progress' :
                 'Completed Reports'}
              </h3>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
              </span>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">📝</span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {filter === 'all' ? 'No reports yet' :
                 filter === 'new' ? 'No pending reports' :
                 filter === 'in-progress' ? 'No reports in progress' :
                 'No completed reports'}
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
                {filter === 'all' ? 'Submit your first bin report to get started with waste collection tracking.' :
                 filter === 'new' ? 'All your reports have been processed.' :
                 filter === 'in-progress' ? 'No collection activities are currently in progress.' :
                 'Complete some reports to see them here.'}
              </p>
              {filter === 'all' && !hasActiveReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Submit First Report
                </button>
              )}
          </div>
        ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report, index) => (
                <div
                  key={report.id}
                  className={`p-6 transition-all duration-200 hover:${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">🗑️</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Bin Full Report
                          </h4>
                          <span className={`text-lg ${getStatusIcon(report.status)}`}>
                            {getStatusIcon(report.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>📍</span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {report.zone}
                            </span>
                    </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>🗓️</span>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                        
                        {report.description && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg`}>
                            "{report.description}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status === 'collected' ? 'Collected' : 
                         report.status === 'completed' ? 'Completed' :
                         report.status === 'in-progress' ? 'In Progress' :
                         report.status === 'pending' ? 'Pending' :
                         report.status === 'new' ? 'New' : report.status}
                      </span>
                    </div>
                  </div>
                </div>
            ))}
            </div>
        )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Report Bin Full
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zone
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  value={user?.zone || ''}
                  readOnly
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (optional)
                </label>
                <textarea
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g., Bin is overflowing, extra bags left out"
                  rows={3}
                />
              </div>
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className={`flex-1 py-3 px-4 border rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center space-x-2">
          <span className="text-lg">✅</span>
          <span className="font-medium">Report submitted successfully!</span>
        </div>
      )}
    </div>
  );
} 