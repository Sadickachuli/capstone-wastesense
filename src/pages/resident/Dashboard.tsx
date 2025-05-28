import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { reports, loading } = useReports();

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
            <button className="btn btn-primary w-full">
              Report Waste Collection
            </button>
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
    </div>
  );
} 