import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';
import { ImageCellRendererComponent } from '../../../../shared/image-cell/image-cell.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-complaint-management',
  imports: [CommonModule, AgGridAngular],
  templateUrl: './complaint-management.component.html',
  styleUrl: './complaint-management.component.css'
})
export class ComplaintManagementComponent implements OnInit, AfterViewInit {
   // ✅ mapContainer now points to the div inside the modal
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  pageSize = 7;
  rowData: any[] = [];
  isBrowser = false;
  selectedComplaint: any = null;
  selectedStatus: string = '';
  context: any;

  // Route info shown in the modal header bar
  routeInfo: { distance: string; time: string; isRoadRoute: boolean } | null = null;

  // Map properties
  private map: any = null;
  private routingControl: any = null;
  currentLocation: { lat: number; lng: number } | null = null;
  private leafletLoaded = false;
  private scriptsLoaded = false;

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
        values: ['Pending', 'Approved', 'In Review', 'Resolved']
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
            ${hasLocation
              ? `<button class="btn btn-sm btn-outline-success me-1" data-action="navigate" title="Navigate to Location">
                   <i class="bi bi-geo-alt-fill"></i> Navigate
                 </button>`
              : `<button class="btn btn-sm btn-outline-secondary me-1" disabled title="No Location Available">
                   <i class="bi bi-geo-alt"></i> No Location
                 </button>`
            }
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const action =
          params.event.target.getAttribute('data-action') ||
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
    if (!this.isBrowser) return;

    // ✅ Pre-load Leaflet scripts in the background so they're ready when the
    //    modal opens — but do NOT init the map here (container has no size yet)
    this.preloadLeafletScripts();

    // ✅ Hook into Bootstrap's modal "shown" event so we initialize the map
    //    only after the modal is fully visible and the container has real pixel dimensions
    const modalEl = document.getElementById('mapModal');
    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', () => {
        // Invalidate map size every time modal opens (handles re-open edge case)
        if (this.map) {
          setTimeout(() => this.map.invalidateSize(), 100);
        } else {
          this.initializeMapInModal();
        }
      });

      // Clean up routing control when modal is closed
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.clearRoute();
      });
    }
  }

  // ─── Script Loading ────────────────────────────────────────────────────────

  private async preloadLeafletScripts(): Promise<void> {
    if (this.scriptsLoaded) return;

    try {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        await this.loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      }

      // Load Routing Machine CSS
      if (!document.querySelector('link[href*="leaflet-routing-machine"]')) {
        const rmCss = document.createElement('link');
        rmCss.rel = 'stylesheet';
        rmCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
        document.head.appendChild(rmCss);
      }

      // Load Routing Machine JS
      if (!(window as any).L?.Routing) {
        await this.loadScript(
          'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
        );
      }

      // Short settle delay
      await new Promise(resolve => setTimeout(resolve, 150));
      this.scriptsLoaded = true;

    } catch (error) {
      console.error('Failed to preload Leaflet scripts:', error);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(script);
    });
  }

  // ─── Map Initialization ────────────────────────────────────────────────────

  private async initializeMapInModal(): Promise<void> {
    if (this.leafletLoaded) return;

    // Ensure scripts are loaded first
    if (!this.scriptsLoaded) {
      await this.preloadLeafletScripts();
    }

    const L = (window as any).L;
    if (!L) {
      console.error('Leaflet not available');
      return;
    }

    // ✅ Get container by ID — more reliable than @ViewChild inside a modal
    const container = document.getElementById('mapContainer');
    if (!container) {
      console.error('Map container element not found in DOM');
      return;
    }

    // Fix default marker icon paths (broken in webpack builds)
    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41]
    });

    const defaultLocation = this.currentLocation || { lat: 27.7172, lng: 85.3240 };

    this.map = L.map(container).setView(
      [defaultLocation.lat, defaultLocation.lng],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Store L on instance for use in other methods
    (this as any).L = L;
    this.leafletLoaded = true;

    console.log('✅ Map initialized inside modal');
  }

  // ─── Location ──────────────────────────────────────────────────────────────

  getCurrentLocation() {
    if (!this.isBrowser) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Re-center map if already open
          if (this.map) {
            this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 13);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Default to Kathmandu
          this.currentLocation = { lat: 27.7172, lng: 85.3240 };
        }
      );
    } else {
      this.currentLocation = { lat: 27.7172, lng: 85.3240 };
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  navigateToComplaint(complaint: any) {
    if (!this.isBrowser) return;

    if (!complaint.latitude || !complaint.longitude) {
      alert('No location coordinates available for this complaint');
      return;
    }

    // Reset previous route info in the modal header
    this.routeInfo = null;

    const modalEl = document.getElementById('mapModal');
    if (!modalEl) {
      console.error('mapModal element not found. Make sure the modal HTML is in your template.');
      return;
    }

    const modal = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl);
    if (!modal) {
      console.error('Bootstrap Modal not available. Ensure Bootstrap JS is loaded.');
      return;
    }

    // ✅ Use { once: true } so this listener fires only for this one click,
    //    preventing stacked listeners on repeated Navigate clicks
    modalEl.addEventListener('shown.bs.modal', async () => {
      // Map may not be initialized yet on first open
      if (!this.map) {
        await this.initializeMapInModal();
        // Extra tick so Leaflet finishes rendering before we draw the route
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Map already exists — just fix its size after the modal animation
        this.map.invalidateSize();
      }
      this.showRouteToComplaint(complaint);
    }, { once: true });

    modal.show();
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
    const endLatLng   = L.latLng(complaint.latitude, complaint.longitude);

    // ── Clear previous state ──────────────────────────────────────────────
    if (this.routingControl) {
      try { this.map.removeControl(this.routingControl); } catch (_) {}
      this.routingControl = null;
    }

    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        this.map.removeLayer(layer);
      }
    });

    // ── Add markers ───────────────────────────────────────────────────────
    L.marker(startLatLng)
      .addTo(this.map)
      .bindPopup('<b>📍 Your Location</b>')
      .openPopup();

    L.marker(endLatLng)
      .addTo(this.map)
      .bindPopup(`
        <div style="min-width:150px;">
          <b>${complaint.category}</b><br>
          ${complaint.complaintDetails?.substring(0, 100) || ''}<br>
          <b>Status:</b> ${complaint.status}<br>
          <b>Ward:</b> ${complaint.wardNumber}
        </div>
      `);

    // Fit both markers into view while route loads
    this.map.fitBounds(L.latLngBounds([startLatLng, endLatLng]), { padding: [50, 50] });

    // ── Road routing via OSRM ─────────────────────────────────────────────
    // ✅ Explicit OSRMv1 constructor guarantees road-based routing.
    //    Without this, some LRM builds silently skip OSRM and draw a straight line.
    this.routingControl = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      router: new L.Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'  // options: 'driving' | 'walking' | 'cycling'
      }),
      routeWhileDragging: false,
      showAlternatives:   false,
      lineOptions: {
        styles: [{ color: '#3388ff', weight: 5, opacity: 0.8 }],
        extendToWaypoints:     true,
        missingRouteTolerance: 0
      },
      createMarker:        () => null,  // We manage our own markers
      addWaypoints:        false,
      draggableWaypoints:  false,
      fitSelectedRoutes:   true,
      show:                false         // Hide the default turn-by-turn sidebar
    }).addTo(this.map);

    // ── Route found: show ROAD distance ──────────────────────────────────
    this.routingControl.on('routesfound', (e: any) => {
      const route = e.routes[0];
      if (!route?.summary) return;

      // totalDistance → metres; totalTime → seconds
      const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
      const timeMin    = Math.round(route.summary.totalTime / 60);
      const etaText    = timeMin < 60
        ? `${timeMin} min`
        : `${Math.floor(timeMin / 60)}h ${timeMin % 60}m`;

      // Populate the info bar in the modal header
      this.routeInfo = { distance: distanceKm, time: etaText, isRoadRoute: true };

      // Also show a popup on the map
      L.popup()
        .setLatLng(startLatLng)
        .setContent(`
          <div style="min-width:160px;">
            <strong>🛣️ Road Route</strong><br>
            Distance: <b>${distanceKm} km</b><br>
            Estimated Time: <b>${etaText}</b>
          </div>
        `)
        .openOn(this.map);
    });

    // ── Routing error: fall back to straight-line with clear warning ──────
    this.routingControl.on('routingerror', (e: any) => {
      console.warn('Road routing failed, using straight-line fallback:', e);

      const straightKm = this.haversineDistance(
        startPoint.lat, startPoint.lng,
        complaint.latitude, complaint.longitude
      ).toFixed(2);

      // Populate info bar with fallback values
      this.routeInfo = { distance: straightKm, time: '—', isRoadRoute: false };

      // Draw dashed red straight line
      L.polyline([startLatLng, endLatLng], {
        color:     '#ff6b6b',
        weight:    4,
        opacity:   0.7,
        dashArray: '10, 10'
      }).addTo(this.map);

      L.popup()
        .setLatLng(startLatLng)
        .setContent(`
          <div style="min-width:180px;">
            <strong>⚠️ Road route unavailable</strong><br>
            Straight-line distance: <b>${straightKm} km</b><br>
            <small style="color:#856404;">Actual road distance will be longer</small>
          </div>
        `)
        .openOn(this.map);
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Haversine formula — straight-line distance used only as fallback
  private haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R    = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a    =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  clearRoute() {
    if (!this.isBrowser || !this.map) return;

    if (this.routingControl) {
      try { this.map.removeControl(this.routingControl); } catch (_) {}
      this.routingControl = null;
    }

    this.routeInfo = null;

    if (this.currentLocation) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 13);
    }
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  listAllComplaints() {
    if (!this.isBrowser) return;

    const UserId = this.authService.decodeToken()?.UserId;
    if (UserId == null) {
      alert('Login First');
      return;
    }

    this.apiService.getAllComplaints().subscribe(
      (res) => { this.rowData = res; },
      (err) => { console.error('Failed to load complaints:', err); }
    );
  }

  updateStatus(complaintId: number, newStatus: string, params: any) {
    const payload = { id: complaintId, status: newStatus };
    this.apiService.updateComplaintStatus(payload).subscribe(
      () => {
        alert('✅ Status Updated Successfully');
        this.listAllComplaints();
      },
      (err) => {
        console.error(err);
        alert('❌ Failed to update status');
      }
    );
  }

  onGridReady(params: any) {
    params.api.sizeColumnsToFit();
  }
}
