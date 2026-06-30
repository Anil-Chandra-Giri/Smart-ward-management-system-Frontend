import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { Driver, Vehicle } from '../../Models/WasteCollectionRoute';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-route-planning',
  templateUrl: './route-planning.component.html',
  styleUrls: ['./route-planning.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
})
export class RoutePlanningComponent implements OnInit {
  routeForm: FormGroup;
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  
  wasteTypeOptions = [
    { name: 'General', value: 1 },
    { name: 'Recyclable', value: 2 },
    { name: 'Hazardous', value: 3 },
    { name: 'Biomedical', value: 4 },
    { name: 'Organic', value: 5 }
  ];
  
  selectedDate: Date = new Date();
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;
  minDate: string;

  // Role-based access
  isStaff: boolean = false;
  isAdmin: boolean = false;
  userRole: string = '';

  // Modal states
  isViewModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  selectedRoute: any = null;
  routeToDelete: any = null;

  // Real data from API
  routes: any[] = [];
  pageSize = 7;
  isBrowser = true;

  constructor(
    private fb: FormBuilder,
    private wasteCollectionService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.routeForm = this.createRouteForm();
    const today = new Date();
    this.minDate = today.toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    // Check user role and redirect if not staff/admin
    this.checkUserRole();
    
    if (this.isStaff || this.isAdmin) {
      this.loadAvailableResources();
      this.addCollectionPoint();
      this.loadRoutes(); // Load real data from API
    }
  }

  // ============ ROLE CHECK ============
  checkUserRole(): void {
    const decodedToken = this.authService.decodeToken();
    
    if (!decodedToken) {
      this.router.navigate(['/login']);
      return;
    }

    const role = decodedToken.Role || decodedToken.Role || '';
    this.userRole = role;
    this.isAdmin = role === 'Admin' || role === 'admin';
    this.isStaff = role === 'Staff' || role === 'staff' || role === 'Admin' || role === 'admin';

    if (!this.isStaff && !this.isAdmin) {
      this.router.navigate(['/citizen-dashboard']);
      this.error = 'Access Denied. Only staff members can manage waste collection routes.';
    }
  }

  createRouteForm(): FormGroup {
    return this.fb.group({
      routeName: ['', [Validators.required, Validators.minLength(3)]],
      wasteType: ['', Validators.required],
      scheduledDate: ['', Validators.required],
      assignedVehicleId: ['', Validators.required],
      assignedDriverId: ['', Validators.required],
      description: [''],
      collectionPoints: this.fb.array([])
    });
  }

  get collectionPoints() {
    return this.routeForm.get('collectionPoints') as FormArray;
  }

  addCollectionPoint() {
    const pointForm = this.fb.group({
      address: ['', Validators.required],
      latitude: [0],
      longitude: [0],
      notes: ['']
    });
    this.collectionPoints.push(pointForm);
  }

  removeCollectionPoint(index: number) {
    this.collectionPoints.removeAt(index);
  }

  loadAvailableResources() {
    this.wasteCollectionService.getAvailableVehicles(this.selectedDate)
      .subscribe({
        next: (vehicles) => this.vehicles = vehicles || [],
        error: (err) => console.error('Error loading vehicles:', err)
      });

    this.wasteCollectionService.getAvailableDrivers(this.selectedDate)
      .subscribe({
        next: (drivers) => this.drivers = drivers || [],
        error: (err) => console.error('Error loading drivers:', err)
      });
  }

  // ============ LOAD REAL ROUTES FROM API ============
  loadRoutes(): void {
    this.loading = true;
    this.error = null;
    
    // Replace with your actual API endpoint
    // For example: this.wasteCollectionService.getAllRoutes()
    this.wasteCollectionService.getWeeklySchedule(this.selectedDate)
      .subscribe({
        next: (response: any) => {
          // Check if response has routes
          if (response && response.routes) {
            this.routes = response.routes;
          } else if (Array.isArray(response)) {
            this.routes = response;
          } else {
            this.routes = [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading routes:', err);
          // If API returns 404 or error, set empty array
          if (err.status === 404) {
            this.routes = [];
          } else {
            this.error = 'Failed to load routes. Please try again.';
          }
          this.loading = false;
        }
      });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.selectedDate = new Date(input.value);
      this.loadAvailableResources();
      this.loadRoutes(); // Reload routes for new date
    }
  }

  onSubmit() {
    // Double-check role before submitting
    if (!this.isStaff && !this.isAdmin) {
      this.error = 'Access Denied. Only staff members can create routes.';
      return;
    }

    if (this.routeForm.valid) {
      const formValue = this.routeForm.value;

      const routeData = {
        routeName: formValue.routeName,
        wasteType: Number(formValue.wasteType),
        scheduledDate: formValue.scheduledDate,
        assignedVehicleId: formValue.assignedVehicleId,
        assignedDriverId: formValue.assignedDriverId,
        description: formValue.description || '',
        collectionPoints: formValue.collectionPoints.map((point: any, index: number) => ({
          address: point.address,
          latitude: Number(point.latitude) || 0,
          longitude: Number(point.longitude) || 0,
          sequenceOrder: index + 1,
          notes: point.notes || ''
        }))
      };

      this.loading = true;
      this.wasteCollectionService.createRoute(routeData)
        .subscribe({
          next: (response) => {
            this.success = 'Route created successfully!';
            this.loadRoutes(); // Refresh the list
            this.resetForm();
            this.loading = false;
            // Close modal
            const modal = document.getElementById('routeModal');
            if (modal) {
              const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
              if (bsModal) bsModal.hide();
            }
          },
          error: (error) => {
            console.error('Error creating route:', error);
            this.error = error.error?.message || 'Failed to create route';
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.routeForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  resetForm(): void {
    this.routeForm.reset();
    while (this.collectionPoints.length !== 0) {
      this.collectionPoints.removeAt(0);
    }
    this.addCollectionPoint();
    this.error = null;
    this.success = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.routeForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // ============ MODAL FUNCTIONS ============
  toggleViewModal(show: boolean): void {
    this.isViewModalOpen = show;
    if (!show) this.selectedRoute = null;
  }

  toggleEditModal(show: boolean): void {
    this.isEditModalOpen = show;
    if (!show) this.selectedRoute = null;
  }

  toggleDeleteModal(show: boolean): void {
    this.isDeleteModalOpen = show;
    if (!show) this.routeToDelete = null;
  }

  viewRoute(route: any): void {
    this.selectedRoute = route;
    this.toggleViewModal(true);
  }

  editRoute(route: any): void {
    if (!this.isStaff && !this.isAdmin) {
      this.error = 'Access Denied. Only staff members can edit routes.';
      return;
    }
    this.selectedRoute = route;
    this.toggleEditModal(true);
  }

  openDeleteModal(route: any): void {
    if (!this.isStaff && !this.isAdmin) {
      this.error = 'Access Denied. Only staff members can delete routes.';
      return;
    }
    this.routeToDelete = route;
    this.toggleDeleteModal(true);
  }

  confirmDelete(): void {
    if (!this.routeToDelete) return;
    
    // Replace with your actual delete API call
    this.wasteCollectionService.deleteRoute(this.routeToDelete.id)
      .subscribe({
        next: () => {
          this.success = 'Route deleted successfully!';
          this.loadRoutes(); // Refresh the list
          this.toggleDeleteModal(false);
          this.routeToDelete = null;
        },
        error: (err) => {
          console.error('Error deleting route:', err);
          this.error = 'Failed to delete route. Please try again.';
        }
      });
  }

  getStatusCount(status: string): number {
    return this.routes.filter(r => r.status === status).length;
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Scheduled': 'text-warning',
      'In Progress': 'text-info',
      'Completed': 'text-success',
      'Cancelled': 'text-danger'
    };
    return statusMap[status] || '';
  }

  getWasteTypeName(type: number): string {
    const found = this.wasteTypeOptions.find(t => t.value === type);
    return found ? found.name : 'Unknown';
  }
}