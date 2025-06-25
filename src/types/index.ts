export type UserRole = 'resident' | 'dispatcher' | 'recycler';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  zone?: string;
  facility?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  userId: string;
  timestamp: string;
  zone: string;
  status: 'new' | 'in-progress' | 'completed';
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface BinStatus {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  fillLevel: number;
  lastUpdated: string;
  zone: string;
}

export interface Route {
  id: string;
  truckId: string;
  bins: string[];
  status: 'pending' | 'active' | 'completed';
  estimatedTime: number;
  distance: number;
}

export interface Delivery {
  id: string;
  truckId: string;
  facilityId: string;
  zone?: string;
  estimatedArrival: string;
  status: 'pending' | 'in-transit' | 'completed' | 'arrived';
  weight: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: number;
  currentLoad: number;
  materials: ('plastic' | 'paper' | 'glass' | 'metal' | 'organic')[];
}

export interface Vehicle {
  id: string;
  type: 'truck' | 'van';
  capacity: number;
  currentLoad: number;
  status: 'available' | 'on-route' | 'maintenance';
  location: {
    lat: number;
    lng: number;
  };
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Zone {
  id: string;
  name: string;
  boundaries: {
    lat: number;
    lng: number;
  }[];
  population: number;
  binCount: number;
  lastCollection: string;
  nextCollection: string;
}

export interface Analytics {
  period: 'day' | 'week' | 'month' | 'year';
  totalCollections: number;
  totalWeight: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
  efficiency: number;
  carbonSaved: number;
  recyclingRate: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, any>;
  action?: {
    label: string;
    url: string;
  };
}

export interface WasteSite {
  id: string;
  name: string;
  location: string;
  currentCapacity: number;
  maxCapacity: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
  lastUpdated?: string;
} 

export interface WasteDetectionResult {
  plastic: number;
  paper: number;
  glass: number;
  metal: number;
  organic: number;
  [key: string]: number;
}

export interface WasteImageUploadResponse {
  result: WasteDetectionResult;
  total_weight: number;
  annotated_image: string; // base64
  raw?: any;
} 