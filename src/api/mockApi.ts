import { User, Report, BinStatus, Route, Delivery, WasteSite, Notification } from '../types';
import axios from 'axios';

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
      await delay(1000);
      const user = mockUsers.find((u) => u.email === email);
      if (!user) throw new Error('Invalid credentials');
      return user;
    },
    signup: async (data: Partial<User> & { password: string }) => {
      await delay(1000);
      const newUser: User = {
        id: String(mockUsers.length + 1),
        email: data.email!,
        role: data.role!,
        name: data.name!,
        phone: data.phone,
        zone: data.zone,
        facility: data.facility,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      persistData('mockUsers', mockUsers);
      return newUser;
    },
  },
  reports: {
    create: async (data: Partial<Report>) => {
      await delay(1000);
      const newReport: Report = {
        id: String(mockReports.length + 1),
        userId: data.userId!,
        timestamp: new Date().toISOString(),
        zone: data.zone!,
        status: 'new',
        description: data.description,
        location: data.location!,
      };
      mockReports.push(newReport);
      return newReport;
    },
    list: async (userId?: string) => {
      await delay(1000);
      return userId
        ? mockReports.filter((r) => r.userId === userId)
        : mockReports;
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
      await delay(1000);
      return mockDeliveries;
    },
    create: async (data: Partial<Delivery>) => {
      await delay(1000);
      const newDelivery: Delivery = {
        id: String(mockDeliveries.length + 1),
        truckId: data.truckId!,
        facilityId: data.facilityId!,
        zone: data.zone || '',
        estimatedArrival: data.estimatedArrival!,
        status: data.status as any || 'pending',
        weight: data.weight!,
        composition: data.composition!,
      };
      mockDeliveries.push(newDelivery);
      persistData('mockDeliveries', mockDeliveries);
      return newDelivery;
    },
  },
  wasteSites: {
    list: async () => {
      // Use real backend
      const res = await axios.get('/api/auth/waste-sites');
      return res.data.sites;
    },
    
    getById: async (id: string) => {
      await delay(500);
      const site = mockWasteSites.find(site => site.id === id);
      if (!site) throw new Error('Waste site not found');
      return site;
    },
    
    updateComposition: async (id: string, data: WasteSite['composition'] & { updated_by?: string }) => {
      // POST to backend with flat fields and optional updated_by
      const res = await axios.post(`/api/auth/waste-sites/${id}/composition`, {
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
      await delay(500);
      
      const targetUsers = getUsersByRole(data.forRole);
      const notificationId = String(notificationCounter++);
      const timestamp = new Date().toISOString();
      
      const notifications = targetUsers.map(user => ({
        id: notificationId,
        userId: user.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp,
        read: false,
        metadata: data.metadata,
      }));

      mockNotifications.push(...notifications);
      
      // Persist the updated data
      persistData('mockNotifications', mockNotifications);
      persistData('notificationCounter', notificationCounter);
      
      return notifications[0];
    },

    list: async (userId: string) => {
      await delay(500);
      return mockNotifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    markAsRead: async (id: string) => {
      await delay(500);
      const notifications = mockNotifications.filter(n => n.id === id);
      notifications.forEach(notification => {
        notification.read = true;
      });
      persistData('mockNotifications', mockNotifications);
      return notifications[0];
    },
  },
  forecast: {
    history: async (params: { district?: string } = {}) => {
      await delay(500);
      // Filter by district if provided
      let data = mockForecastHistory;
      if (params.district) {
        data = data.filter(row => row.district === params.district);
      }
      return data;
    },
  },
}; 