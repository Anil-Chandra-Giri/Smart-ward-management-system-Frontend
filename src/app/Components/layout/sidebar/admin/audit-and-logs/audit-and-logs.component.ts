// audit-and-logs.component.ts
import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { LogEntry, LogFilter, LogService } from '../../../../../Services/log.service';

// ── Lookup maps ───────────────────────────────────────────────────────────────

const LEVEL_MAP: Record<string | number, { label: string; bg: string; color: string }> = {
  0: { label: 'Debug',       bg: '#e2e3e5', color: '#383d41' },
  1: { label: 'Information', bg: '#d4edda', color: '#155724' },
  2: { label: 'Warning',     bg: '#fff3cd', color: '#856404' },
  3: { label: 'Error',       bg: '#f8d7da', color: '#721c24' },
  4: { label: 'Critical',    bg: '#f8d7da', color: '#491217' },
  Debug:       { label: 'Debug',       bg: '#e2e3e5', color: '#383d41' },
  Information: { label: 'Information', bg: '#d4edda', color: '#155724' },
  Warning:     { label: 'Warning',     bg: '#fff3cd', color: '#856404' },
  Error:       { label: 'Error',       bg: '#f8d7da', color: '#721c24' },
  Critical:    { label: 'Critical',    bg: '#f8d7da', color: '#491217' },
};

const CATEGORY_MAP: Record<string | number, string> = {
  0: 'System',               1: 'CitizenServices',      2: 'Grievance',
  3: 'TaxCollection',        4: 'PropertyRecords',       5: 'StaffAttendance',
  6: 'SchemeImplementation', 7: 'MeetingMinutes',        8: 'Infrastructure',
  9: 'ElectionManagement',  10: 'Audit',               11: 'DocumentVerification',
  12: 'WasteManagement',    13: 'Notifications',        14: 'Appointments',
  15: 'Polls',              16: 'ServiceRequests',      17: 'UserManagement',
  System: 'System', CitizenServices: 'CitizenServices', Grievance: 'Grievance',
  TaxCollection: 'TaxCollection', PropertyRecords: 'PropertyRecords',
  StaffAttendance: 'StaffAttendance', SchemeImplementation: 'SchemeImplementation',
  MeetingMinutes: 'MeetingMinutes', Infrastructure: 'Infrastructure',
  ElectionManagement: 'ElectionManagement', Audit: 'Audit',
  DocumentVerification: 'DocumentVerification', WasteManagement: 'WasteManagement',
  Notifications: 'Notifications', Appointments: 'Appointments',
  Polls: 'Polls', ServiceRequests: 'ServiceRequests', UserManagement: 'UserManagement',
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-audit-and-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './audit-and-logs.component.html',
  styleUrls: ['./audit-and-logs.component.css'],
})
export class AuditAndLogsComponent implements OnInit {

  @ViewChild('agGrid') agGrid!: AgGridAngular;

  private gridApi!: GridApi;
  private isBrowser: boolean;

  // ── Grid state ────────────────────────────────────────────────────────────

  rowData: LogEntry[] = [];
  isBrowserReady = false;

  columnDefs: ColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      sortable: true,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : '',
    },
    {
      field: 'level',
      headerName: 'Level',
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: (p: any) => {
        const entry = LEVEL_MAP[p.value] ?? { label: String(p.value), bg: '#e2e3e5', color: '#383d41' };
        return `<span style="background-color:${entry.bg};color:${entry.color};
                  padding:3px 8px;border-radius:12px;font-size:12px;font-weight:500;">
                  ${entry.label}
                </span>`;
      },
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueFormatter: (p) => CATEGORY_MAP[p.value] ?? String(p.value),
    },
    {
      field: 'message',
      headerName: 'Message',
      width: 400,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      tooltipField: 'message',
      cellRenderer: (p: any) => {
        const msg: string = p.value ?? '';
        return msg.length > 100 ? msg.substring(0, 100) + '…' : msg;
      },
    },
    {
      field: 'userName',
      headerName: 'User',
      width: 120,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueGetter: (p) => p.data?.userName || 'System',
    },
    {
      field: 'wardNumber',
      headerName: 'Ward',
      width: 100,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      field: 'ipAddress',
      headerName: 'IP Address',
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      // Widened from 100 to fit both buttons when a row is restorable.
      width: 190,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => {
        const viewBtn = `<button data-action="view" data-id="${p.data.id}"
          style="margin-right:6px;padding:4px 8px;border:1px solid #d0d5dd;
          border-radius:6px;background:#fff;cursor:pointer;font-size:12px;">
          👁️ View</button>`;

        // Only restorable entries (those carrying a before-state snapshot) get
        // a Restore button — see IsRestorable on the backend response.
        const restoreBtn = p.data.isRestorable
          ? `<button data-action="restore" data-id="${p.data.id}"
              style="padding:4px 8px;border:1px solid #b42318;border-radius:6px;
              background:#fef3f2;color:#b42318;cursor:pointer;font-size:12px;">
              ↩️ Restore</button>`
          : '';

        return `<div>${viewBtn}${restoreBtn}</div>`;
      },
      onCellClicked: (p: any) => {
        const target = p.event?.target as HTMLElement | null;
        const actionEl = target?.closest('[data-action]') as HTMLElement | null;
        if (!actionEl) return;

        const action = actionEl.getAttribute('data-action');
        const id = Number(actionEl.getAttribute('data-id'));

        if (action === 'view') {
          this.viewLogDetail(id);
        } else if (action === 'restore') {
          this.restoreLog(id);
        }
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // ── Filter / pagination state ─────────────────────────────────────────────

  filter: LogFilter = { page: 1, pageSize: 20 };
  totalRows = 0;
  levels: string[] = [];
  categories: string[] = [];
  quickFilterText = '';

  // ── UI state ──────────────────────────────────────────────────────────────

  loading = false;
  errorMessage = '';
  Math = Math;

  constructor(
    private logService: LogService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.isBrowserReady = true;
    this.loadFilters();
    this.loadLogs();
  }

  // ── Grid callbacks ────────────────────────────────────────────────────────

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.rowData.length === 0 && !this.loading) {
      this.loadLogs();
    }
  }

  onSelectionChanged(): void {
    if (this.gridApi) {
      console.log('Selected rows:', this.gridApi.getSelectedRows());
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.logService.getLogs(this.filter).subscribe({
      next: (response) => {
        if (response.success) {
          this.rowData = response.data;
          this.totalRows = response.pagination.totalCount;
        } else {
          this.errorMessage = 'The server returned an unsuccessful response.';
          this.rowData = [];
          this.totalRows = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading logs:', err);
        if (err.status === 401) {
          this.errorMessage = 'Unauthorised — please log in again.';
        } else if (err.status === 403) {
          this.errorMessage = 'You do not have permission to view logs.';
        } else {
          this.errorMessage = `Error loading logs (HTTP ${err.status}).`;
        }
        this.rowData = [];
        this.totalRows = 0;
        this.loading = false;
      },
    });
  }

  loadFilters(): void {
    this.logService.getLogLevels().subscribe({
      next: (res) => {
        if (res.success) {
          this.levels = res.data.map((l: any) => l.value);
        }
      },
      error: (err) => console.error('Error loading levels:', err),
    });

    this.logService.getLogCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data.map((c: any) => c.value);
        }
      },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onQuickFilterChanged(): void {
    this.filter.searchTerm = this.quickFilterText || undefined;
    this.filter.page = 1;
    this.loadLogs();
  }

  onLevelChange(level: string): void {
    this.filter.level = level || undefined;
    this.filter.page = 1;
    this.loadLogs();
  }

  onCategoryChange(category: string): void {
    this.filter.category = category || undefined;
    this.filter.page = 1;
    this.loadLogs();
  }

  onDateRangeChange(): void {
    this.filter.page = 1;
    this.loadLogs();
  }

  onPageSizeChange(pageSize: number): void {
    this.filter.pageSize = pageSize;
    this.filter.page = 1;
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.filter.page = page;
    this.loadLogs();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  exportLogs(format: 'csv' | 'excel' = 'csv'): void {
    this.logService.exportLogs(this.filter, format).subscribe({
      next: (blob) => {
        const ext = format === 'excel' ? 'csv' : format;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting logs:', err);
        alert('Export failed. Please try again.');
      },
    });
  }

  exportToExcel(): void {
    this.exportLogs('excel');
  }

  clearOldLogs(): void {
    if (!confirm('Are you sure you want to clear logs older than 30 days?')) return;

    this.logService.clearOldLogs(30).subscribe({
      next: (res) => {
        if (res.success) {
          alert(res.message);
          this.loadLogs();
        }
      },
      error: (err) => {
        console.error('Error clearing logs:', err);
        alert('Failed to clear logs. Please try again.');
      },
    });
  }

  viewLogDetail(id: number): void {
    this.logService.getLogDetail(id).subscribe({
      next: (res) => {
        if (res.success) {
          const d = res.data;
          const levelEntry = LEVEL_MAP[d.level] ?? { label: String(d.level) };
          alert(
            `📋 LOG DETAILS\n\n` +
            `Time:           ${new Date(d.timestamp).toLocaleString()}\n` +
            `Level:          ${levelEntry.label}\n` +
            `Category:       ${d.category}\n` +
            `Message:        ${d.message}\n` +
            `User:           ${d.userName || 'System'}\n` +
            `Ward:           ${d.wardNumber || 'N/A'}\n` +
            `IP:             ${d.ipAddress || 'N/A'}\n` +
            `Correlation ID: ${d.correlationId || 'N/A'}` +
            (d.isRestorable ? `\n\nThis entry can be restored from the Actions column.` : '')
          );
        }
      },
      error: (err) => {
        console.error('Error fetching log detail:', err);
        alert('Error fetching log details');
      },
    });
  }

  // Restores the entity this log entry points to, back to its BeforeState
  // snapshot. Handles both "undo an edit/status-change" (entity still exists)
  // and "undo a delete" (entity gets recreated with a fresh temp password)
  // since the backend distinguishes those and returns `recreated` either way.
  restoreLog(id: number): void {
    if (!confirm('Restore this record to its previous state? This action will itself be logged and can\'t be silently undone.')) {
      return;
    }

    this.logService.restoreFromLog(id).subscribe({
      next: (res) => {
        if (res.success) {
          let msg = res.message;
          if (res.recreated && res.newTemporaryPassword) {
            msg +=
              `\n\nUsername: ${res.newUsername}\n` +
              `Temporary password: ${res.newTemporaryPassword}\n\n` +
              `Share these with the person directly — they won't be shown again.`;
          }
          alert(msg);
          this.loadLogs();
        } else {
          alert(res.message || 'Restore failed.');
        }
      },
      error: (err) => {
        console.error('Error restoring log:', err);
        const msg = err?.error?.message || 'Failed to restore. Please try again.';
        alert(msg);
      },
    });
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.totalRows / (this.filter.pageSize ?? 20));
  }
}