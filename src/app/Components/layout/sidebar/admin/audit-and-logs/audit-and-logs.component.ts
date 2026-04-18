// audit-and-logs.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { LogEntry, LogFilter, LogService } from '../../../../../Services/log.service';

@Component({
  selector: 'app-audit-and-logs',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    AgGridAngular
  ],
  templateUrl: './audit-and-logs.component.html',
  styleUrls: ['./audit-and-logs.component.css']
})
export class AuditAndLogsComponent implements OnInit {
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  
  private gridApi!: GridApi;
  
  // Row data - AG Grid will use this directly
  rowData: LogEntry[] = [];
  
  // Column definitions
  columnDefs: ColDef[] = [
    { 
      field: 'timestamp', 
      headerName: 'Timestamp', 
      width: 180,
      sortable: true,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      valueFormatter: (params: any) => {
        return params.value ? new Date(params.value).toLocaleString() : '';
      }
    },
    { 
      field: 'level', 
      headerName: 'Level', 
      width: 120,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: (params: any) => {
        const level = params.value;
        let bgColor = '';
        let color = '';
        switch(level) {
          case 'Error':
            bgColor = '#f8d7da';
            color = '#721c24';
            break;
          case 'Warning':
            bgColor = '#fff3cd';
            color = '#856404';
            break;
          case 'Critical':
            bgColor = '#f8d7da';
            color = '#721c24';
            break;
          default:
            bgColor = '#d4edda';
            color = '#155724';
        }
        return `<span style="background-color: ${bgColor}; color: ${color}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${level}</span>`;
      }
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true
    },
    { 
      field: 'message', 
      headerName: 'Message', 
      width: 400,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      tooltipField: 'message',
      cellRenderer: (params: any) => {
        const message = params.value;
        return message && message.length > 100 ? message.substring(0, 100) + '...' : message;
      }
    },
    { 
      field: 'userName', 
      headerName: 'User', 
      width: 120,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueGetter: (params: any) => {
        return params.data?.userName || 'System';
      }
    },
    { 
      field: 'wardNumber', 
      headerName: 'Ward', 
      width: 100,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true
    },
    { 
      field: 'department', 
      headerName: 'Department', 
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true
    },
    { 
      field: 'ipAddress', 
      headerName: 'IP Address', 
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return `<button class="view-btn" data-id="${params.data.id}">👁️ View</button>`;
      },
      onCellClicked: (params: any) => {
        if (params.colDef.field === 'actions') {
          this.viewLogDetail(params.data.id);
        }
      }
    }
  ];
  
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };
  
  // Pagination
  paginationPageSize = 20;
  paginationPageSizeSelector = [10, 20, 50, 100];
  totalRows = 0;
  
  // Filters
  filter: LogFilter = {
    page: 1,
    pageSize: 20
  };
  
  levels: string[] = [];
  categories: string[] = [];
  loading = false;
  quickFilterText = '';
  
  // Expose Math to template
  Math = Math;

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.loadFilters();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.logService.getLogs(this.filter).subscribe({
      next: (response) => {
        if (response.success) {
          // Simply assign the data to rowData - AG Grid will update automatically
          this.rowData = response.data;
          this.totalRows = response.pagination.totalCount;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading logs', error);
        this.loading = false;
      }
    });
  }

  loadFilters(): void {
    this.logService.getLogLevels().subscribe(response => {
      if (response.success) {
        this.levels = response.data.map((l: any) => l.value);
      }
    });
    
    this.logService.getLogCategories().subscribe(response => {
      if (response.success) {
        this.categories = response.data.map((c: any) => c.value);
      }
    });
  }

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

  exportLogs(format: string = 'csv'): void {
    this.logService.exportLogs(this.filter, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting logs', error);
      }
    });
  }

  exportToExcel(): void {
    this.exportLogs('csv');
  }

  clearOldLogs(): void {
    if (confirm('Are you sure you want to clear logs older than 30 days?')) {
      this.logService.clearOldLogs(30).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.message);
            this.loadLogs();
          }
        },
        error: (error) => {
          console.error('Error clearing logs', error);
        }
      });
    }
  }

  viewLogDetail(id: number): void {
    this.logService.getLogDetail(id).subscribe({
      next: (response) => {
        if (response.success) {
          // You can replace this with a modal dialog
          alert(`📋 LOG DETAILS\n\n` +
            `Time: ${new Date(response.data.timestamp).toLocaleString()}\n` +
            `Level: ${response.data.level}\n` +
            `Category: ${response.data.category}\n` +
            `Message: ${response.data.message}\n` +
            `User: ${response.data.userName || 'System'}\n` +
            `Ward: ${response.data.wardNumber || 'N/A'}\n` +
            `IP: ${response.data.ipAddress || 'N/A'}\n` +
            `Correlation ID: ${response.data.correlationId || 'N/A'}`);
        }
      },
      error: (error) => {
        console.error('Error fetching log detail', error);
        alert('Error fetching log details');
      }
    });
  }

  onSelectionChanged(event: any): void {
    if (this.gridApi) {
      const selectedRows = this.gridApi.getSelectedRows();
      console.log('Selected rows:', selectedRows);
    }
  }
}