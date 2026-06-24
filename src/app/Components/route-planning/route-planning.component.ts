// // src/app/components/route-planning/route-planning.component.ts

// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { ApiService } from '../../Services/api.service';
// import { Driver, Vehicle, WasteType } from '../../Models/WasteCollectionRoute';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-route-planning',
//   templateUrl: './route-planning.component.html',
//   styleUrls: ['./route-planning.component.css'],
//   imports:[CommonModule, ReactiveFormsModule,FormsModule]
// })
// export class RoutePlanningComponent implements OnInit {
//   routeForm: FormGroup;
//   vehicles: Vehicle[] = [];
//   drivers: Driver[] = [];
//   wasteTypes = Object.keys(WasteType).filter(key => isNaN(Number(key)));
//   selectedDate: Date = new Date();
//   loading: boolean = false;
//   error: string | null = null;
//   success: string | null = null;
//   minDate: string;


//   constructor(
//     private fb: FormBuilder,
//     private wasteCollectionService: ApiService
//   ) {
//     this.routeForm = this.createRouteForm();
//     const today = new Date();
//     this.minDate = today.toISOString().slice(0, 16);
//   }

//   ngOnInit(): void {
//     this.loadAvailableResources();
//     this.addCollectionPoint();
//   }

//   createRouteForm(): FormGroup {
//     return this.fb.group({
//       routeName: ['', [Validators.required, Validators.minLength(3)]],
//       wasteType: ['', Validators.required],
//       scheduledDate: ['', Validators.required],
//       assignedVehicleId: ['', Validators.required],
//       assignedDriverId: ['', Validators.required],
//       description: [''],
//       collectionPoints: this.fb.array([])
//     });
//   }

//   get collectionPoints() {
//     return this.routeForm.get('collectionPoints') as FormArray;
//   }

//   addCollectionPoint() {
//     const pointForm = this.fb.group({
//       address: ['', Validators.required],
//       latitude: [0],
//       longitude: [0],
//       sequenceOrder: [this.collectionPoints.length + 1]
//     });
//     this.collectionPoints.push(pointForm);
//   }

//   removeCollectionPoint(index: number) {
//     this.collectionPoints.removeAt(index);
//     // Update sequence orders
//     this.collectionPoints.controls.forEach((control, i) => {
//       control.get('sequenceOrder')?.setValue(i + 1);
//     });
//   }

//   loadAvailableResources() {
//     this.wasteCollectionService.getAvailableVehicles(this.selectedDate)
//       .subscribe(vehicles => this.vehicles = vehicles);

//     this.wasteCollectionService.getAvailableDrivers(this.selectedDate)
//       .subscribe(drivers => this.drivers = drivers);
//   }

//   onDateChange(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     if (input && input.value) {
//       this.selectedDate = new Date(input.value);
//       this.loadAvailableResources();
//     }
//   }


//    onSubmit() {
//   if (this.routeForm.valid) {
//     const formValue = this.routeForm.value;
    
//     // Format the data properly
//     const routeData = {
//       routeName: formValue.routeName,
//       wasteType: Number(formValue.wasteType), // Convert string to number
//       scheduledDate: new Date(formValue.scheduledDate).toISOString(),
//       assignedVehicleId: formValue.assignedVehicleId,
//       assignedDriverId: formValue.assignedDriverId,
//       description: formValue.description || '',
//       collectionPoints: formValue.collectionPoints.map((point: any, index: number) => ({
//         address: point.address,
//         latitude: Number(point.latitude) || 0,
//         longitude: Number(point.longitude) || 0,
//         sequenceOrder: index + 1,
//         notes: point.notes || ''
//       }))
//     };

//     console.log('Submitting route data:', routeData);

//     this.loading = true;
//     this.wasteCollectionService.createRoute(routeData)
//       .subscribe({
//         next: (response) => {
//           console.log('Route created successfully', response);
//           this.success = 'Route created successfully!';
//           this.resetForm();
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error creating route', error);
//           this.error = error.error?.errors 
//             ? JSON.stringify(error.error.errors) 
//             : (error.error?.message || 'Failed to create route');
//           this.loading = false;
//         }
//       });
//   } else {
//     this.markFormGroupTouched(this.routeForm);
//   }
// }

//    markFormGroupTouched(formGroup: FormGroup) {
//     Object.values(formGroup.controls).forEach(control => {
//       control.markAsTouched();
//       if (control instanceof FormGroup) {
//         this.markFormGroupTouched(control);
//       }
//     });
//   }

//    getWasteTypeName(type: string): string {
//     return type;
//   }

//   // Reset form
//   resetForm(): void {
//     this.routeForm.reset();
//     while (this.collectionPoints.length !== 0) {
//       this.collectionPoints.removeAt(0);
//     }
//     this.addCollectionPoint();
//     this.error = null;
//     this.success = null;
//   }

//   // Helper to check if form field is invalid
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.routeForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }
// }


// new start

// src/app/components/route-planning/route-planning.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { Driver, Vehicle, WasteType } from '../../Models/WasteCollectionRoute';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-route-planning',
  templateUrl: './route-planning.component.html',
  styleUrls: ['./route-planning.component.css'],
  imports:[CommonModule, ReactiveFormsModule,FormsModule, RouterModule]
})
export class RoutePlanningComponent implements OnInit {
  routeForm: FormGroup;
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  
  // Define waste type options with proper values
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

  constructor(
    private fb: FormBuilder,
    private wasteCollectionService: ApiService
  ) {
    this.routeForm = this.createRouteForm();
    const today = new Date();
    this.minDate = today.toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    this.loadAvailableResources();
    this.addCollectionPoint();
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
      .subscribe(vehicles => this.vehicles = vehicles);

    this.wasteCollectionService.getAvailableDrivers(this.selectedDate)
      .subscribe(drivers => this.drivers = drivers);
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.selectedDate = new Date(input.value);
      this.loadAvailableResources();
    }
  }

  onSubmit() {
    if (this.routeForm.valid) {
      const formValue = this.routeForm.value;

      // Ensure wasteType is sent as a number
      const routeData = {
        routeName: formValue.routeName,
        wasteType: Number(formValue.wasteType), // Convert to number
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

      console.log('Submitting route data:', JSON.stringify(routeData, null, 2));

      this.loading = true;
      this.wasteCollectionService.createRoute(routeData)
        .subscribe({
          next: (response) => {
            console.log('Route created successfully', response);
            this.success = 'Route created successfully!';
            this.resetForm();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating route', error);
            this.error = error.error?.errors 
              ? JSON.stringify(error.error.errors) 
              : (error.error?.message || 'Failed to create route');
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
}