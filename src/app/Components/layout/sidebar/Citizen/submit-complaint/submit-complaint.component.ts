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

@Component({
  selector: 'app-submit-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './submit-complaint.component.html',
  styleUrls: ['./submit-complaint.component.css'],
  template: `
  <google-map
    height="400px"
    width="100%"
    [center]="center"
    [zoom]="zoom"
    (mapClick)="addMarker($event)">
    
    <map-marker *ngIf="markerPosition"
      [position]="markerPosition">
    </map-marker>

  </google-map>

  <p *ngIf="markerPosition">
    Selected: {{ markerPosition.lat }}, {{ markerPosition.lng }}
  </p>
`
})
export class SubmitComplaintComponent implements OnInit, AfterViewInit {

  @ViewChild('complaintModal') modalElement!: ElementRef;

  complaintForm!: FormGroup;
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  imagePreview: string | null = null;
  selectedImage: File | null = null;  

  private map: any;
  private marker: any;
  private L: any;

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

  { field: 'priority', headerName: 'Priority', width: 110 },
  { 
    field: 'submissionDate', 
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

  this.isBrowser = isPlatformBrowser(this.platformId);

  this.complaintForm = this.fb.group({
    citizenName: ['', Validators.required],
    contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
    category: ['Waste Management', Validators.required],
    complaintDetails: ['', [Validators.required, Validators.minLength(10)]],
    priority: ['Normal', Validators.required],
    wardNumber: ['', Validators.required],
    municipality: ['', Validators.required],
    latitude: ['', Validators.required],
    longitude: ['', Validators.required],
    complaintImage: [null] 
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
    if (isPlatformBrowser(this.platformId)) {
      this.modalElement.nativeElement.addEventListener(
        'shown.bs.modal',
        async () => {
          await this.initializeMap();
        }
      );
    }
  }

  async initializeMap() {
    this.L = await import('leaflet');

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

    this.map = this.L.map('map').setView([20.5937, 78.9629], 5);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = this.L.marker([20.5937, 78.9629], { draggable: false}).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateLatLng(pos.lat, pos.lng);
    });

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.updateLatLng(lat, lng);
    });

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  locateUser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 16);
          this.marker.setLatLng([latitude, longitude]);
          this.updateLatLng(latitude, longitude);
        },
        (error) => {
          alert('Location access denied. Please enable GPS.');
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

    if (this.complaintForm.valid) {
      const formData = new FormData();
      formData.append('citizenName', this.complaintForm.value.citizenName);
      formData.append('contactNumber', this.complaintForm.value.contactNumber);
      formData.append('category', this.complaintForm.value.category);
      formData.append('priority', this.complaintForm.value.priority);
      formData.append('complaintDetails', this.complaintForm.value.complaintDetails);
      formData.append('wardNumber', this.complaintForm.value.wardNumber);
      formData.append('municipality', this.complaintForm.value.municipality);
      formData.append('latitude', this.complaintForm.value.latitude);
      formData.append('longitude', this.complaintForm.value.longitude);

      // Append the file (if selected)
      if (this.selectedImage) {
        formData.append('complaintImage', this.selectedImage, this.selectedImage.name);
      }

       this.apiService.createUser(formData)
      .subscribe({
        next: (res) => {
          alert('Complaint Submitted');
          this.router.navigateByUrl('login');

        },
        error: (err) => console.error('Submittion Failed', err)
      });
    }
  }
}