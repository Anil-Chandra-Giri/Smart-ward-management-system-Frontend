import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule,AgGridAngular],
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

constructor(private authService:AuthService, private apiService:ApiService){}

ngOnInit(): void {
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
