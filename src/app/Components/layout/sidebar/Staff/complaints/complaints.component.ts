import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ImageCellRendererComponent } from '../../../../shared/image-cell/image-cell.component';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-complaints',
  imports: [CommonModule, AgGridAngular],
  templateUrl: './complaints.component.html',
  styleUrl: './complaints.component.css'
})
export class ComplaintsComponent implements OnInit, AfterViewInit {
  
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  selectedComplaint: any = null;
  selectedStatus: string = '';
  context: any;
  
  // Map properties
  private map: any = null;
  private routingControl: any = null;
  currentLocation: { lat: number, lng: number } | null = null;
  private leafletLoaded = false;

  columnDefs: ColDef[] = [
    { 
      field: 'category', 
      headerName: 'Category', 
      filter: true,
      flex: 1 
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      editable: true,
      cellClassRules: {
        'text-danger': "x === 'Pending'",
        'text-warning': "x === 'In Progress'",
        'text-info': "x === 'Approved'",
        'text-success': "x === 'Resolved'"
      },
      cellEditorParams: {
        values: ["Pending", "Approved", "In Review", "Resolved"]
      },
      cellEditor: 'agSelectCellEditor',
      onCellValueChanged: (params: any) => {
        const newStatus = params.newValue;
        const complaintId = params.data.complaintId;

        if (newStatus !== params.oldValue) {
          params.context.componentParent.updateStatus(complaintId, newStatus, params);
        }
      }
    },
    {
      headerName: 'Image',
      field: 'imageUrl',
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
    { field: 'latitude', headerName: 'Latitude', width: 100 }, 
    { field: 'longitude', headerName: 'Longitude', width: 100 },
    { field: 'complaintDetails', headerName: 'Details', flex: 2, tooltipField: 'complaintDetails' },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const hasLocation = params.data.latitude && params.data.longitude;
        
        return `
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" title="Change Status">
              <i class="bi bi-pencil"></i> Change Status
            </button>
            ${hasLocation ? 
              `<button class="btn btn-sm btn-outline-success me-1" data-action="navigate" title="Navigate to Location">
                <i class="bi bi-geo-alt-fill"></i> Navigate
              </button>` : 
              `<button class="btn btn-sm btn-outline-secondary me-1" disabled title="No Location Available">
                <i class="bi bi-geo-alt"></i> No Location
              </button>`
            }
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const action = params.event.target.getAttribute('data-action') || 
                       params.event.target.parentElement?.getAttribute('data-action') ||
                       params.event.target.parentElement?.parentElement?.getAttribute('data-action');
        
        if (action === 'edit') {
          setTimeout(() => {
            params.api.startEditingCell({
              rowIndex: params.node.rowIndex,
              colKey: 'status'
            });
          });
        } else if (action === 'navigate') {
          this.navigateToComplaint(params.data);
        }
      },
      width: 250,
      cellStyle: { 'text-align': 'center' }
    }
  ];

  constructor(
    private authService: AuthService, 
    private apiService: ApiService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.context = { componentParent: this };
    this.listAllComplaints();
    
    if (this.isBrowser) {
      this.getCurrentLocation();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Wait for DOM to be fully ready
      setTimeout(() => {
        if (this.mapContainer && this.mapContainer.nativeElement) {
          this.loadLeafletAndInitialize();
        }
      }, 1000);
    }
  }

  private async loadLeafletAndInitialize() {
    if (this.leafletLoaded || !this.mapContainer?.nativeElement) return;
    
    try {
      // Check if Leaflet is already loaded
      if (!(window as any).L) {
        await this.loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      }
      
      // Check if routing machine is loaded
      if (!(window as any).L?.Routing) {
        await this.loadScript('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js');
      }
      
      // Wait a bit for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const L = (window as any).L;
      
      if (!L) {
        throw new Error('Leaflet failed to load');
      }
      
      this.leafletLoaded = true;
      this.initializeMapWithL(L);
      
    } catch (error) {
      console.error('Failed to load Leaflet:', error);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
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

  private initializeMapWithL(L: any) {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    // Fix for Leaflet marker icons
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Initialize map
    const defaultLocation = this.currentLocation || { lat: 27.7172, lng: 85.3240 };
    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLocation.lat, defaultLocation.lng], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    
    // Store L reference
    (this as any).L = L;
    
    console.log('Map initialized successfully');
  }

  getCurrentLocation() {
    if (!this.isBrowser) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (this.map && this.currentLocation) {
            this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 13);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.currentLocation = { lat: 27.7172, lng: 85.3240 };
        }
      );
    } else {
      this.currentLocation = { lat: 27.7172, lng: 85.3240 };
    }
  }

  navigateToComplaint(complaint: any) {
    if (!this.isBrowser) return;
    
    if (!complaint.latitude || !complaint.longitude) {
      alert('No location coordinates available for this complaint');
      return;
    }

    if (!this.map) {
      this.loadLeafletAndInitialize().then(() => {
        this.showRouteToComplaint(complaint);
      });
    } else {
      this.showRouteToComplaint(complaint);
    }
  }

  private showRouteToComplaint(complaint: any) {
    const L = (this as any).L;
    if (!L || !this.map) {
      alert('Map is not ready. Please try again.');
      return;
    }
    
    const startPoint = this.currentLocation;
    
    if (!startPoint) {
      alert('Unable to get your current location. Please enable location services.');
      return;
    }

    const startLatLng = L.latLng(startPoint.lat, startPoint.lng);
    const endLatLng = L.latLng(complaint.latitude, complaint.longitude);

    // Clear existing routing control
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    // Fit map bounds to show both points
    const bounds = L.latLngBounds([startLatLng, endLatLng]);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    // Clear existing markers
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Add markers
    L.marker(startLatLng).addTo(this.map)
      .bindPopup('📍 Your Location')
      .openPopup();
    
    L.marker(endLatLng).addTo(this.map)
      .bindPopup(`
        <div style="min-width: 150px;">
          <b>${complaint.category}</b><br>
          ${complaint.complaintDetails?.substring(0, 100) || ''}<br>
          <b>Status:</b> ${complaint.status}<br>
          <b>Ward:</b> ${complaint.wardNumber}
        </div>
      `);

    // Add routing control
    this.routingControl = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: '#3388ff', weight: 4, opacity: 0.8 }]
      },
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true
    }).addTo(this.map);

    // Get route information
    this.routingControl.on('routesfound', (e: any) => {
      const route = e.routes[0];
      if (route && route.summary) {
        const distance = (route.summary.totalDistance / 1000).toFixed(2);
        const time = (route.summary.totalTime / 60).toFixed(0);
        
        L.popup()
          .setLatLng(startLatLng)
          .setContent(`
            <div class="route-info">
              <strong>🚗 Route Information</strong><br>
              Distance: ${distance} km<br>
              Estimated Time: ${time} minutes
            </div>
          `)
          .openOn(this.map);
      }
    });
  }

  clearRoute() {
    if (!this.isBrowser || !this.map) return;
    
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
    
    if (this.currentLocation) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 13);
    }
  }

  listAllComplaints() {
  // Only fetch in browser
  if (!this.isBrowser) return;
  
  const UserId = this.authService.decodeToken()?.UserId;
  if (UserId == null) {
    alert("Login First");
  } else {
    this.apiService.getAllComplaints().subscribe(
      res => {
        this.rowData = res;
        console.log(res);
      },
      err => {
        console.log(err);
        // Don't show alert for SSR errors
        if (this.isBrowser) {
          console.log('Failed to load complaints');
        }
      }
    );
  }
}

  updateStatus(complaintId: number, newStatus: string, params: any) {
    const payload = {
      id: complaintId,
      status: newStatus,
    };
    console.log("Payload sent to API:", payload);
    this.apiService.updateComplaintStatus(payload).subscribe(
      res => {
        alert("✅ Status Updated Successfully");
        this.listAllComplaints();
      },
      err => {
        console.log(err);
        alert("❌ Failed to update status");
      }
    );
  }

  onGridReady(params: any) {
    params.api.sizeColumnsToFit();
  }
}