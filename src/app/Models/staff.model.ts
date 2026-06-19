export type StaffRole = 'Staff' | 'Admin';

export interface StaffMember {
  userId: string;
  username: string;
  fullNameEnglish: string;
  fullNameNepali: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  wardNumber: string;
  municipality: string;
  accountStatus: 'Active' | 'Suspended' | string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateStaffPayload {
  username: string;
  email: string;
  fullNameEnglish: string;
  fullNameNepali?: string;
  phoneNumber: string;
  role: StaffRole;
  employeeId?: string;
  department?: string;
  designation?: string;
  wardNumber: string;
  municipality: string;
  district: string;
  province: string;
}

export interface UpdateStaffPayload {
  fullNameEnglish: string;
  fullNameNepali?: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  employeeId?: string;
  department?: string;
  designation?: string;
  wardNumber: string;
  municipality: string;
  district: string;
  province: string;
  accountStatus: string;
}

export interface StaffCredentials {
  username: string;
  temporaryPassword: string;
}