import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { ApiService } from '../../../../../Services/api.service';
import { Notice } from '../../../../../Models/notice';
import { AgGridModule } from 'ag-grid-angular';
import { formatDate } from '../../../../shared/image-cell/date-utils/date-utils';

@Component({
  selector: 'app-citizen-notices',
  imports: [AgGridModule, CommonModule],
  templateUrl: './citizen-notices.component.html',
  styleUrl: './citizen-notices.component.css'
})
export class CitizenNoticesComponent implements OnInit {

  isBrowserReady = false;

  rowData: Notice[] = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Title',
      field: 'title',
      flex: 1
    },
    {
      headerName: 'Category',
      field: 'category',
      width: 150,
      sortable: true,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Description',
      field: 'description',
      flex: 2
    },
    {
      headerName: 'Urgent',
      field: 'isUrgent',
      width: 100,
      sortable: true,
      cellRenderer: (params: any) => {
        return params.value
          ? '<span style="color:red;font-weight:bold;">URGENT</span>'
          : '<span style="color:purple;font-weight:bold;">Normal</span>';
      },
      valueFormatter: (params: any) => {
        return params.value ? 'Urgent' : 'Normal';
      },
      comparator: (a: any, b: any) => {
        return (b === true ? 1 : 0) - (a === true ? 1 : 0);
      }
    },
    {
      headerName: 'Publish Date',
      field: 'publishDate',
      width: 150,
      flex: 1,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: any) => formatDate(params.value),
      comparator: (date1: string, date2: string) => {
        return new Date(date1).getTime() - new Date(date2).getTime();
      }
    },
    {
      headerName: 'Expiry Date',
      field: 'expiryDate',
      width: 150,
      valueFormatter: (params: any) => formatDate(params.value)
    },
    {
      headerName: 'Attachment',
      field: 'fileUrl',
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.value) return '';
        const fileUrl = `https://localhost:7069/${params.value}`;
        return `<a href="${fileUrl}" download target="_blank">Download</a>`;
      }
    }
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  constructor(
    private noticeService: ApiService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isBrowserReady = true;
    this.loadNotices();
  }

  loadNotices(): void {
    this.noticeService.getNotices().subscribe({
      next: (data) => { this.rowData = data; },
      error: (err) => { console.error(err); }
    });
  }
}