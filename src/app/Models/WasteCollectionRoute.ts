// src/app/models/waste-collection.models.ts
export enum WasteType {
  General = 1,
  Recyclable = 2,
  Hazardous = 3,
  Biomedical = 4,
  Organic = 5
}

export enum RouteStatus {
  Planned = 1,
  InProgress = 2,
  Completed = 3,
  Delayed = 4,
  Cancelled = 5
}

export enum VehicleStatus {
  Available = 1,
  InUse = 2,
  Maintenance = 3,
  OutOfService = 4
}
export interface WasteCollectionRoute {
  id: string;  // Changed from number to string (GUID)
  routeName: string;
  wasteType: string;
  scheduledDate: Date;
  startTime?: Date;
  endTime?: Date;
  status: string;
  assignedVehicleId: string;
  vehicleName: string;
  vehicleNumber: string;
  assignedDriverId: string;
  driverName: string;
  driverPhone?: string;
  description?: string;
  collectionPoints: CollectionPoint[];
  estimatedDistance: number;
  estimatedDuration: number;
  createdAt: Date;
}

export interface CreateRoute {
  routeName: string;
  wasteType: WasteType;
  scheduledDate: Date;
  assignedVehicleId: string;
  assignedDriverId: string;
  description?: string;
  collectionPoints: CreateCollectionPoint[];
}

export interface CreateCollectionPoint {
  address: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
}

export interface CollectionPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  actualCollectionTime?: Date;
  wasteQuantity?: number;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  status: string;
  capacity: number;
  vehicleType: string;
  latitude: number;
  longitude: number;
  lastUpdatedLocation: Date;
  isActive: boolean;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  isAvailable: boolean;
  hireDate?: Date;
  address?: string;
}

export interface RouteStatusUpdate {
  routeId: string;
  status: RouteStatus;
  delayReason?: string;
  delayMinutes?: number;
}

export interface Schedule {
  id: string;
  routeName: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: string;
  delayReason?: string;
  vehicleNumber: string;
  driverName: string;
}

export interface DailySchedule {
  date: Date;
  dayOfWeek: string;
  routes: Schedule[];
}

export interface WeeklySchedule {
  weekStartDate: Date;
  weekEndDate: Date;
  dailySchedules: DailySchedule[];
}

export interface RealtimeUpdate {
  routeId: string;
  routeName: string;
  vehicleNumber: string;
  vehicleLocation: VehicleLocation;
  driverName: string;
  status: string;
  startTime?: Date;
  estimatedCompletion?: Date;
  collectionPoints: CollectionPointStatus[];
  completedPoints: number;
  totalPoints: number;
  progressPercentage: number;
}

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export interface CollectionPointStatus {
  address: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  actualCollectionTime?: Date;
  isCompleted: boolean;
}