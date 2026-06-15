import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent implements OnInit {

  appointmentForm!: FormGroup;
  showModal = false;
  isBrowserReady = false;
  userId: string = '';
  rowData: any[] = [];
  pageSize = 7;

  columnDefs: ColDef[] = [
    {
      headerName: 'Citizen Name',
      field: 'citizenName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 180,
    },
    {
      headerName: 'Contact Number',
      field: 'contactNumber',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 150,
    },
    {
      headerName: 'Service Type',
      field: 'serviceType',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 160,
    },
    {
      headerName: 'Ward No',
      field: 'wardNumber',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 110,
    },
    {
      headerName: 'Appointment Time',
      field: 'appointmentTime',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 200,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : '',
    },
    {
      headerName: 'Token No',
      field: 'tokenNumber',
      filter: 'agTextColumnFilter',
      width: 120,
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: 'agSetColumnFilter',
      sortable: true,
      width: 130,
      cellStyle: (p) => {
        const colors: Record<string, string> = {
          Pending: 'orange', Completed: 'green', Cancelled: 'red',
        };
        return colors[p.value] ? { color: colors[p.value], fontWeight: 'bold' } : null;
      },
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 200,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : '',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private apiCallService: ApiService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.appointmentForm = this.fb.group({
      citizenName:     ['', Validators.required],
      contactNumber:   ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      serviceType:     ['', Validators.required],
      wardNumber:      ['', Validators.required],
      appointmentTime: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return; // ← skip on SSR

    this.isBrowserReady = true;
    this.userId = this.authService.decodeToken()?.UserId ?? '';
    this.listMyAppointments();
  }

  openModal(): void  { this.showModal = true; }

  closeModal(): void {
    this.showModal = false;
    this.appointmentForm.reset();
  }

  submitForm(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.apiCallService.bookAppointment(this.appointmentForm.value).subscribe({
      next: (res) => { console.log(res); this.listMyAppointments(); },
      error: (err) => { console.error(err); },
    });

    this.closeModal();
  }

  listMyAppointments(): void {
    if (!this.userId) return;

    this.apiCallService.getMyAppointments(this.userId).subscribe({
      next: (res) => { this.rowData = res; },
      error: (err) => { console.error(err); },
    });
  }
}