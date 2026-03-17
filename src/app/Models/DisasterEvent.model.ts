// src/app/models/disaster-event.model.ts
export interface DisasterEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date | null;
  severity: string;
  status: string;
  affectedPeople: number;
  requiredResources: string;
  coordinator: string;
  contactNumber: string;
  assignedVolunteers: number;
}

export interface CreateDisasterEvent {
  eventName: string;
  eventType: string;
  description: string;
  location: string;
  startDate: Date;
  severity: string;
  affectedPeople: number;
  requiredResources: string;
  coordinator: string;
  contactNumber: string;
}

export interface UpdateDisasterEvent {
  eventName: string;
  eventType: string;
  description: string;
  location: string;
  endDate: Date | null;
  severity: string;
  status: string;
  affectedPeople: number;
  requiredResources: string;
  coordinator: string;
  contactNumber: string;
}