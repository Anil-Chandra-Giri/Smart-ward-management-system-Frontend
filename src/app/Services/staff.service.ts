import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateStaffPayload,
  StaffCredentials,
  StaffMember,
  UpdateStaffPayload
} from '../Models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly baseUrl = 'https://localhost:7069/api/staff';

  constructor(private http: HttpClient) {}

  getAll(filters?: { role?: string; wardNumber?: string; search?: string }): Observable<StaffMember[]> {
    const params: Record<string, string> = {};
    if (filters?.role) params['role'] = filters.role;
    if (filters?.wardNumber) params['wardNumber'] = filters.wardNumber;
    if (filters?.search) params['search'] = filters.search;
    return this.http.get<StaffMember[]>(this.baseUrl, { params });
  }

  create(payload: CreateStaffPayload): Observable<{ staff: StaffMember; credentials: StaffCredentials }> {
    return this.http.post<{ staff: StaffMember; credentials: StaffCredentials }>(this.baseUrl, payload);
  }

  update(userId: string, payload: UpdateStaffPayload): Observable<void> {
    return this.http.put<void>(`https://localhost:7069/api/staff/${userId}`, payload);
  }

  setStatus(userId: string, accountStatus: string): Observable<void> {
    return this.http.patch<void>(`https://localhost:7069/api/staff/${userId}/status`, JSON.stringify(accountStatus), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  resetPassword(userId: string): Observable<StaffCredentials> {
    return this.http.post<StaffCredentials>(`https://localhost:7069/api/staff/${userId}/reset-password`, {});
  }

  delete(userId: string): Observable<void> {
    return this.http.delete<void>(`https://localhost:7069/api/staff/${userId}`);
  }
}