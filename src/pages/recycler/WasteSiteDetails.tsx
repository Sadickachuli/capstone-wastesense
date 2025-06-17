import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWasteSites } from '../../hooks/useWasteSites';
import { WasteSite } from '../../types';

export default function WasteSiteDetails() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { sites } = useWasteSites();
  const [site, setSite] = useState<WasteSite | null>(null);

  useEffect(() => {
    if (siteId && sites.length > 0) {
      const foundSite = sites.find(s => s.id === siteId);
      setSite(foundSite || null);
    }
  }, [siteId, sites]);

  if (!site) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Site not found</p>
          <button
            onClick={() => navigate('/recycler/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{site.name}</h1>
              <p className="text-gray-600">{site.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">
                {site.lastUpdated 
                  ? new Date(site.lastUpdated).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Capacity Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Current Usage</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((site.currentCapacity / site.maxCapacity) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        site.currentCapacity / site.maxCapacity > 0.9
                          ? 'bg-red-600'
                          : site.currentCapacity / site.maxCapacity > 0.7
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${(site.currentCapacity / site.maxCapacity) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="text-xl font-semibold">{site.currentCapacity} tons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maximum</p>
                    <p className="text-xl font-semibold">{site.maxCapacity} tons</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Waste Composition</h2>
              <div className="space-y-4">
                {Object.entries(site.composition).map(([type, percentage]) => (
                  <div key={type} className="relative">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          type === 'plastic' ? 'bg-blue-600' :
                          type === 'paper' ? 'bg-yellow-600' :
                          type === 'glass' ? 'bg-green-600' :
                          type === 'metal' ? 'bg-gray-600' :
                          'bg-brown-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Historical Data</h2>
            {/* Add historical data visualization here */}
            <p className="text-gray-500 text-center py-4">Historical data coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
} 