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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button
              className="btn btn-primary w-full"
              onClick={handleOpenModal}
              disabled={hasActiveReport}
            >
              Report Bin Full
            </button>
            {hasActiveReport && (
              <p className="text-red-600 text-sm mt-2">
                You have already reported your bin full for this cycle. Please wait until collection is confirmed.
              </p>
            )}
            <button className="btn btn-secondary w-full">
              View Collection Schedule
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Zone</h2>
          <div className="space-y-2">
            <p className="text-gray-600">Zone: {user?.zone || 'Not assigned'}</p>
            <p className="text-gray-600">Next Collection: Tomorrow at 9:00 AM</p>
            <p className="text-gray-600">Collection Frequency: Twice a week</p>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h2>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Report #{report.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(report.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description || 'No description provided'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reports yet</p>
        )}
      </div>

      {/* Tips Section */}
      <div className="card bg-green-50">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recycling Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Separate your waste into recyclable and non-recyclable materials</li>
          <li>Rinse containers before recycling</li>
          <li>Flatten cardboard boxes to save space</li>
          <li>Check for recycling symbols on packaging</li>
        </ul>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Bin Full</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="input w-full"
                  value={location ? `${location.lat}, ${location.lng}` : ''}
                  readOnly
                  placeholder="Auto-detected or enter manually"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  className="input w-full"
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