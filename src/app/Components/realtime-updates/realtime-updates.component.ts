// src/app/components/realtime-updates/realtime-updates.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../Services/api.service';
import { CommonEngine } from '@angular/ssr/node';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-realtime-updates',
  templateUrl: './realtime-updates.component.html',
  styleUrls: ['./realtime-updates.component.css'],
  imports:[CommonModule]
})
export class RealtimeUpdatesComponent implements OnInit, OnDestroy {
  activeRoutes: any[] = [];
  private updateSubscription!: Subscription;

  constructor(private wasteCollectionService: ApiService) {}

  ngOnInit(): void {
    // Initial load
    this.loadRealtimeUpdates();

    // Poll for updates every 30 seconds
    this.updateSubscription = interval(30000)
      .pipe(
        switchMap(() => this.wasteCollectionService.getRealtimeUpdates())
      )
      .subscribe(updates => {
        this.activeRoutes = updates;
      });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  loadRealtimeUpdates(): void {
    this.wasteCollectionService.getRealtimeUpdates()
      .subscribe(updates => {
        this.activeRoutes = updates;
      });
  }

  getProgressPercentage(route: any): number {
    if (!route.collectionPoints || route.collectionPoints.length === 0) return 0;
    
    const completedPoints = route.collectionPoints.filter(
      (p: any) => p.actualCollectionTime
    ).length;
    
    return (completedPoints / route.collectionPoints.length) * 100;
  }

  getEstimatedCompletion(route: any): string {
    if (!route.estimatedCompletion) return 'N/A';
    
    const now = new Date();
    const completion = new Date(route.estimatedCompletion);
    
    if (completion < now) return 'Overdue';
    
    const diffMs = completion.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }
}