// services/log.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Interfaces ────────────────────────────────────────────────────────────────

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
  // Restore support — present once AdminLogController returns these (it does
  // for GetLogs / GetLogDetail / GetEntityAuditTrail as of the restore feature).
  isRestorable: boolean;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  recreated: boolean;
  newUsername?: string | null;
  newTemporaryPassword?: string | null;
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

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LogsResponse {
  success: boolean;
  data: LogEntry[];
  pagination: PaginationMeta;
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private baseUrl = 'https://localhost:7069/api/admin/AdminLog';

  constructor(private http: HttpClient) {}

  // GET: api/admin/AdminLog/logs
  getLogs(filter: LogFilter): Observable<LogsResponse> {
    let params = new HttpParams()
      .set('page', (filter.page ?? 1).toString())
      .set('pageSize', (filter.pageSize ?? 20).toString());

    if (filter.level)      params = params.set('level',      filter.level);
    if (filter.category)   params = params.set('category',   filter.category);
    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.startDate)  params = params.set('startDate',  filter.startDate);
    if (filter.endDate)    params = params.set('endDate',    filter.endDate);
    if (filter.userId)     params = params.set('userId',     filter.userId);
    if (filter.wardNumber) params = params.set('wardNumber', filter.wardNumber);

    return this.http.get<LogsResponse>(`${this.baseUrl}/logs`, { params });
  }

  // GET: api/admin/AdminLog/logs/{id}
  getLogDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/logs/${id}`);
  }

  // POST: api/admin/AdminLog/logs/{id}/restore
  restoreFromLog(id: number): Observable<RestoreResult> {
    return this.http.post<RestoreResult>(`${this.baseUrl}/logs/${id}/restore`, {});
  }

  // GET: api/admin/AdminLog/dashboard-stats
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard-stats`);
  }

  // GET: api/admin/AdminLog/categories
  getLogCategories(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/categories`);
  }

  // GET: api/admin/AdminLog/levels
  getLogLevels(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/levels`);
  }

  // GET: api/admin/AdminLog/export
  exportLogs(filter: LogFilter, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const backendFormat = format === 'excel' ? 'csv' : format;

    let params = new HttpParams().set('format', backendFormat);
    if (filter.level)     params = params.set('level',     filter.level);
    if (filter.category)  params = params.set('category',  filter.category);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate)   params = params.set('endDate',   filter.endDate);

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  // GET: api/admin/AdminLog/audit/user/{userId}
  getUserAuditTrail(userId: string, page = 1, pageSize = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.baseUrl}/audit/user/${userId}`, { params });
  }

  // GET: api/admin/AdminLog/audit/entity/{entityType}/{entityId}
  getEntityAuditTrail(entityType: string, entityId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/audit/entity/${entityType}/${entityId}`);
  }

  // GET: api/admin/AdminLog/statistics
  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate',   endDate);

    return this.http.get<any>(`${this.baseUrl}/statistics`, { params });
  }

  // DELETE: api/admin/AdminLog/clear-old
  clearOldLogs(daysToKeep = 30): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/clear-old`, {
      params: { daysToKeep: daysToKeep.toString() },
    });
  }
}