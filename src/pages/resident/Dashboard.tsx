import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';
import axios from 'axios';

interface CollectionSchedule {
  id: string;
  zone: string;
  scheduledStart: string;
  estimatedCompletion: string;
  status: string;
  reportsCount: number;
  driverName: string;
  driverContact: string;
  vehicle: {
    make: string;
    model: string;
    registrationNumber: string;
    type: string;
  };
}

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { reports, loading } = useReports();
  const { isDarkMode } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  const hasActiveReport = reports.some(
    (r) => r.status === 'new' || r.status === 'in-progress'
  );

  // Fetch collection schedules for the user's zone
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.zone) return;
      
      setSchedulesLoading(true);
      try {
        const API_BASE_URL = environment.getApiUrl();
        const response = await axios.get(`${API_BASE_URL}/auth/schedules?zone=${encodeURIComponent(user.zone)}`);
        setSchedules(response.data.schedules);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
    // Refresh schedules every 30 seconds
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, [user?.zone, reports]);

  const getNextSchedule = (): CollectionSchedule | null => {
    const now = new Date();
    const upcomingSchedules = schedules
      .filter(schedule => new Date(schedule.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    
    return upcomingSchedules[0] || null;
  };

  const getActiveSchedule = (): CollectionSchedule | null => {
    const now = new Date();
    return schedules.find(schedule => 
      (schedule.status === 'in-progress') || 
      (schedule.status === 'scheduled' && new Date(schedule.scheduledStart) <= now && new Date(schedule.estimatedCompletion) >= now)
    ) || null;
  };

  const getRecentCompletedSchedule = (): CollectionSchedule | null => {
    // Only show completed schedule if there are no active or scheduled collections
    const hasActiveOrScheduled = schedules.some(schedule => 
      schedule.status === 'scheduled' || schedule.status === 'in-progress'
    );
    
    if (hasActiveOrScheduled) {
      return null; // Don't show completed if there are active/scheduled collections
    }
    
    // Find the most recent completed schedule (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCompleted = schedules
      .filter(schedule => 
        schedule.status === 'completed' && 
        new Date(schedule.estimatedCompletion) > oneDayAgo
      )
      .sort((a, b) => new Date(b.estimatedCompletion).getTime() - new Date(a.estimatedCompletion).getTime());
    
    return recentCompleted[0] || null;
  };

  const handleOpenModal = () => {
    setShowReportModal(true);
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Missing user');
      return;
    }
    setSubmitting(true);
    setError('');
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
      // Show backend error message if available
      const backendMsg = err?.response?.data?.message;
      setError(backendMsg || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const nextSchedule = getNextSchedule();
  const activeSchedule = getActiveSchedule();
  const recentCompletedSchedule = getRecentCompletedSchedule();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
          </span>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome back, {user?.name}!
                </h1>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user?.zone || 'Zone not assigned'}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`}>
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  System Online
                </span>
              </div>
            </div>
        </div>
      </div>

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Report Bin Full */}
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🗑️</span>
              </div>
              <div className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="text-sm font-medium">Quick Report</div>
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Report Bin Full
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Notify collection team when your bin needs attention
            </p>
            {hasActiveReport && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">⏳</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Report submitted! Wait for collection confirmation.
                  </p>
                </div>
              </div>
            )}
          <button
            onClick={handleOpenModal}
            disabled={hasActiveReport}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {hasActiveReport ? 'Report Submitted' : 'Report Now'}
          </button>
        </div>
        
          {/* Collection Status */}
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🚛</span>
              </div>
              <div className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="text-sm font-medium">Collection Status</div>
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeSchedule ? 'In Progress' : nextSchedule ? 'Scheduled' : recentCompletedSchedule ? 'Completed' : 'No Schedule'}
            </h3>
            
            {schedulesLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
              </div>
            ) : activeSchedule ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Collection in Progress
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vehicle: {activeSchedule.vehicle.make} {activeSchedule.vehicle.model}
              </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Expected: {new Date(activeSchedule.estimatedCompletion).toLocaleString()}
              </p>
            </div>
          ) : nextSchedule ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Next Collection
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(nextSchedule.scheduledStart).toLocaleDateString()} at {new Date(nextSchedule.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {nextSchedule.vehicle.make} {nextSchedule.vehicle.model}
                </p>
              </div>
            ) : recentCompletedSchedule ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Recently Completed
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(recentCompletedSchedule.estimatedCompletion).toLocaleDateString()}
              </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No upcoming collections scheduled
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Collections scheduled based on reports
                </p>
              </div>
            )}
          </div>

          {/* Reports Summary */}
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <div className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="text-sm font-medium">Your Reports</div>
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {reports.length} Total Reports
            </h3>
            <div className="space-y-2">
              {reports.filter(r => r.status === 'completed' || r.status === 'collected').length > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {reports.filter(r => r.status === 'completed' || r.status === 'collected').length}
                  </span>
                </div>
              )}
              {reports.filter(r => r.status === 'in-progress').length > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {reports.filter(r => r.status === 'in-progress').length}
                  </span>
                </div>
              )}
              {reports.filter(r => r.status === 'new').length > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reports.filter(r => r.status === 'new').length}
                  </span>
                </div>
              )}
            </div>
            </div>
        </div>

        {/* Recent Reports Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Reports
              </h3>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📝</span>
        </div>
      </div>
        {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading reports...</span>
              </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
                {reports.slice(0, 3).map((report, index) => (
              <div
                key={report.id}
                    className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:shadow-md`}
              >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">🗑️</span>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Bin Full Report
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {report.description && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {report.description}
                          </p>
                        )}
                  </div>
                  <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                      report.status === 'completed' || report.status === 'collected'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : report.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                        {report.status === 'collected' ? 'Collected' : 
                         report.status === 'completed' ? 'Completed' :
                         report.status === 'in-progress' ? 'In Progress' :
                         'New'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📝</span>
                </div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>No reports yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Start by reporting a bin full when needed
                </p>
              </div>
        )}
      </div>

          {/* Eco Tips */}
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-green-900/50 to-blue-900/50' : 'bg-gradient-to-br from-green-100/80 to-blue-100/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-green-800' : 'border-green-200'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Eco Tips
              </h3>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🌱</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '♻️', title: 'Separate Materials', desc: 'Sort recyclable and non-recyclable waste' },
                { icon: '🧽', title: 'Clean Containers', desc: 'Rinse before recycling for better processing' },
                { icon: '📦', title: 'Flatten Boxes', desc: 'Save space and make transportation easier' },
                { icon: '🔍', title: 'Check Symbols', desc: 'Look for recycling symbols on packaging' }
              ].map((tip, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/40'} backdrop-blur-sm`}>
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {tip.title}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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