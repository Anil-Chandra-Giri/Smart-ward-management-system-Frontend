import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { ImageCellRendererComponent } from '../../../../shared/image-cell/image-cell.component';

@Component({
  selector: 'app-submit-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './submit-complaint.component.html',
  styleUrls: ['./submit-complaint.component.css']
})
export class SubmitComplaintComponent implements OnInit, AfterViewInit {

  @ViewChild('complaintModal') modalElement!: ElementRef;
  UserId: any;
  complaintForm!: FormGroup;
  editComplaintForm!: FormGroup;
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  imagePreview: string | null = null;
  editImagePreview: string | null = null;
  selectedImage: File | null = null;
  editSelectedImage: File | null = null;

  // Modal states
  isModalOpen = false;
  isViewModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  selectedComplaint: any = null;
  complaintToDelete: any = null;

  // Leaflet properties
  private map: any = null;
  private marker: any = null;
  center: { lat: number, lng: number } = { lat: 27.7172, lng: 85.3240 };
  zoom = 13;
  private leafletLoaded = false;
  private L: any = null;

  columnDefs: ColDef[] = [
    { 
      field: 'complaintId', 
      headerName: 'ID', 
      width: 100, 
      pinned: 'left',
      cellStyle: { fontWeight: 'bold' } 
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      filter: true,
      flex: 1 
    },
    { field: 'wardNumber', headerName: 'Ward', width: 90, filter: 'agNumberColumnFilter' },
    { field: 'municipality', headerName: 'Municipality', flex: 1 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      cellClassRules: {
        'text-danger': "x === 'Pending'",
        'text-warning': "x === 'In Progress'",
        'text-success': "x === 'Resolved'"
      }
    },
    {
      headerName:'Image',
      field:'imageUrl',
      cellRenderer: ImageCellRendererComponent,
      width: 130
    },
    { field: 'priority', headerName: 'Priority', width: 110 },
    { 
      field: 'createdAt', 
      headerName: 'Submitted On', 
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString() 
    },
    { field: 'latitude', headerName: 'Lat', width: 100, hide: true }, 
    { field: 'longitude', headerName: 'Lng', width: 100, hide: true },
    { field: 'complaintDetails', headerName: 'Details', flex: 2, tooltipField: 'complaintDetails' },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const isDisabled = status === 'Resolved' || status === 'Closed';
        
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-outline-info" data-action="view" data-id="${params.data.complaintId}" style="padding: 2px 12px; font-size: 12px;">
              View
            </button>
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${params.data.complaintId}" style="padding: 2px 12px; font-size: 12px;"
                    ${isDisabled ? 'disabled title="Cannot edit ' + status + ' complaint"' : ''}>
              Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${params.data.complaintId}" style="padding: 2px 12px; font-size: 12px;">
              Delete
            </button>
          </div>
        `;
      },
      onCellClicked: (p: any) => {
        const target = p.event.target;
        const action = target.getAttribute('data-action') 
          || target.parentElement?.getAttribute('data-action');
        const complaintId = target.getAttribute('data-id') 
          || target.parentElement?.getAttribute('data-id');
        
        // Find the complaint in rowData
        const complaint = this.rowData.find(item => item.complaintId === complaintId);
        if (!complaint) return;
        
        if (action === 'view') {
          this.viewComplaint(complaint);
        } else if (action === 'edit') {
          if (!target.disabled) {
            this.editComplaint(complaint);
          }
        } else if (action === 'delete') {
          this.openDeleteModal(complaint);
        }
      },
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      const decodedToken = this.authService.decodeToken();
      if (decodedToken) {
        this.UserId = decodedToken.UserId;
        this.getComplaints();
      }
    }

    this.initComplaintForm();
    this.initEditForm();
  }

  // ============ FORMS ============

  initComplaintForm(): void {
    this.complaintForm = this.fb.group({
      category: ['Waste Management', Validators.required],
      complaintDetails: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['Normal', Validators.required],
      wardNumber: ['', Validators.required],
      municipality: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      complaintImage: [null],
    });
  }

  initEditForm(): void {
    this.editComplaintForm = this.fb.group({
      complaintId: [''],
      category: ['', Validators.required],
      complaintDetails: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['', Validators.required],
      wardNumber: ['', Validators.required],
      municipality: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      status: [''],
    });
  }

  // ============ FILE HANDLING ============

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreview = null;
    }
  }

  onEditFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.editSelectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.editImagePreview = null;
    }
  }

  // ============ MODAL HELPERS ============

  toggleModal(show: boolean): void {
    this.isModalOpen = show;
    if (!show) {
      this.resetFormToDefaults();
      this.imagePreview = null;
      this.selectedImage = null;
    }
  }

  toggleViewModal(show: boolean): void {
    this.isViewModalOpen = show;
    if (!show) this.selectedComplaint = null;
  }

  toggleEditModal(show: boolean): void {
    this.isEditModalOpen = show;
    if (!show) { 
      this.selectedComplaint = null; 
      this.editComplaintForm.reset();
      this.editImagePreview = null;
      this.editSelectedImage = null;
    }
  }

  toggleDeleteModal(show: boolean): void {
    this.isDeleteModalOpen = show;
    if (!show) {
      this.complaintToDelete = null;
    }
  }

  openDeleteModal(complaint: any): void {
    // Security check: Only allow deletion of own complaints
    if (complaint.userId !== this.UserId) {
      alert('You are not authorized to delete this complaint.');
      return;
    }
    
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
      alert(`This complaint is already ${complaint.status}. Cannot delete.`);
      return;
    }
    this.complaintToDelete = complaint;
    this.toggleDeleteModal(true);
  }

  confirmDelete(): void {
    if (!this.complaintToDelete) return;
    
    // Security check: Only allow deletion of own complaints
    if (this.complaintToDelete.userId !== this.UserId) {
      alert('You are not authorized to delete this complaint.');
      this.toggleDeleteModal(false);
      return;
    }
    
    const id = this.complaintToDelete.complaintId;
    
    this.apiService.deleteComplaint(id).subscribe({
      next: () => { 
        alert('Complaint deleted successfully!');
        this.removeComplaintFromList(id);
        this.toggleDeleteModal(false);
        this.complaintToDelete = null;
      },
      error: (err) => { 
        alert('Failed to delete complaint: ' + (err.error?.message || 'Server Error')); 
      },
    });
  }

  private removeComplaintFromList(complaintId: string): void {
    this.rowData = this.rowData.filter(item => 
      (item.complaintId) !== complaintId
    );
  }

  viewComplaint(complaint: any): void {
    this.selectedComplaint = complaint;
    this.toggleViewModal(true);
  }

  editComplaint(complaint: any): void {
    // Security check: Only allow editing of own complaints
    if (complaint.userId !== this.UserId) {
      alert('You are not authorized to edit this complaint.');
      return;
    }
    
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
      alert(`This complaint is already ${complaint.status}. Cannot edit.`);
      return;
    }
    
    this.selectedComplaint = complaint;
    this.populateEditForm(complaint);
    this.toggleEditModal(true);
  }

  // ============ MAP FUNCTIONS ============

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      if (this.modalElement) {
        this.modalElement.nativeElement.addEventListener('shown.bs.modal', () => {
          this.loadLeafletAndInitialize();
        });
      } else {
        setTimeout(() => this.loadLeafletAndInitialize(), 500);
      }
    }
  }

  private async loadLeafletAndInitialize() {
    if (this.leafletLoaded || !this.isBrowser) return;
    
    try {
      if (!(window as any).L) {
        await this.loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.L = (window as any).L;
      
      if (!this.L) {
        throw new Error('Leaflet failed to load');
      }
      
      this.leafletLoaded = true;
      this.initializeMap();
      
    } catch (error) {
      console.error('Failed to load Leaflet:', error);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  initializeMap() {
    if (!this.L || !this.isBrowser) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    const iconDefault = this.L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    this.L.Marker.prototype.options.icon = iconDefault;

    this.map = this.L.map('map').setView([this.center.lat, this.center.lng], this.zoom);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = this.L.marker([this.center.lat, this.center.lng], { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateLatLng(pos.lat, pos.lng);
    });

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.updateLatLng(lat, lng);
    });

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }

  locateUser() {
    if (!this.map || !this.L) {
      this.loadLeafletAndInitialize().then(() => {
        setTimeout(() => this.locateUser(), 500);
      });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 16);
          this.marker.setLatLng([latitude, longitude]);
          this.updateLatLng(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Location access denied. Please enable GPS or select location on map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  private updateLatLng(lat: number, lng: number) {
    this.complaintForm.patchValue({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  }

  // ============ DATA OPERATIONS ============

  submitComplaint() {
    if (!this.isBrowser) return;
    
    if (this.complaintForm.valid) {
      if (!this.selectedImage) {
        alert("Please select an image");
        return; 
      }
      
      const formData = new FormData();
      const formValues = this.complaintForm.value;
      Object.keys(formValues).forEach(key => {
        const value = formValues[key] === '' ? null : formValues[key];
        if (value !== null) {
          formData.append(key, value);
        }
      });

      formData.append('complaintImage', this.selectedImage, this.selectedImage.name);
      formData.append('UserId', this.UserId);

      this.apiService.submitComplaint(formData)
        .subscribe({
          next: (res) => {
            // Add new complaint to list immediately
            const newComplaint = {
              ...formValues,
              complaintId: res.complaintId || res.id,
              userId: this.UserId, // Add userId for security
              createdAt: new Date().toISOString(),
              status: 'Pending',
              imageUrl: res.imageUrl || ''
            };
            this.rowData = [newComplaint, ...this.rowData];
            
            this.toggleModal(false);
            this.resetFormToDefaults();
            this.imagePreview = null;
            this.selectedImage = null;
            if (this.marker && this.center) {
              this.marker.setLatLng([this.center.lat, this.center.lng]);
            }
            alert('Complaint Submitted Successfully');
          },
          error: (err) => {
            console.error('Submission Failed', err);
            alert(`Submission failed: ${err.message || 'Unknown error'}`);
          }
        });
    } else {
      alert('Please fill in all required fields.');
    }
  }

  onUpdateSubmit(): void {
    if (!this.editComplaintForm.valid) {
      this.editComplaintForm.markAllAsTouched();
      return;
    }

    const formValue = this.editComplaintForm.value;
    const complaintId = formValue.complaintId;
    
    // Create payload with explicit property mapping
    const payload: {
      category: string;
      complaintDetails: string;
      priority: string;
      wardNumber: number;
      municipality: string;
      latitude: string;
      longitude: string;
      status: string;
    } = {
      category: formValue.category,
      complaintDetails: formValue.complaintDetails,
      priority: formValue.priority,
      wardNumber: parseInt(formValue.wardNumber) || 0,
      municipality: formValue.municipality,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      status: formValue.status || 'Pending'
    };

    // If there's a new image, handle it
    if (this.editSelectedImage) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        const value = (payload as any)[key];
        if (value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });
      formData.append('complaintImage', this.editSelectedImage, this.editSelectedImage.name);
      
      this.apiService.updateComplaintWithImage(complaintId, formData).subscribe({
        next: () => {
          this.updateComplaintInList(complaintId, payload);
          this.toggleEditModal(false);
          this.editImagePreview = null;
          this.editSelectedImage = null;
          alert('Complaint updated successfully!');
        },
        error: (err) => { 
          alert('Failed to update complaint: ' + (err.error?.message || 'Server Error')); 
        },
      });
    } else {
      this.apiService.updateComplaint(complaintId, payload).subscribe({
        next: () => {
          this.updateComplaintInList(complaintId, payload);
          this.toggleEditModal(false);
          alert('Complaint updated successfully!');
        },
        error: (err) => { 
          alert('Failed to update complaint: ' + (err.error?.message || 'Server Error')); 
        },
      });
    }
  }

  private updateComplaintInList(complaintId: string, updatedData: any): void {
    this.rowData = this.rowData.map(item => {
      if (item.complaintId === complaintId) {
        return { ...item, ...updatedData };
      }
      return item;
    });
  }

  getComplaints() {
    if (!this.isBrowser || !this.UserId) return;
    
    this.apiService.getComplaints(this.UserId).subscribe({
      next: (res) => {
        this.rowData = res || [];
        console.log(res);
      },
      error: (err) => {
        console.error('Error fetching complaints:', err);
        if (err.status === 404) {
          this.rowData = [];
        }
      }
    });
  }

  // ============ HELPERS ============

  private resetFormToDefaults(): void {
    this.complaintForm.reset({
      category: 'Waste Management',
      priority: 'Normal',
      latitude: '',
      longitude: ''
    });
  }

  populateEditForm(complaint: any): void {
    this.editComplaintForm.patchValue({
      complaintId: complaint.complaintId,
      category: complaint.category,
      complaintDetails: complaint.complaintDetails,
      priority: complaint.priority,
      wardNumber: complaint.wardNumber,
      municipality: complaint.municipality,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      status: complaint.status || 'Pending'
    });
  }

  imageRenderer(params: any) {
    if (!params.value) return '';
    const imageUrl = `https://localhost:7069${params.value}`;
    return `
      <img 
        src="${imageUrl}" 
        style="
          width:200px;
          height:200px;
          object-fit:cover;
          border-radius:8px;
          cursor:pointer;
        "
      />
    `;
  }

  frameworkComponents = {
    imageCell: ImageCellRendererComponent
  };
}