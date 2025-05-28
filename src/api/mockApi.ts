import { User, Report, BinStatus, Route, Delivery } from '../types';

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data
const mockUsers: User[] = [
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
];

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
    facilityId: 'F001',
    estimatedArrival: '2024-03-20T11:00:00Z',
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
        estimatedArrival: data.estimatedArrival!,
        status: 'pending',
        weight: data.weight!,
        composition: data.composition!,
      };
      mockDeliveries.push(newDelivery);
      return newDelivery;
    },
  },
}; 