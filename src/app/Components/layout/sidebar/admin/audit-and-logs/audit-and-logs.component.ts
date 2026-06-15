import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { LogEntry, LogFilter, LogService } from '../../../../../Services/log.service';

// ============ LOOKUP MAPS ============

const LEVEL_MAP: Record<string | number, { label: string; bg: string; color: string }> = {
  0: { label: 'Debug',       bg: '#e2e3e5', color: '#383d41' },
  1: { label: 'Information', bg: '#d4edda', color: '#155724' },
  2: { label: 'Warning',     bg: '#fff3cd', color: '#856404' },
  3: { label: 'Error',       bg: '#f8d7da', color: '#721c24' },
  4: { label: 'Critical',    bg: '#f8d7da', color: '#491217' },
  // String fallbacks (if JsonStringEnumConverter is added to backend later)
  Debug:       { label: 'Debug',       bg: '#e2e3e5', color: '#383d41' },
  Information: { label: 'Information', bg: '#d4edda', color: '#155724' },
  Warning:     { label: 'Warning',     bg: '#fff3cd', color: '#856404' },
  Error:       { label: 'Error',       bg: '#f8d7da', color: '#721c24' },
  Critical:    { label: 'Critical',    bg: '#f8d7da', color: '#491217' },
};

const CATEGORY_MAP: Record<number, string> = {
  0: 'System',               1: 'CitizenServices',      2: 'Grievance',
  3: 'TaxCollection',        4: 'PropertyRecords',       5: 'StaffAttendance',
  6: 'SchemeImplementation', 7: 'MeetingMinutes',        8: 'Infrastructure',
  9: 'ElectionManagement',  10: 'Audit',               11: 'DocumentVerification',
  12: 'WasteManagement',    13: 'Notifications',        14: 'Appointments',
  15: 'Polls',              16: 'ServiceRequests',      17: 'UserManagement',
};

// ============ COMPONENT ============

@Component({
  selector: 'app-audit-and-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './audit-and-logs.component.html',
  styleUrls: ['./audit-and-logs.component.css']
})
export class AuditAndLogsComponent implements OnInit {

  @ViewChild('agGrid') agGrid!: AgGridAngular;

  private gridApi!: GridApi;
  private isBrowser: boolean;

  // ---- Grid ----
  rowData: LogEntry[] = [];
  pagination = false; // Server-side pagination; AG Grid shows one page's worth as-is
  isBrowserReady = false; // Controls *ngIf on <ag-grid-angular> to prevent SSR crash

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
      width: 100,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => `<button class="view-btn" data-id="${p.data.id}">👁️ View</button>`,
      onCellClicked: (p: any) => this.viewLogDetail(p.data.id),
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // ---- Filters & Pagination ----
  filter: LogFilter = { page: 1, pageSize: 20 };
  totalRows = 0;
  levels: string[] = [];
  categories: string[] = [];
  quickFilterText = '';

  // ---- UI State ----
  loading = false;
  Math = Math; // expose to template

  constructor(
    private logService: LogService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return; // Skip all API calls and grid init during SSR

    this.isBrowserReady = true;  // Allows *ngIf="isBrowserReady" on the grid in template
    this.loadFilters();
  }

  // ============ GRID ============

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.loadLogs();
  }

  onSelectionChanged(): void {
    if (this.gridApi) {
      console.log('Selected rows:', this.gridApi.getSelectedRows());
    }
  }

  // ============ DATA LOADING ============

  loadLogs(): void {
    this.loading = true;

    this.logService.getLogs(this.filter).subscribe({
      next: (response) => {
        if (response.success) {
          this.rowData = response.data;
          this.totalRows = response.pagination.totalCount;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading logs:', err);
        this.loading = false;
      },
    });
  }

  loadFilters(): void {
    this.logService.getLogLevels().subscribe({
      next: (res) => { if (res.success) this.levels = res.data.map((l: any) => l.value); },
      error: (err) => console.error('Error loading levels:', err),
    });

    this.logService.getLogCategories().subscribe({
      next: (res) => { if (res.success) this.categories = res.data.map((c: any) => c.value); },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  // ============ FILTER HANDLERS ============

  onQuickFilterChanged(): void {
    this.filter.searchTerm = this.quickFilterText;
    this.filter.page = 1;
    this.loadLogs();
  }

  onLevelChange(level: string): void {
    this.filter.level = level;
    this.filter.page = 1;
    this.loadLogs();
  }

  onCategoryChange(category: string): void {
    this.filter.category = category;
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

  // ============ ACTIONS ============

  exportLogs(format: 'csv' | 'excel' = 'csv'): void {
    this.logService.exportLogs(this.filter, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.${format}`;
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
            `Correlation ID: ${d.correlationId || 'N/A'}`
          );
        }
      },
      error: (err) => {
        console.error('Error fetching log detail:', err);
        alert('Error fetching log details');
      },
    });
  }

  // ============ COMPUTED ============

  get totalPages(): number {
    return Math.ceil(this.totalRows / (this.filter.pageSize ?? 20));
  }
}