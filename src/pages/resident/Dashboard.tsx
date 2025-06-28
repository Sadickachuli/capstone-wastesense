import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
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
        const response = await axios.get(`/api/auth/schedules?zone=${encodeURIComponent(user.zone)}`);
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
      await axios.post('/api/auth/report-bin-full', {
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
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
        <div className="flex items-center gap-2">
          <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 dark:from-green-700 dark:to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
          </span>
        </div>
      </div>

      {/* Quick Actions & Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] flex flex-col gap-4">
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2"><span>⚡</span> Quick Actions</h2>
          <button
            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold shadow-md hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 disabled:opacity-60"
            onClick={handleOpenModal}
            disabled={hasActiveReport}
          >
            Report Bin Full
          </button>
          {hasActiveReport && (
            <p className="text-red-600 text-sm mt-2">You have already reported your bin full for this cycle. Please wait until collection is confirmed.</p>
          )}
          <button className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold shadow-md hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">
            View Collection Schedule
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] flex flex-col gap-2">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><span>📍</span> Your Zone</h2>
          <p className="text-gray-700 dark:text-gray-200">Zone: <span className="font-semibold">{user?.zone || 'Not assigned'}</span></p>
          
          {schedulesLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading collection info...</p>
          ) : activeSchedule ? (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-semibold text-green-800 dark:text-green-200">Collection in Progress</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Vehicle: {activeSchedule.vehicle.make} {activeSchedule.vehicle.model}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Expected completion: {new Date(activeSchedule.estimatedCompletion).toLocaleString()}
              </p>
            </div>
          ) : recentCompletedSchedule ? (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span className="font-semibold text-green-800 dark:text-green-200">Collection Completed</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Vehicle: {recentCompletedSchedule.vehicle.make} {recentCompletedSchedule.vehicle.model}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Completed: {new Date(recentCompletedSchedule.estimatedCompletion).toLocaleDateString()}
              </p>
            </div>
          ) : nextSchedule ? (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 dark:text-blue-400">🚛</span>
                <span className="font-semibold text-blue-800 dark:text-blue-200">Next Collection</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Scheduled: {new Date(nextSchedule.scheduledStart).toLocaleString()}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Vehicle: {nextSchedule.vehicle.make} {nextSchedule.vehicle.model}
              </p>
              {nextSchedule.driverName && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Driver: {nextSchedule.driverName}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-gray-400">
              <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming collections scheduled</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Collections will be scheduled when enough reports are received in your zone</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2"><span>📝</span> Recent Reports</h2>
        {loading ? (
          <p className="text-gray-500 dark:text-gray-300">Loading reports...</p>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Bin Full Report</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{report.description || 'No description provided'}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'completed' || report.status === 'collected'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : report.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {report.status === 'collected' ? 'collected' : 
                     report.status === 'completed' ? 'completed' :
                     report.status === 'in-progress' ? 'in progress' :
                     report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-300">No reports yet</p>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2"><span>💡</span> Recycling Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
          <li>Separate your waste into recyclable and non-recyclable materials</li>
          <li>Rinse containers before recycling</li>
          <li>Flatten cardboard boxes to save space</li>
          <li>Check for recycling symbols on packaging</li>
        </ul>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Bin Full</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Zone</label>
                <input
                  type="text"
                  className="input w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                  value={user?.zone || ''}
                  readOnly
                  placeholder="Zone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description (optional)</label>
                <textarea
                  className="input w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g. Bin is overflowing"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Reporting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          Bin full report submitted successfully!
        </div>
      )}
    </div>
  );
} 