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
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  imagePreview: string | null = null;
  selectedImage: File | null = null;

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
    { field: 'complaintDetails', headerName: 'Details', flex: 2, tooltipField: 'complaintDetails' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Check if we're in browser
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Only decode token and get complaints in browser
    if (this.isBrowser) {
      const decodedToken = this.authService.decodeToken();
      if (decodedToken) {
        this.UserId = decodedToken.UserId;
        this.getComplaints();
      }
    }

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

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Wait for modal to be shown before initializing map
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
            this.getComplaints();
            this.complaintForm.reset();
            this.selectedImage = null;
            this.imagePreview = null;
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

  getComplaints() {
    // Only fetch complaints in browser and if UserId exists
    if (!this.isBrowser || !this.UserId) return;
    
    this.apiService.getComplaints(this.UserId).subscribe({
      next: (res) => {
        this.rowData = res;
        console.log(res);
      },
      error: (err) => {
        console.error('Error fetching complaints:', err);
        // Don't show alert for SSR errors
        if (this.isBrowser) {
          console.log('Failed to load complaints');
        }
      }
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