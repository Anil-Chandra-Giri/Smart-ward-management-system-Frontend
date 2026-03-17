// src/app/models/resource.model.ts
export interface Resource {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  quantity: number;
  minimumThreshold: number;
  unit: string;
  expiryDate: Date | null;
  storageLocation: string;
  supplier: string;
  unitPrice: number | null;
  status: string;
  lastUpdated: Date;
  isLowStock: boolean;
}

export interface CreateResource {
  name: string;
  type: string;
  category: string;
  description: string;
  quantity: number;
  minimumThreshold: number;
  unit: string;
  expiryDate: Date | null;
  storageLocation: string;
  supplier: string;
  unitPrice: number | null;
}

export interface UpdateResource {
  name: string;
  type: string;
  category: string;
  description: string;
  quantity: number;
  minimumThreshold: number;
  unit: string;
  expiryDate: Date | null;
  storageLocation: string;
  supplier: string;
  unitPrice: number | null;
}