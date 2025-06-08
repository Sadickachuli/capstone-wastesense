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

export default function Deliveries() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Incoming Deliveries</h1>
        <div className="flex space-x-2">
          <select className="form-select dark:bg-white dark:text-black">
            <option className="dark:text-black">All Status</option>
            <option className="dark:text-black">Pending</option>
            <option className="dark:text-black">In Transit</option>
            <option className="dark:text-black">Completed</option>
          </select>
          <button className="btn btn-primary">Schedule Delivery</button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Today's Deliveries
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {mockDeliveries.map((delivery) => (
              <li key={delivery.id} className="px-4 py-4 sm:px-6 card dark:shadow-white dark:border-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-primary-600">
                        Delivery {delivery.id}
                      </div>
                      <span
                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          delivery.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : delivery.status === 'in-transit'
                            ? 'bg-yellow-100 text-black dark:text-black'
                            : 'bg-blue-100 text-black dark:text-black'
                        }`}
                      >
                        {delivery.status.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-500">
                        <span className="mr-4">Truck: {delivery.truckId}</span>
                        <span className="mr-4">
                          ETA: {new Date(delivery.estimatedArrival).toLocaleTimeString()}
                        </span>
                        <span>Weight: {delivery.weight} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn btn-secondary btn-sm">View Details</button>
                    <button className="btn btn-primary btn-sm">Process</button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500">Composition</h4>
                  <div className="mt-2 flex space-x-4">
                    <div className="text-sm text-gray-500">
                      Plastic: {delivery.composition.plastic}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Paper: {delivery.composition.paper}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Glass: {delivery.composition.glass}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Metal: {delivery.composition.metal}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Organic: {delivery.composition.organic}%
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 