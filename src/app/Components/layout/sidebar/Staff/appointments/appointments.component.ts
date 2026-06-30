import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, AgGridAngular],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css'
})
export class AppointmentsComponent {
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = true;

  columnDefs: ColDef[] = [
    {
      headerName: 'Citizen Name',
      field: 'citizenName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 180
    },
    {
      headerName: 'Contact Number',
      field: 'contactNumber',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 150
    },
    {
      headerName: 'Service Type',
      field: 'serviceType',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 160
    },
    {
      headerName: 'Ward No',
      field: 'wardNumber',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 110
    },
    {
      headerName: 'Appointment Time',
      field: 'appointmentTime',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 200,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    {
      headerName: 'Token No',
      field: 'tokenNumber',
      filter: 'agTextColumnFilter',
      width: 140
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: 'agSetColumnFilter',
      sortable: true,
      width: 130,
      cellStyle: params => {
        if (params.value === 'Pending') {
          return { color: 'orange', fontWeight: 'bold' };
        }
        if (params.value === 'In Progress') {
          return { color: '#2563eb', fontWeight: 'bold' };
        }
        if (params.value === 'Completed') {
          return { color: 'green', fontWeight: 'bold' };
        }
        if (params.value === 'Cancelled') {
          return { color: 'red', fontWeight: 'bold' };
        }
        return null;
      }
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 200,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 280,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '6px';
        container.style.alignItems = 'center';
        container.style.height = '100%';

        if (status === 'Pending' || status === 'In Queue') {
          container.appendChild(
            this.createButton('Start', '#2563eb', () => this.updateStatus(params.data, 'In Progress'))
          );
        }
        if (status === 'In Progress' || status === 'In Queue' || status === 'Pending') {
          container.appendChild(
            this.createButton('Complete', '#16a34a', () => this.updateStatus(params.data, 'Completed'))
          );
        }
        if (status !== 'Completed' && status !== 'Cancelled') {
          container.appendChild(
            this.createButton('Cancel', '#dc2626', () => this.updateStatus(params.data, 'Cancelled'))
          );
        }
        return container;
      }
    }
  ];

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit(): void {
    this.listAllAppointments();
  }

  listAllAppointments() {
    const UserId = this.authService.decodeToken().UserId;
    if (UserId == null) {
      alert("Login First");
    } else {
      this.apiService.getAllAppointments().subscribe(
        res => {
          this.rowData = res;
          console.log(res);
        },
        err => {
          console.log(err);
        }
      );
    }
  }

  createButton(label: string, color: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerText = label;
    btn.style.background = color;
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.padding = '4px 10px';
    btn.style.fontSize = '12px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  updateStatus(row: any, newStatus: string) {
    if (!row.tokenNumber) {
      alert('No token number found for this appointment.');
      return;
    }

    const previousStatus = row.status;

    this.apiService.updateQueueStatus(row.tokenNumber, newStatus).subscribe(
      (res: any) => {
        // Refresh from server so Appointment + Queue stay in sync
        this.listAllAppointments();
      },
      err => {
        console.log(err);
        row.status = previousStatus;
        alert('Failed to update status.');
      }
    );
  }
}