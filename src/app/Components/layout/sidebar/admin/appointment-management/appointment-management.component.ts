import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-appointment-management',
  imports: [CommonModule,AgGridAngular],
  templateUrl: './appointment-management.component.html',
  styleUrl: './appointment-management.component.css'
})
export class AppointmentManagementComponent {
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  
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
      width: 120
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
    }
  ];
  
  constructor(private authService:AuthService, private apiService:ApiService, @Inject(PLATFORM_ID) private platformId: object){}
  
  ngOnInit(): void {
    if (!this.isBrowser) return;
      this.listAllAppointments();
    }
    
    listAllAppointments(){
    const UserId=this.authService.decodeToken().UserId;
    if(UserId==null)
    {
      alert("Login First");
    }
   else{
      this.apiService.getAllAppointments().subscribe(
        res=>{
          this.rowData=res;
          console.log(res);
        },
        err=>{
          console.log(err);
        }
      )
    }
    }
  
}
