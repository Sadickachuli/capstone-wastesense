import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import axios from 'axios';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { reports, loading } = useReports();
  const [showReportModal, setShowReportModal] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const hasActiveReport = reports.some(
    (r) => r.status === 'new' || r.status === 'in-progress'
  );

  const handleOpenModal = () => {
    setShowReportModal(true);
    setSuccess(false);
    setError('');
    // Try to get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location) {
      setError('Missing user or location');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/api/auth/report-bin-full', {
        userId: user.id,
        location,
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
          <p className="text-gray-700 dark:text-gray-200">Next Collection: <span className="font-semibold">Tomorrow at 9:00 AM</span></p>
          <p className="text-gray-700 dark:text-gray-200">Collection Frequency: <span className="font-semibold">Twice a week</span></p>
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
                    <p className="font-medium text-gray-900 dark:text-white">Report #{report.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(report.timestamp).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{report.description || 'No description provided'}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : report.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {report.status}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Bin Full</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
                <input
                  type="text"
                  className="input w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                  value={location ? `${location.lat}, ${location.lng}` : ''}
                  readOnly
                  placeholder="Auto-detected or enter manually"
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