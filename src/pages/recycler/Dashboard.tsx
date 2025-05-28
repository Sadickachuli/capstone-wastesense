import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface Delivery {
  id: string;
  truckId: string;
  estimatedArrival: string;
  status: 'pending' | 'in-transit' | 'completed';
  weight: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
}

// Mock data for demonstration
const mockDeliveries: Delivery[] = [
  {
    id: 'D001',
    truckId: 'T001',
    estimatedArrival: '2024-03-20T14:30:00Z',
    status: 'in-transit',
    weight: 500,
    composition: {
      plastic: 30,
      paper: 25,
      glass: 15,
      metal: 20,
      organic: 10,
    },
  },
  {
    id: 'D002',
    truckId: 'T003',
    estimatedArrival: '2024-03-20T16:00:00Z',
    status: 'pending',
    weight: 450,
    composition: {
      plastic: 35,
      paper: 20,
      glass: 20,
      metal: 15,
      organic: 10,
    },
  },
];

export default function RecyclerDashboard() {
  const { user } = useAuth();

  const totalProcessed = 1250; // kg
  const recyclingRate = 85; // %
  const energySaved = 750; // kWh

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Recycling Facility Dashboard
        </h1>
        <div className="text-sm text-gray-600">
          Facility: {user?.facility || 'Not assigned'}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-green-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Processed Today
          </h3>
          <p className="text-3xl font-bold text-green-600">{totalProcessed} kg</p>
        </div>
        <div className="card bg-blue-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recycling Rate
          </h3>
          <p className="text-3xl font-bold text-blue-600">{recyclingRate}%</p>
        </div>
        <div className="card bg-purple-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Energy Saved</h3>
          <p className="text-3xl font-bold text-purple-600">{energySaved} kWh</p>
        </div>
      </div>

      {/* Incoming Deliveries */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Incoming Deliveries
        </h2>
        <div className="space-y-4">
          {mockDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  Delivery {delivery.id}
                </p>
                <p className="text-sm text-gray-600">
                  Truck: {delivery.truckId}
                </p>
                <p className="text-sm text-gray-600">
                  ETA:{' '}
                  {new Date(delivery.estimatedArrival).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">
                  Weight: {delivery.weight} kg
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    delivery.status === 'in-transit'
                      ? 'bg-blue-100 text-blue-800'
                      : delivery.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {delivery.status}
                </span>
                <button className="btn btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waste Composition Chart */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Today's Waste Composition
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(mockDeliveries[0].composition).map(([type, value]) => (
            <div key={type} className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {type}
              </p>
              <p className="text-xs text-gray-600">{value}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="card bg-green-50">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Environmental Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">2.5</p>
            <p className="text-sm text-gray-600">Tons CO₂ Avoided</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">1,200</p>
            <p className="text-sm text-gray-600">Trees Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">45,000</p>
            <p className="text-sm text-gray-600">Liters Water Saved</p>
          </div>
        </div>
      </div>
    </div>
  );
} 