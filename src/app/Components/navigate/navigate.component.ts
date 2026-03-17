// navigate.component.ts - Updated with proper distance measurement
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LeafletService } from '../../Services/leaflet.service';

@Component({
  selector: 'app-navigate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="navigation-container">
      <!-- Header with complaint info -->
      <div class="navigation-header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <div class="complaint-info">
          <h3>Complaint #{{ complaintId }}</h3>
          <span class="badge" [ngClass]="{
            'bg-warning': complaintCategory === 'Pending',
            'bg-info': complaintCategory === 'In Progress',
            'bg-success': complaintCategory === 'Resolved'
          }">{{ complaintCategory }}</span>
        </div>
      </div>

      <!-- Navigation info panel with proper distance display -->
      <div class="navigation-panel" *ngIf="distance !== null">
        <div class="stats">
          <div class="stat-item">
            <label>Distance</label>
            <span class="value">{{ formatDistance(distance) }}</span>
          </div>
          <div class="stat-item">
            <label>ETA</label>
            <span class="value">{{ eta }}</span>
          </div>
          <div class="stat-item">
            <label>Progress</label>
            <div class="progress-container">
              <div class="progress-bar" [style.width.%]="progress"></div>
            </div>
          </div>
        </div>
        
        <div class="destination-info">
          <i class="bi bi-geo-alt-fill text-danger"></i>
          <span>{{ destinationAddress }}</span>
        </div>
        
        <!-- Debug info - remove in production -->
        <div class="debug-info small text-muted mt-2" *ngIf="debugMode">
          <div>Route Status: {{ routeStatus }}</div>
          <div>Raw Distance: {{ rawDistance }} km</div>
          <div>Coordinates: {{ officerPosition?.lat?.toFixed(4) }}, {{ officerPosition?.lng?.toFixed(4) }}</div>
        </div>
      </div>

      <!-- Map container -->
      <div #mapContainer class="map-container"></div>

      <!-- Loading overlay -->
      <div class="loading-overlay" *ngIf="!mapInitialized">
        <div class="spinner"></div>
        <p>Initializing navigation...</p>
      </div>
      
      <!-- Fallback message if no route -->
      <div class="fallback-message" *ngIf="routeStatus === 'failed'">
        <i class="bi bi-exclamation-triangle"></i>
        Using straight-line distance. Live navigation may be limited.
      </div>
    </div>
  `,
  styles: [`
    .navigation-container {
      height: 100vh;
      width: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .navigation-header {
      background: white;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 1000;
    }

    .back-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: #f8f9fa;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-btn:hover {
      background: #e9ecef;
    }

    .complaint-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .complaint-info h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      color: white;
      font-size: 0.875rem;
    }

    .bg-warning { background: #ffc107; }
    .bg-info { background: #17a2b8; }
    .bg-success { background: #28a745; }

    .navigation-panel {
      background: white;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin: 1rem;
      border-radius: 10px;
      z-index: 1000;
      position: absolute;
      top: 70px;
      left: 20px;
      right: 20px;
      max-width: 400px;
    }

    .stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      flex: 1;
      text-align: center;
    }

    .stat-item label {
      display: block;
      font-size: 0.75rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .stat-item .value {
      font-size: 1.25rem;
      font-weight: bold;
      color: #007bff;
    }

    .progress-container {
      width: 100%;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #28a745;
      transition: width 0.3s ease;
    }

    .destination-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #dee2e6;
      font-size: 0.9rem;
      color: #495057;
    }

    .map-container {
      flex: 1;
      width: 100%;
      z-index: 1;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .fallback-message {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #fff3cd;
      color: #856404;
      padding: 0.5rem;
      border-radius: 5px;
      text-align: center;
      z-index: 1000;
      max-width: 400px;
      margin: 0 auto;
    }

    .debug-info {
      font-size: 0.8rem;
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 5px;
      border-left: 3px solid #007bff;
    }
  `]
})
export class NavigateComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  complaintId: number;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string = '';
  complaintCategory: string = '';
  
  private map: any;
  private officerMarker: any;
  private complaintMarker: any;
  private routeControl: any;
  private watchId: number | null = null;
  private L: any;
  private fallbackPolyline: any;
  
  // Distance and tracking properties
  distance: number | null = null;
  rawDistance: number = 0;
  eta: string = 'Calculating...';
  progress: number = 0;
  mapInitialized: boolean = false;
  routeStatus: string = 'pending'; // 'pending', 'success', 'failed'
  officerPosition: {lat: number, lng: number} | null = null;
  
  // Debug flag - set to false in production
  debugMode: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private leafletService: LeafletService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.complaintId = this.route.snapshot.params['id'];
    
    // Get query parameters
    const queryParams = this.route.snapshot.queryParams;
    this.destinationLat = parseFloat(queryParams['lat']);
    this.destinationLng = parseFloat(queryParams['lng']);
    this.destinationAddress = queryParams['address'] || 'Unknown location';
    this.complaintCategory = queryParams['category'] || 'Pending';
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.initializeMap();
    }
  }

  async initializeMap() {
    try {
      // Load Leaflet
      this.L = await this.leafletService.loadLeaflet();
      await this.leafletService.loadRoutingMachine();

      // Initialize map
      this.map = this.L.map(this.mapContainer.nativeElement).setView(
        [this.destinationLat, this.destinationLng], 
        13
      );

      // Add tile layer
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add complaint marker
      this.complaintMarker = this.L.marker(
        [this.destinationLat, this.destinationLng],
        {
          icon: this.L.divIcon({
            className: 'complaint-marker',
            html: '📍',
            iconSize: [30, 30]
          })
        }
      ).addTo(this.map)
       .bindPopup(`
         <b>Complaint #${this.complaintId}</b><br>
         Category: ${this.complaintCategory}<br>
         ${this.destinationAddress}
       `)
       .openPopup();

      this.mapInitialized = true;
      
      // Start tracking
      this.startTracking();

    } catch (error) {
      console.error('Error initializing map:', error);
      alert('Failed to initialize map. Please try again.');
    }
  }

  startTracking() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const officerPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.officerPosition = officerPos;
        this.updateOfficerPosition(officerPos);
      },
      (error) => {
        console.error('Error getting position:', error);
        this.routeStatus = 'failed';
        if (error.code === 1) {
          alert('Please enable location access to use navigation');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  updateOfficerPosition(position: {lat: number, lng: number}) {
    // Update or create officer marker
    if (this.officerMarker) {
      this.officerMarker.setLatLng([position.lat, position.lng]);
    } else {
      this.officerMarker = this.L.marker([position.lat, position.lng], {
        icon: this.L.divIcon({
          className: 'officer-marker',
          html: '🚓',
          iconSize: [30, 30]
        })
      }).addTo(this.map)
        .bindPopup('Your Current Position');
    }

    // Calculate straight-line distance immediately (fallback)
    const straightDistance = this.calculateDistance(
      position.lat, position.lng,
      this.destinationLat, this.destinationLng
    );
    this.rawDistance = straightDistance;
    this.distance = straightDistance;
    
    // Update ETA based on straight-line distance
    this.calculateETA(straightDistance);
    
    // Try to get actual route
    this.getRoute(position);
  }

  getRoute(origin: {lat: number, lng: number}) {
    // Remove old route if exists
    if (this.routeControl) {
      this.map.removeControl(this.routeControl);
    }
    
    // Remove fallback line if exists
    if (this.fallbackPolyline) {
      this.map.removeLayer(this.fallbackPolyline);
    }

    this.routeStatus = 'pending';
    this.eta = 'Calculating route...';

    try {
      // Create new route using OSRM
      this.routeControl = (this.L as any).Routing.control({
        waypoints: [
          this.L.latLng(origin.lat, origin.lng),
          this.L.latLng(this.destinationLat, this.destinationLng)
        ],
        router: (this.L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          timeout: 15000
        }),
        lineOptions: {
          styles: [
            {color: '#007bff', opacity: 0.7, weight: 6}
          ]
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true
      }).addTo(this.map);

      // Handle successful route
      this.routeControl.on('routesfound', (e: any) => {
        console.log('Routes found:', e);
        this.routeStatus = 'success';
        
        if (e.routes && e.routes.length > 0) {
          const route = e.routes[0];
          console.log('Route details:', route);
          
          // Get distance in meters and convert to km
          const distanceInMeters = route.summary.totalDistance;
          const distanceInKm = distanceInMeters / 1000;
          
          // Update distance with road route
          this.rawDistance = distanceInKm;
          this.distance = distanceInKm;
          
          // Calculate ETA based on road distance
          this.calculateETA(distanceInKm);
          
          // Calculate progress along route
          this.calculateProgress(route, origin);
        }
      });

      // Handle routing errors
      this.routeControl.on('routingerror', (e: any) => {
        console.error('Routing error:', e);
        this.routeStatus = 'failed';
        
        // Show fallback straight line
        this.drawFallbackRoute(origin, {
          lat: this.destinationLat,
          lng: this.destinationLng
        });
      });

    } catch (error) {
      console.error('Error creating route:', error);
      this.routeStatus = 'failed';
      this.drawFallbackRoute(origin, {
        lat: this.destinationLat,
        lng: this.destinationLng
      });
    }
  }

  drawFallbackRoute(origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) {
    // Draw straight line as fallback
    const latlngs = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ];
    
    this.fallbackPolyline = this.L.polyline(latlngs, {
      color: '#ff6b6b',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(this.map);
    
    // Add distance label
    const midPoint = {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2
    };
    
    this.L.marker([midPoint.lat, midPoint.lng], {
      icon: this.L.divIcon({
        className: 'distance-label',
        html: `<div style="background: white; padding: 2px 5px; border-radius: 3px; border: 1px solid #ccc; font-size: 12px;">
                ${this.formatDistance(this.distance)} (direct)
               </div>`,
        iconSize: [100, 20]
      })
    }).addTo(this.map);
    
    // We already have distance from straight-line calculation
    this.eta = this.eta + ' (direct)';
  }

  calculateETA(distanceInKm: number) {
    // Different speeds based on road type
    let speed = 30; // Default city speed in km/h
    
    // Adjust speed based on distance
    if (distanceInKm < 1) {
      speed = 15; // Walking speed for very short distances
    } else if (distanceInKm < 5) {
      speed = 25; // Slow city traffic
    } else if (distanceInKm < 20) {
      speed = 35; // Normal city driving
    } else {
      speed = 45; // Highway/suburban
    }
    
    const etaMinutes = (distanceInKm / speed) * 60;
    
    if (distanceInKm < 0.1) {
      this.eta = 'Less than 1 min';
    } else if (etaMinutes < 1) {
      this.eta = 'Less than 1 min';
    } else if (etaMinutes < 60) {
      this.eta = Math.round(etaMinutes) + ' min';
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const minutes = Math.round(etaMinutes % 60);
      this.eta = `${hours}h ${minutes}m`;
    }
  }

  calculateProgress(route: any, currentPos: {lat: number, lng: number}) {
    if (!route || !route.coordinates || route.coordinates.length === 0) {
      return;
    }
    
    // Find closest point on route to current position
    let minDistance = Infinity;
    let closestIndex = 0;
    
    route.coordinates.forEach((coord: any, index: number) => {
      const distance = this.calculateDistance(
        currentPos.lat, currentPos.lng,
        coord.lat, coord.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    // Calculate percentage of route completed
    this.progress = Math.round((closestIndex / route.coordinates.length) * 100);
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  formatDistance(distance: number | null): string {
    if (distance === null) return '--';
    
    if (distance < 1) {
      // Show in meters for short distances
      const meters = Math.round(distance * 1000);
      return `${meters} m`;
    } else if (distance < 10) {
      // Show with one decimal
      return `${distance.toFixed(1)} km`;
    } else {
      // Show rounded
      return `${Math.round(distance)} km`;
    }
  }

  goBack() {
    this.router.navigate(['/complaints']);
  }

  ngOnDestroy() {
    // Clean up geolocation watch
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    
    // Clean up map
    if (this.map) {
      this.map.remove();
    }
  }
}