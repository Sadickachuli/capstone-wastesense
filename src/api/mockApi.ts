import { User, Report, BinStatus, Route, Delivery, WasteSite, Notification } from '../types';
import axios from 'axios';

// Configure axios with the API base URL from environment variables
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
const ML_SERVICE_URL = (import.meta as any).env.VITE_ML_SERVICE_URL || 'http://localhost:8000';

console.log('mockApi.ts: API_BASE_URL =', API_BASE_URL);
console.log('mockApi.ts: Environment variables:', (import.meta as any).env);

axios.defaults.baseURL = API_BASE_URL;

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Load persisted data from localStorage or use defaults
const loadPersistedData = (key: string, defaultData: any) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultData;
};

// Save data to localStorage
const persistData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock data with persistence
const mockUsers = loadPersistedData('mockUsers', [
  {
    id: '1',
    email: 'resident@example.com',
    role: 'resident',
    name: 'John Doe',
    phone: '+233 20 123 4567',
    zone: 'Ablekuma North',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '2',
    email: 'dispatcher@example.com',
    role: 'dispatcher',
    name: 'Jane Smith',
    phone: '+233 20 234 5678',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '3',
    email: 'recycler@example.com',
    role: 'recycler',
    name: 'Bob Johnson',
    facility: 'North Recycling Center',
    createdAt: '2024-03-20T10:00:00Z',
  },
]);

const mockReports: Report[] = [
  {
    id: '1',
    userId: '1',
    timestamp: '2024-03-20T10:00:00Z',
    zone: 'Ablekuma North',
    status: 'completed',
    description: 'Bin is overflowing',
    location: {
      lat: 5.6037,
      lng: -0.2641,
    },
  },
  {
    id: '2',
    userId: '1',
    timestamp: '2024-03-19T15:30:00Z',
    zone: 'Ablekuma North',
    status: 'in-progress',
    description: 'Bin is almost full',
    location: {
      lat: 5.6038,
      lng: -0.2642,
    },
  },
];

const mockBinStatuses: BinStatus[] = [
  {
    id: '1',
    location: {
      lat: 5.6037,
      lng: -0.2641,
    },
    fillLevel: 90,
    lastUpdated: '2024-03-20T10:00:00Z',
    zone: 'Ablekuma North',
  },
  {
    id: '2',
    location: {
      lat: 5.6038,
      lng: -0.2642,
    },
    fillLevel: 75,
    lastUpdated: '2024-03-20T09:30:00Z',
    zone: 'Ablekuma North',
  },
];

const mockRoutes: Route[] = [
  {
    id: '1',
    truckId: 'T001',
    bins: ['1', '2'],
    status: 'active',
    estimatedTime: 45,
    distance: 5.2,
  },
];

const mockDeliveries: Delivery[] = [
  {
    id: '1',
    truckId: 'T001',
    facilityId: 'WS001', // North Dumping Site
    zone: 'Ablekuma North',
    estimatedArrival: '2024-03-21T04:00:00Z',
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
    id: '2',
    truckId: 'T002',
    facilityId: 'WS002', // South Dumping Site
    zone: 'Ayawaso West',
    estimatedArrival: '2024-03-21T06:00:00Z',
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
  {
    id: '3',
    truckId: 'T003',
    facilityId: 'WS001',
    zone: 'Ablekuma North',
    estimatedArrival: '2024-03-21T08:00:00Z',
    status: 'completed',
    weight: 600,
    composition: {
      plastic: 25,
      paper: 30,
      glass: 20,
      metal: 15,
      organic: 10,
    },
  },
];

const mockNotifications = loadPersistedData('mockNotifications', []);
const mockWasteSites = loadPersistedData('mockWasteSites', [
  {
    id: 'WS001',
    name: 'North Dumping Site',
    location: 'North Industrial Area',
    currentCapacity: 750,
    maxCapacity: 1000,
    composition: {
      plastic: 40,
      paper: 25,
      glass: 15,
      metal: 10,
      organic: 10,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'WS002',
    name: 'South Dumping Site',
    location: 'South Industrial Zone',
    currentCapacity: 500,
    maxCapacity: 1000,
    composition: {
      plastic: 30,
      paper: 30,
      glass: 20,
      metal: 15,
      organic: 5,
    },
    lastUpdated: new Date().toISOString(),
  },
]);

let notificationCounter = loadPersistedData('notificationCounter', 1);

// Helper function to get users by role
const getUsersByRole = (role: 'resident' | 'dispatcher' | 'recycler') => {
  return mockUsers.filter(user => user.role === role);
};

// Add mock forecast history for composition data
const mockForecastHistory = [
  {
    date: '2025-06-04',
    district: 'Ablekuma North',
    plastic_percent: 30,
    paper_percent: 25,
    glass_percent: 15,
    metal_percent: 20,
    organic_percent: 10,
    total_waste_tonnes: 5.0,
  },
  {
    date: '2025-06-04',
    district: 'Ayawaso West',
    plastic_percent: 35,
    paper_percent: 20,
    glass_percent: 20,
    metal_percent: 15,
    organic_percent: 10,
    total_waste_tonnes: 4.5,
  },
  {
    date: '2025-06-03',
    district: 'Ablekuma North',
    plastic_percent: 28,
    paper_percent: 22,
    glass_percent: 18,
    metal_percent: 22,
    organic_percent: 10,
    total_waste_tonnes: 4.8,
  },
  {
    date: '2025-06-03',
    district: 'Ayawaso West',
    plastic_percent: 32,
    paper_percent: 18,
    glass_percent: 25,
    metal_percent: 15,
    organic_percent: 10,
    total_waste_tonnes: 4.2,
  },
];

// Mock API functions
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await axios.post('/auth/login', { email, password });
      return res.data.user;
    },
    signup: async (data: Partial<User> & { password: string }) => {
      const res = await axios.post('/auth/signup', data);
      return res.data.user;
    },
  },
  reports: {
    create: async (data: Partial<Report>) => {
      const res = await axios.post('/auth/report-bin-full', data);
      return res.data.report;
    },
    list: async (userId?: string) => {
      const url = userId ? `/auth/reports/user/${userId}` : '/auth/reports/active';
      const res = await axios.get(url);
      return res.data.reports;
    },
  },
  bins: {
    list: async () => {
      await delay(1000);
      return mockBinStatuses;
    },
    update: async (id: string, data: Partial<BinStatus>) => {
      await delay(1000);
      const index = mockBinStatuses.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Bin not found');
      mockBinStatuses[index] = { ...mockBinStatuses[index], ...data };
      return mockBinStatuses[index];
    },
  },
  routes: {
    list: async () => {
      await delay(1000);
      return mockRoutes;
    },
    create: async (data: Partial<Route>) => {
      await delay(1000);
      const newRoute: Route = {
        id: String(mockRoutes.length + 1),
        truckId: data.truckId!,
        bins: data.bins!,
        status: 'pending',
        estimatedTime: data.estimatedTime!,
        distance: data.distance!,
      };
      mockRoutes.push(newRoute);
      return newRoute;
    },
  },
  deliveries: {
    list: async () => {
      const res = await axios.get('/auth/deliveries');
      return res.data.deliveries;
    },
    create: async (data: Partial<Delivery>) => {
      const res = await axios.post('/auth/deliveries', data);
      return res.data.delivery;
    },
  },
  wasteSites: {
    list: async () => {
      try {
        console.log('Fetching waste sites from API...');
        console.log('Using base URL:', axios.defaults.baseURL);
        
        // Try with relative URL first
        let res;
        try {
          res = await axios.get('/auth/waste-sites');
        } catch (relativeError) {
          console.log('Relative URL failed, trying full URL...');
          // Fallback to full URL
          res = await axios.get(`${API_BASE_URL}/auth/waste-sites`);
        }
        
        console.log('Waste sites API response:', res.data);
        return res.data.sites || res.data;
      } catch (error) {
        console.error('Error fetching waste sites:', error);
        throw error;
      }
    },
    
    getById: async (id: string) => {
      const res = await axios.get(`/auth/waste-sites/${id}`);
      return res.data.site;
    },
    
    updateComposition: async (id: string, data: WasteSite['composition'] & { updated_by?: string }) => {
      // POST to backend with flat fields and optional updated_by
      const res = await axios.post(`/auth/waste-sites/${id}/composition`, {
        ...data
      });
      return res.data;
    }
  },
  notifications: {
    create: async (data: {
      type: Notification['type'];
      title: string;
      message: string;
      forRole: 'resident' | 'dispatcher' | 'recycler';
      metadata?: Record<string, any>;
    }) => {
      const res = await axios.post('/auth/notifications', data);
      return res.data.notification;
    },

    list: async (userId: string) => {
      const res = await axios.get(`/auth/notifications?userId=${userId}`);
      return res.data.notifications;
    },

    markAsRead: async (id: string) => {
      const res = await axios.put(`/auth/notifications/${id}/read`);
      return res.data.notification;
    },
  },
  forecast: {
    history: async (params: { district?: string } = {}) => {
      const res = await axios.get(`${ML_SERVICE_URL}/forecast/history`, { params });
      return res.data;
    },
  },
}; 