import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

ModuleRegistry.registerModules([AllCommunityModule]);

// ============ LOOKUP MAPS ============

const STATUS_MAP: Record<string, string> = {
  'Pending': 'Pending',
  'Completed': 'Completed',
  'Cancelled': 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'orange',
  'Completed': 'green',
  'Cancelled': 'red',
};

// ============ COMPONENT ============

@Component({
  selector: 'app-book-appointment',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, AgGridAngular],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent implements OnInit {

  appointmentForm!: FormGroup;
  editAppointmentForm!: FormGroup;

  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;

  isModalOpen = false;
  isViewModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  selectedAppointment: any = null;
  appointmentToDelete: any = null;

  columnDefs: ColDef[] = [
    { 
      field: 'tokenNumber', 
      headerName: 'Token Number', 
      flex: 1, 
      filter: true,
      cellRenderer: (p: any) => p.value ? `<strong>${p.value}</strong>` : 'N/A'
    },
    { 
      field: 'citizenName', 
      headerName: 'Citizen Name', 
      flex: 1, 
      filter: true 
    },
    { 
      field: 'contactNumber', 
      headerName: 'Contact Number', 
      flex: 1, 
      filter: true 
    },
    { 
      field: 'serviceType', 
      headerName: 'Service Type', 
      flex: 1, 
      filter: true 
    },
    { 
      field: 'wardNumber', 
      headerName: 'Ward No', 
      flex: 1, 
      filter: true 
    },
    {
      field: 'appointmentTime',
      headerName: 'Appointment Time',
      flex: 1,
      filter: true,
      valueFormatter: (p) => {
        if (!p.value) return '';
        return new Date(p.value).toLocaleString();
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      filter: true,
      cellRenderer: (p: any) =>
        `<span style="color:${STATUS_COLORS[p.value] ?? '#666'};font-weight:bold;">${STATUS_MAP[p.value] ?? 'Unknown'}</span>`,
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 1,
      filter: true,
      valueFormatter: (p) => {
        if (!p.value) return '';
        return new Date(p.value).toLocaleString();
      }
    },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const isDisabled = status === 'Completed' || status === 'Cancelled';
        
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-outline-info" data-action="view" style="padding: 2px 12px; font-size: 12px;">
              View
            </button>
            <button class="btn btn-sm btn-outline-primary" data-action="edit" style="padding: 2px 12px; font-size: 12px;" 
                    ${isDisabled ? 'disabled title="Cannot edit ' + status + ' appointment"' : ''}>
              Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" style="padding: 2px 12px; font-size: 12px;">
              Delete
            </button>
          </div>
        `;
      },
      onCellClicked: (p: any) => {
        const target = p.event.target;
        const action = target.getAttribute('data-action') 
          || target.parentElement?.getAttribute('data-action');
        
        if (action === 'view') {
          this.viewAppointment(p.data);
        } else if (action === 'edit') {
          if (!target.disabled) {
            this.editAppointment(p.data);
          }
        } else if (action === 'delete') {
          this.openDeleteModal(p.data);
        }
      },
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.initAppointmentForm();
    this.initEditForm();

    if (!this.isBrowser) return;

    this.listMyAppointments();
  }

  // ============ FORMS ============

  initAppointmentForm(): void {
    this.appointmentForm = this.fb.group({
      citizenName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      serviceType: ['', Validators.required],
      wardNumber: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      status: ['Pending'],
      notes: [''],
    });
  }

  initEditForm(): void {
    this.editAppointmentForm = this.fb.group({
      appointmentId: [''],
      citizenName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      serviceType: ['', Validators.required],
      wardNumber: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      status: ['Pending'],
      notes: [''],
    });
  }

  // ============ MODAL HELPERS ============

  toggleModal(show: boolean): void {
    this.isModalOpen = show;
    if (!show) this.resetFormToDefaults();
  }

  toggleViewModal(show: boolean): void {
    this.isViewModalOpen = show;
    if (!show) this.selectedAppointment = null;
  }

  toggleEditModal(show: boolean): void {
    this.isEditModalOpen = show;
    if (!show) { 
      this.selectedAppointment = null; 
      this.editAppointmentForm.reset(); 
    }
  }

  toggleDeleteModal(show: boolean): void {
    this.isDeleteModalOpen = show;
    if (!show) {
      this.appointmentToDelete = null;
    }
  }

  openDeleteModal(appointment: any): void {
    this.appointmentToDelete = appointment;
    this.toggleDeleteModal(true);
  }

  confirmDelete(): void {
    if (!this.appointmentToDelete) return;
    
    const id = this.appointmentToDelete.appointmentId || this.appointmentToDelete.id;
    
    this.apiService.cancelAppointment(id).subscribe({
      next: () => { 
        alert('Appointment cancelled successfully!');
        // Remove the deleted item from the list immediately
        this.removeAppointmentFromList(id);
        this.toggleDeleteModal(false);
        this.appointmentToDelete = null;
      },
      error: (err) => { 
        alert('Failed to cancel appointment: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  // Helper method to remove appointment from list without refresh
  private removeAppointmentFromList(appointmentId: string): void {
    this.rowData = this.rowData.filter(item => 
      (item.appointmentId || item.id) !== appointmentId
    );
  }

  viewAppointment(appointment: any): void {
    this.selectedAppointment = appointment;
    this.toggleViewModal(true);
  }

  editAppointment(appointment: any): void {
    // Check if appointment can be edited
    if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
      alert(`This appointment is already ${appointment.status}. Cannot edit.`);
      return;
    }
    
    this.selectedAppointment = appointment;
    this.populateEditForm(appointment);
    this.toggleEditModal(true);
  }

  // ============ DATA ============

  listMyAppointments(): void {
    const decodedToken = this.authService.decodeToken();
    const userId = decodedToken?.UserId;
    
    if (!userId) { 
      alert('Please login first'); 
      return; 
    }

    // Pre-fill user data
    this.appointmentForm.patchValue({
      citizenName: decodedToken.UserName || '',
      wardNumber: decodedToken.WardNumber || ''
    });

    this.apiService.getMyAppointments(userId).subscribe({
      next: (res) => { 
        this.rowData = res || []; 
      },
      error: (err) => { 
        console.error(err);
        if (err.status === 404) {
          this.rowData = [];
        }
      },
    });
  }

  onSubmit(): void {
    if (!this.appointmentForm.valid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const decodedToken = this.authService.decodeToken();
    const userId = decodedToken?.UserId;
    
    if (!userId) { 
      alert('Session expired. Please login again.'); 
      this.router.navigate(['/login']); 
      return; 
    }

    // Generate token number
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const tokenNumber = `TKN-${dateStr}-${randomNum}`;

    const payload = {
      userId: userId,
      citizenName: this.appointmentForm.value.citizenName,
      contactNumber: this.appointmentForm.value.contactNumber,
      serviceType: this.appointmentForm.value.serviceType,
      wardNumber: parseInt(this.appointmentForm.value.wardNumber),
      appointmentTime: new Date(this.appointmentForm.value.appointmentTime).toISOString(),
      status: 'Pending',
      tokenNumber: tokenNumber,
      notes: this.appointmentForm.value.notes || ''
    };

    this.apiService.bookAppointment(payload).subscribe({
      next: (res) => {
        // Add the new appointment to the list immediately
        const newAppointment = {
          ...payload,
          appointmentId: res.appointmentId,
          createdAt: new Date().toISOString()
        };
        this.rowData = [newAppointment, ...this.rowData];
        
        this.isModalOpen = false;
        this.resetFormToDefaults();
        alert(`Appointment booked successfully!\nToken: ${res.tokenNumber}`);
      },
      error: (err) => { 
        alert('Failed to book appointment: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  onUpdateSubmit(): void {
    if (!this.editAppointmentForm.valid) {
      this.editAppointmentForm.markAllAsTouched();
      return;
    }

    const decodedToken = this.authService.decodeToken();
    const userId = decodedToken?.UserId;
    
    if (!userId) { 
      alert('Session expired. Please login again.'); 
      this.router.navigate(['/login']); 
      return; 
    }

    const formValue = { ...this.editAppointmentForm.value };
    const appointmentId = formValue.appointmentId;
    
    const payload = {
      citizenName: formValue.citizenName,
      contactNumber: formValue.contactNumber,
      serviceType: formValue.serviceType,
      wardNumber: parseInt(formValue.wardNumber),
      appointmentTime: new Date(formValue.appointmentTime).toISOString(),
      status: formValue.status,
      notes: formValue.notes || ''
    };

    this.apiService.updateAppointment(appointmentId, payload).subscribe({
      next: (updatedAppointment) => {
        // Update the appointment in the list immediately
        this.updateAppointmentInList(appointmentId, payload);
        this.toggleEditModal(false);
        alert('Appointment updated successfully!');
      },
      error: (err) => { 
        alert('Failed to update appointment: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  // Helper method to update appointment in list without refresh
  private updateAppointmentInList(appointmentId: string, updatedData: any): void {
    this.rowData = this.rowData.map(item => {
      const id = item.appointmentId || item.id;
      if (id === appointmentId) {
        return { ...item, ...updatedData };
      }
      return item;
    });
  }

  // ============ HELPERS ============

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  }

  private resetFormToDefaults(): void {
    const decodedToken = this.authService.decodeToken();
    this.appointmentForm.reset({
      citizenName: decodedToken?.UserName || '',
      wardNumber: decodedToken?.WardNumber || '',
      status: 'Pending',
      notes: ''
    });
  }

  populateEditForm(appointment: any): void {
    this.editAppointmentForm.patchValue({
      appointmentId: appointment.appointmentId || appointment.id,
      citizenName: appointment.citizenName,
      contactNumber: appointment.contactNumber,
      serviceType: appointment.serviceType,
      wardNumber: appointment.wardNumber,
      appointmentTime: this.formatDateForInput(appointment.appointmentTime),
      status: appointment.status || 'Pending',
      notes: appointment.notes || ''
    });
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] || '#666';
  }
}