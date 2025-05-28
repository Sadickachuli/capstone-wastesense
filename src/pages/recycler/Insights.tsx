import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface RecyclingStats {
  totalProcessed: number;
  recyclingRate: number;
  energySaved: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
  monthlyTrends: {
    month: string;
    amount: number;
  }[];
}

// Mock data for demonstration
const mockStats: RecyclingStats = {
  totalProcessed: 1250,
  recyclingRate: 85,
  energySaved: 750,
  composition: {
    plastic: 30,
    paper: 25,
    glass: 15,
    metal: 20,
    organic: 10,
  },
  monthlyTrends: [
    { month: 'Jan', amount: 980 },
    { month: 'Feb', amount: 1100 },
    { month: 'Mar', amount: 1250 },
  ],
};

export default function Insights() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Recycling Insights</h1>
        <div className="flex space-x-2">
          <select className="form-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button className="btn btn-secondary">Export Report</button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Waste Processed
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockStats.totalProcessed} kg
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Recycling Rate
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {mockStats.recyclingRate}%
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Energy Saved
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              {mockStats.energySaved} kWh
            </dd>
          </div>
        </div>
      </div>

      {/* Composition Breakdown */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Waste Composition
          </h3>
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                    Plastic
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-green-600">
                    {mockStats.composition.plastic}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                <div
                  style={{ width: `${mockStats.composition.plastic}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                ></div>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Paper
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {mockStats.composition.paper}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${mockStats.composition.paper}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>

            {/* Add similar blocks for glass, metal, and organic waste */}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Monthly Trends
          </h3>
          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockStats.monthlyTrends.map((month, index) => (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {month.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index > 0 ? (
                        <span
                          className={`${
                            month.amount > mockStats.monthlyTrends[index - 1].amount
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(
                            ((month.amount -
                              mockStats.monthlyTrends[index - 1].amount) /
                              mockStats.monthlyTrends[index - 1].amount) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 