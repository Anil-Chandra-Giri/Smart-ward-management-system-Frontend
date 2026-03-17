// src/app/components/disaster-event-list/disaster-event-list.component.ts
import { Component, OnInit } from '@angular/core';
import { DisasterEvent } from '../../Models/DisasterEvent.model';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-disaster-event-list',
  templateUrl: './disaster-event-list.component.html',
  styleUrls: ['./disaster-event-list.component.css'],
  imports:[CommonModule,RouterLink]
})
export class DisasterEventListComponent implements OnInit {
  events: DisasterEvent[] = [];
  loading = false;
  error = '';
  showActiveOnly = false;

  constructor(private disasterEventService: ApiService) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    
    if (this.showActiveOnly) {
      this.disasterEventService.getActiveEvents().subscribe({
        next: (data) => {
          this.events = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error loading active events';
          this.loading = false;
          console.error('Error:', error);
        }
      });
    } else {
      this.disasterEventService.getDisasterEvents().subscribe({
        next: (data) => {
          this.events = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error loading disaster events';
          this.loading = false;
          console.error('Error:', error);
        }
      });
    }
  }

  toggleActiveOnly(): void {
    this.showActiveOnly = !this.showActiveOnly;
    this.loadEvents();
  }

  getSeverityClass(severity: string): string {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'badge bg-danger';
      case 'high': return 'badge bg-warning';
      case 'medium': return 'badge bg-info';
      case 'low': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'badge bg-success';
      case 'inactive': return 'badge bg-secondary';
      case 'completed': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }

  deleteEvent(id: string): void {
    if (confirm('Are you sure you want to delete this disaster event? This action cannot be undone.')) {
      this.disasterEventService.deleteDisasterEvent(id).subscribe({
        next: () => {
          this.events = this.events.filter(e => e.id !== id);
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.error = 'Error deleting event';
        }
      });
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}