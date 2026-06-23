// src/app/components/driver-route/driver-route.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-driver-route',
  templateUrl: './driver-route.component.html',
  styleUrls: ['./driver-route.component.css'],
  imports:[FormsModule,CommonModule,RouterModule]
})
export class DriverRouteComponent implements OnInit {
  routeId: string = '';
  routeDetails: any;
  currentPoint: any;
  allPoints: any[] = [];
  loading = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  
  // For delay form
  showDelayForm = false;
  delayReason = '';
  delayMinutes = 0;

  constructor(
    private driverService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.routeId = id;
      this.loadRouteDetails();
    } else {
      this.message = 'No route ID provided';
      this.messageType = 'error';
      this.router.navigate(['/driver/dashboard']);
    }
  }

  loadRouteDetails() {
    const driverId = localStorage.getItem('driverId');
    if (!driverId) {
      this.message = 'Driver not logged in';
      this.messageType = 'error';
      return;
    }

    this.driverService.getAssignedRoutes(driverId).subscribe({
      next: (data: any[]) => {
        const route = data.find(r => r.id === this.routeId);
        if (route) {
          this.routeDetails = route;
          this.allPoints = route.collectionPoints || [];
          this.currentPoint = this.allPoints.find((p: any) => !p.actualCollectionTime);
        } else {
          this.message = 'Route not found';
          this.messageType = 'error';
        }
      },
      error: (error) => {
        console.error('Error loading route:', error);
        this.message = 'Failed to load route details';
        this.messageType = 'error';
      }
    });
  }

  startRoute() {
    if (!this.routeId) {
      this.message = 'Invalid route ID';
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.message = '';
    
    this.driverService.startRoute(this.routeId).subscribe({
      next: (response) => {
        this.message = 'Route started successfully';
        this.messageType = 'success';
        this.loadRouteDetails();
        this.loading = false;
        
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('Error starting route:', error);
        this.message = error.error?.message || 'Error starting route';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  completeCurrentPoint(wasteQuantityInput: string, notesInput: string) {
    if (!this.currentPoint) {
      this.message = 'No current point to complete';
      this.messageType = 'error';
      return;
    }

    const wasteQuantity = parseFloat(wasteQuantityInput);
    if (isNaN(wasteQuantity) || wasteQuantity <= 0) {
      this.message = 'Please enter a valid waste quantity';
      this.messageType = 'error';
      return;
    }

    const notes = notesInput || '';

    this.loading = true;
    this.message = '';
    
    this.driverService.completeCollectionPoint(
      this.currentPoint.id,
      wasteQuantity,
      notes
    ).subscribe({
      next: (response: any) => {
        if (response.routeCompleted) {
          this.message = 'Route completed successfully!';
          this.messageType = 'success';
          
          setTimeout(() => {
            this.router.navigate(['/driver/completed']);
          }, 2000);
        } else {
          this.message = 'Point completed. Next point ready.';
          this.messageType = 'success';
          
          if (response.nextPoint) {
            this.currentPoint = response.nextPoint;
          } else {
            this.loadRouteDetails();
          }
          
          setTimeout(() => this.message = '', 2000);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error completing point:', error);
        this.message = error.error?.message || 'Error completing collection point';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  reportDelay() {
    if (!this.routeId) {
      this.message = 'Invalid route ID';
      this.messageType = 'error';
      return;
    }

    if (!this.delayReason.trim()) {
      this.message = 'Please enter a delay reason';
      this.messageType = 'error';
      return;
    }

    if (this.delayMinutes <= 0) {
      this.message = 'Please enter valid delay minutes';
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.message = '';
    
    this.driverService.reportDelay(
      this.routeId, 
      this.delayReason, 
      this.delayMinutes
    ).subscribe({
      next: () => {
        this.message = 'Delay reported successfully';
        this.messageType = 'success';
        this.showDelayForm = false;
        this.delayReason = '';
        this.delayMinutes = 0;
        this.loadRouteDetails();
        this.loading = false;
        
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('Error reporting delay:', error);
        this.message = error.error?.message || 'Error reporting delay';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.allPoints || this.allPoints.length === 0) return 0;
    
    const completedPoints = this.allPoints.filter(p => p.actualCollectionTime).length;
    return Math.round((completedPoints / this.allPoints.length) * 100);
  }

  getCompletedPointsCount(): number {
    return this.allPoints?.filter(p => p.actualCollectionTime).length || 0;
  }

  getTotalPointsCount(): number {
    return this.allPoints?.length || 0;
  }

  getEstimatedTimeRemaining(): string {
    if (!this.routeDetails?.startTime || !this.routeDetails?.estimatedDuration) {
      return 'N/A';
    }

    const startTime = new Date(this.routeDetails.startTime);
    const elapsedMinutes = (Date.now() - startTime.getTime()) / 60000;
    const remainingMinutes = this.routeDetails.estimatedDuration - elapsedMinutes;

    if (remainingMinutes <= 0) return 'Overdue';
    if (remainingMinutes < 60) return `${Math.round(remainingMinutes)} min`;
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = Math.round(remainingMinutes % 60);
    return `${hours}h ${minutes}m`;
  }
}