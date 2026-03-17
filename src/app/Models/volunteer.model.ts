// src/app/models/volunteer.model.ts
export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: Date;
  skills: string;
  availability: string;
  isActive: boolean;
  registrationDate: Date;
  emergencyContact: string;
  emergencyPhone: string;
  profilePicture: string;
  activeAssignments: number;
}

export interface CreateVolunteer {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: Date;
  skills: string;
  availability: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface UpdateVolunteer {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  skills: string;
  availability: string;
  isActive: boolean;
  emergencyContact: string;
  emergencyPhone: string;
}