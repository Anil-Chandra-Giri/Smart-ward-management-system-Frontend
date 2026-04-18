// services/log.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  userName: string;
  userId: string;
  citizenId: string;
  wardNumber: string;
  department: string;
  ipAddress: string;
  requestPath: string;
  correlationId: string;
  hasException: boolean;
  additionalData: string;
}

export interface LogFilter {
  page?: number;
  pageSize?: number;
  level?: string;
  category?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  wardNumber?: string;
}

export interface DashboardStats {
  totalLogsToday: number;
  errorCount24h: number;
  warningCount24h: number;
  citizenServiceRequests: number;
  grievancesFiled: number;
  grievancesResolved: number;
  logsByCategory: Array<{ category: string; count: number }>;
  recentErrors: LogEntry[];
  recentCitizenActions: LogEntry[];
  topActiveDepartments: Array<{ department: string; count: number }>;
  logsByDay: Array<{ date: string; count: number }>;
  errorsByDay: Array<{ date: string; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  // Update this base URL to match your backend API
  private baseUrl = 'https://localhost:7069/api/admin/AdminLog'; // Change port as needed
  // For development, you might use: private baseUrl = 'http://localhost:5000/api/admin/AdminLog';

  constructor(private http: HttpClient) { }

  // GET: api/admin/AdminLog/logs
  getLogs(filter: LogFilter): Observable<any> {
    let params = new HttpParams()
      .set('page', (filter.page || 1).toString())
      .set('pageSize', (filter.pageSize || 20).toString());
    
    if (filter.level) params = params.set('level', filter.level);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.wardNumber) params = params.set('wardNumber', filter.wardNumber);

    return this.http.get(`${this.baseUrl}/logs`, { params });
  }

  // GET: api/admin/AdminLog/logs/{id}
  getLogDetail(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/logs/${id}`);
  }

  // GET: api/admin/AdminLog/dashboard-stats
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard-stats`);
  }

  // GET: api/admin/AdminLog/categories
  getLogCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/categories`);
  }

  // GET: api/admin/AdminLog/levels
  getLogLevels(): Observable<any> {
    return this.http.get(`${this.baseUrl}/levels`);
  }

  // GET: api/admin/AdminLog/export
  exportLogs(filter: LogFilter, format: string = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filter.level) params = params.set('level', filter.level);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // GET: api/admin/AdminLog/audit/user/{userId}
  getUserAuditTrail(userId: string, page: number = 1, pageSize: number = 50): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get(`${this.baseUrl}/audit/user/${userId}`, { params });
  }

  // GET: api/admin/AdminLog/audit/entity/{entityType}/{entityId}
  getEntityAuditTrail(entityType: string, entityId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/audit/entity/${entityType}/${entityId}`);
  }

  // GET: api/admin/AdminLog/statistics
  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get(`${this.baseUrl}/statistics`, { params });
  }

  // DELETE: api/admin/AdminLog/clear-old
  clearOldLogs(daysToKeep: number = 30): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clear-old`, {
      params: { daysToKeep: daysToKeep.toString() }
    });
  }
}