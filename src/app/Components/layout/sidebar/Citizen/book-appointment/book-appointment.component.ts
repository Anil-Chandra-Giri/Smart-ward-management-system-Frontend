import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-book-appointment',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule, AgGridAngular],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent {
  appointmentForm!: FormGroup;
  showModal = false;
  UserId:string='';
  rowData:any[]=[];
  pageSize=7;
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
  


  constructor(private fb: FormBuilder, private apiCallService:ApiService, private authService:AuthService) {
    this.appointmentForm = this.fb.group({
      citizenName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      serviceType: ['', Validators.required],
      wardNumber: ['', Validators.required],
      appointmentTime: ['', Validators.required]
    });
  }

  ngOnInit(){
    this.UserId =     this.authService.decodeToken().UserId;
    this.listMyAppointments();
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.appointmentForm.reset();
  }

  submitForm() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    console.log(this.appointmentForm.value);

    // TODO: Call your API here
    this.apiCallService.bookAppointment(this.appointmentForm.value).subscribe(res=>{
      console.log(res);
    },
    err=>{
      console.log(err);
    }
  
  )

    this.closeModal();
  }

  listMyAppointments(){
  
    this.apiCallService.getMyAppointments(this.UserId).subscribe(
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
