import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import NepaliDate from 'nepali-date-converter';

ModuleRegistry.registerModules([AllCommunityModule]);

// ============ LOOKUP MAPS ============

const SERVICE_TYPE: Record<number, string> = {
  1: 'Birth Certificate',
  2: 'Death Certificate',
  3: 'Recommendation Letter',
  4: 'Property Document',
  5: 'Marriage Registration',
  6: 'Migration Certificate',
  7: 'Address Verification',
};

const PRIORITY_LEVELS: Record<number, string> = { 0: 'Normal', 1: 'Urgent' };

const STATUS_MAP: Record<number, string> = {
  1: 'Pending', 2: 'In Review', 3: 'Approved', 4: 'Rejected',
};

const STATUS_COLORS: Record<number, string> = {
  1: 'orange', 2: 'blue', 3: 'green', 4: 'red',
};

// ============ COMPONENT ============

@Component({
  selector: 'app-request-service',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, AgGridAngular],
  templateUrl: './request-service.component.html',
  styleUrl: './request-service.component.css'
})
export class RequestServiceComponent implements OnInit {

  requestForm!: FormGroup;
  editRequestForm!: FormGroup;

  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;

  isModalOpen = false;
  isViewModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  selectedRequest: any = null;
  serviceToDelete: any = null;

  serviceOptions = [
    { value: 7, label: 'Birth Certificate' },
    { value: 1, label: 'Death Certificate' },
    { value: 2, label: 'Recommendation Letter' },
    { value: 3, label: 'Property Document' },
    { value: 4, label: 'Marriage Registration' },
    { value: 5, label: 'Migration Certificate' },
    { value: 6, label: 'Address Verification' },
  ];

  columnDefs: ColDef[] = [
    { field: 'applicationNumber', headerName: 'Application Number', flex: 1, filter: true },
    {
      field: 'serviceType', headerName: 'Service Type', flex: 1, filter: true,
      valueFormatter: (p) => SERVICE_TYPE[p.value] ?? 'Unknown',
    },
    { field: 'purpose', headerName: 'Purpose', flex: 1, filter: true },
    { field: 'requestedWard', headerName: 'Requested Ward', flex: 1, filter: true },
    {
      field: 'status', headerName: 'Status', flex: 1, filter: true,
      cellRenderer: (p: any) =>
        `<span style="color:${STATUS_COLORS[p.value] ?? '#666'};font-weight:bold;">${STATUS_MAP[p.value] ?? 'Unknown'}</span>`,
    },
    {
      field: 'priorityLevel', headerName: 'Priority Level', flex: 1, filter: true,
      cellRenderer: (p: any) => {
        const color = p.value === 0 ? 'green' : p.value === 1 ? 'red' : '#666';
        return `<span style="color:${color};font-weight:bold;">${PRIORITY_LEVELS[p.value] ?? 'Unknown'}</span>`;
      },
    },
    {
      field: 'createdAt', headerName: 'Submitted On', flex: 1, filter: true,
      valueFormatter: (p) => {
        if (!p.value) return '';
        try {
          return new NepaliDate(new Date(p.value)).format('YYYY/MM/DD');
        } catch {
          return p.value;
        }
      },
    },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const isDisabled = status === 3 || status === 4; // Approved or Rejected
        
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-outline-info" data-action="view" style="padding: 2px 12px; font-size: 12px;">
              View
            </button>
            <button class="btn btn-sm btn-outline-primary" data-action="edit" style="padding: 2px 12px; font-size: 12px;"
                    ${isDisabled ? 'disabled title="Cannot edit ' + (STATUS_MAP[status] || '') + ' request"' : ''}>
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
          this.viewServiceRequest(p.data);
        } else if (action === 'edit') {
          if (!target.disabled) {
            this.editServiceRequest(p.data);
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

    this.initRequestForm();
    this.initEditForm();

    if (!this.isBrowser) return;

    this.listRequestedServices();
  }

  // ============ FORMS ============

  private buildServiceFields() {
    return {
      // Birth
      ChildFullName: [''], DateOfBirth: [''], Gender: [''], PlaceOfBirth: [''],
      FatherFullName: [''], MotherFullName: [''], GrandfatherFullName: [''],
      // Death
      DeceasedFullName: [''], DateOfDeath: [''], PlaceOfDeath: [''],
      CauseOfDeath: [''], RelationshipToApplicant: [''], CitizenshipNoOfDeceased: [''],
      // Recommendation
      LetterCategory: [''], RecipientOrganization: [''],
      // Property
      PlotNumber: [''], SheetNumber: [''], TotalArea: [''],
      PropertyType: [''], CurrentOwnerName: [''], LandRevenueReceiptNumber: [''],
      // Marriage
      GroomFullName: [''], BrideFullName: [''], MarriageDate: [''],
      MarriageVenue: [''], GroomCitizenshipNo: [''], BrideCitizenshipNo: [''],
      // Migration
      MigrationType: ['Incoming'], OriginAddress: [''], DestinationAddress: [''],
      TotalFamilyMembersMoving: [1], ReasonForMigration: [''],
      // Address
      HouseNumber: [''], StreetName: [''], YearsOfStay: [''],
    };
  }

  initRequestForm(): void {
    this.requestForm = this.fb.group({
      ServiceType: ['', Validators.required],
      Purpose: ['', Validators.required],
      Description: ['', Validators.required],
      RequestedWard: ['', Validators.required],
      RequestedMunicipality: ['', Validators.required],
      PriorityLevel: ['0'],
      SubmissionMode: ['Online'],
      Remarks: [''],
      ...this.buildServiceFields(),
    });
  }

  initEditForm(): void {
    this.editRequestForm = this.fb.group({
      serviceRequestId: [''],
      purpose: ['', Validators.required],
      description: ['', Validators.required],
      requestedWard: ['', Validators.required],
      requestedMunicipality: ['', Validators.required],
      priorityLevel: ['0'],
      // reuse same fields in camelCase
      childFullName: [''], dateOfBirth: [''], gender: [''], placeOfBirth: [''],
      fatherFullName: [''], motherFullName: [''], grandfatherFullName: [''],
      deceasedFullName: [''], dateOfDeath: [''], placeOfDeath: [''],
      causeOfDeath: [''], relationshipToApplicant: [''], citizenshipNoOfDeceased: [''],
      letterCategory: [''], recipientOrganization: [''],
      plotNumber: [''], sheetNumber: [''], totalArea: [''],
      propertyType: [''], currentOwnerName: [''], landRevenueReceiptNumber: [''],
      groomFullName: [''], brideFullName: [''], marriageDate: [''],
      marriageVenue: [''], groomCitizenshipNo: [''], brideCitizenshipNo: [''],
      migrationType: ['Incoming'], originAddress: [''], destinationAddress: [''],
      totalFamilyMembersMoving: [1], reasonForMigration: [''],
      houseNumber: [''], streetName: [''], yearsOfStay: [''],
    });
  }

  // ============ GETTERS ============

  get selectedService(): number {
    return Number(this.requestForm.get('ServiceType')?.value);
  }

  get editSelectedService(): number {
    return Number(this.selectedRequest?.serviceType);
  }

  // ============ MODAL HELPERS ============

  toggleModal(show: boolean): void {
    this.isModalOpen = show;
    if (!show) this.resetFormToDefaults();
  }

  toggleViewModal(show: boolean): void {
    this.isViewModalOpen = show;
    if (!show) this.selectedRequest = null;
  }

  toggleEditModal(show: boolean): void {
    this.isEditModalOpen = show;
    if (!show) { 
      this.selectedRequest = null; 
      this.editRequestForm.reset(); 
    }
  }

  toggleDeleteModal(show: boolean): void {
    this.isDeleteModalOpen = show;
    if (!show) {
      this.serviceToDelete = null;
    }
  }

  openDeleteModal(service: any): void {
    // Check if service can be deleted
    if (service.status === 3 || service.status === 4) {
      alert(`This request is already ${STATUS_MAP[service.status]}. Cannot delete.`);
      return;
    }
    this.serviceToDelete = service;
    this.toggleDeleteModal(true);
  }

  confirmDelete(): void {
    if (!this.serviceToDelete) return;
    
    const id = this.serviceToDelete.serviceRequestId;
    
    this.apiService.deleteServiceRequest(id).subscribe({
      next: () => { 
        alert('Service request deleted successfully!');
        // Remove from list immediately
        this.removeServiceFromList(id);
        this.toggleDeleteModal(false);
        this.serviceToDelete = null;
      },
      error: (err) => { 
        alert('Failed to delete request: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  // Helper method to remove service from list without refresh
  private removeServiceFromList(serviceId: string): void {
    this.rowData = this.rowData.filter(item => 
      (item.serviceRequestId) !== serviceId
    );
  }

  viewServiceRequest(request: any): void {
    this.selectedRequest = request;
    this.toggleViewModal(true);
  }

  editServiceRequest(request: any): void {
    // Check if request can be edited
    if (request.status === 3 || request.status === 4) {
      alert(`This request is already ${STATUS_MAP[request.status]}. Cannot edit.`);
      return;
    }
    
    this.selectedRequest = request;
    this.populateEditForm(request);
    this.toggleEditModal(true);
  }

  // ============ DATA ============

  listRequestedServices(): void {
    const userId = this.authService.decodeToken()?.UserId;
    if (!userId) { alert('Login First'); return; }

    this.apiService.getAllService(userId).subscribe({
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
    if (!this.requestForm.valid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.decodeToken()?.UserId;
    if (!userId) { 
      alert('Session expired. Please login again.'); 
      this.router.navigate(['/login']); 
      return; 
    }

    const payload = { ...this.cleanNulls(this.requestForm.value), UserId: userId };

    this.apiService.requestService(payload).subscribe({
      next: (res) => {
        // Add new service to list immediately
        const newService = {
          ...payload,
          serviceRequestId: res.serviceRequestId || res.id,
          applicationNumber: res.applicationNumber || res.reference,
          createdAt: new Date().toISOString(),
          status: 1 // Pending
        };
        this.rowData = [newService, ...this.rowData];
        
        this.isModalOpen = false;
        this.resetFormToDefaults();
        alert('Service Request Submitted Successfully! Ref: ' + (res.reference || res.applicationNumber));
      },
      error: (err) => { 
        alert('Failed to submit request: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  onUpdateSubmit(): void {
    if (!this.editRequestForm.valid) {
      this.editRequestForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.decodeToken()?.UserId;
    if (!userId) { 
      alert('Session expired. Please login again.'); 
      this.router.navigate(['/login']); 
      return; 
    }

    const formValue = { ...this.editRequestForm.value };
    const serviceRequestId = formValue.serviceRequestId;
    const payload = { ...this.cleanNulls(formValue), userId };

    this.apiService.updateServiceRequest(serviceRequestId, payload).subscribe({
      next: (updatedService) => {
        // Update service in list immediately
        this.updateServiceInList(serviceRequestId, payload);
        this.toggleEditModal(false);
        alert('Service Request Updated Successfully!');
      },
      error: (err) => { 
        alert('Failed to update request: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  // Helper method to update service in list without refresh
  private updateServiceInList(serviceId: string, updatedData: any): void {
    this.rowData = this.rowData.map(item => {
      if (item.serviceRequestId === serviceId) {
        return { ...item, ...updatedData };
      }
      return item;
    });
  }

  // ============ HELPERS ============

  getServiceTypeName(type: number): string { 
    return SERVICE_TYPE[type] || 'Unknown'; 
  }
  
  getStatusName(status: number): string { 
    return STATUS_MAP[status] || 'Unknown'; 
  }
  
  getPriorityName(priority: number): string { 
    return PRIORITY_LEVELS[priority] ?? 'Unknown'; 
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  private cleanNulls(obj: any): any {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(k => { 
      if (cleaned[k] === '') cleaned[k] = null; 
    });
    return cleaned;
  }

  private resetFormToDefaults(): void {
    this.requestForm.reset({
      ServiceType: '', 
      PriorityLevel: '0', 
      SubmissionMode: 'Online',
      MigrationType: 'Incoming', 
      TotalFamilyMembersMoving: 1,
    });
  }

  populateEditForm(request: any): void {
    this.editRequestForm.patchValue({
      serviceRequestId: request.serviceRequestId,
      purpose: request.purpose,
      description: request.description,
      requestedWard: request.requestedWard,
      requestedMunicipality: request.requestedMunicipality,
      priorityLevel: request.priorityLevel?.toString() || '0',
      childFullName: request.childFullName,
      dateOfBirth: this.formatDateForInput(request.dateOfBirth),
      gender: request.gender,
      placeOfBirth: request.placeOfBirth,
      fatherFullName: request.fatherFullName,
      motherFullName: request.motherFullName,
      grandfatherFullName: request.grandfatherFullName,
      deceasedFullName: request.deceasedFullName,
      dateOfDeath: this.formatDateForInput(request.dateOfDeath),
      placeOfDeath: request.placeOfDeath,
      causeOfDeath: request.causeOfDeath,
      relationshipToApplicant: request.relationshipToApplicant,
      citizenshipNoOfDeceased: request.citizenshipNoOfDeceased,
      letterCategory: request.letterCategory,
      recipientOrganization: request.recipientOrganization,
      plotNumber: request.plotNumber,
      sheetNumber: request.sheetNumber,
      totalArea: request.totalArea,
      propertyType: request.propertyType,
      currentOwnerName: request.currentOwnerName,
      landRevenueReceiptNumber: request.landRevenueReceiptNumber,
      groomFullName: request.groomFullName,
      brideFullName: request.brideFullName,
      marriageDate: this.formatDateForInput(request.marriageDate),
      marriageVenue: request.marriageVenue,
      groomCitizenshipNo: request.groomCitizenshipNo,
      brideCitizenshipNo: request.brideCitizenshipNo,
      migrationType: request.migrationType || 'Incoming',
      originAddress: request.originAddress,
      destinationAddress: request.destinationAddress,
      totalFamilyMembersMoving: request.totalFamilyMembersMoving || 1,
      reasonForMigration: request.reasonForMigration,
      houseNumber: request.houseNumber,
      streetName: request.streetName,
      yearsOfStay: request.yearsOfStay,
    });
  }
}