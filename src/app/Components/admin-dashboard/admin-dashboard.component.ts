import { Component, OnInit } from '@angular/core';
import { EscalatedTask } from '../../Models/Assignment.Model';
import { Router } from '@angular/router';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  escalatedTasks: EscalatedTask[] = [];
  stats = {
    totalEscalated: 0,
    criticalTasks: 0,
    pendingReview: 0
  };
  
  loading: boolean = true;
  currentAdminId: string = '';

  constructor(
    private followUpService: ApiService,
    private router: Router
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentAdminId = user.id || '';
  }

  ngOnInit(): void {
    this.loadEscalatedTasks();
  }

  loadEscalatedTasks(): void {
    this.loading = true;
    this.followUpService.getEscalatedTasks(this.currentAdminId).subscribe({
      next: (response) => {
        if (response.success) {
          this.escalatedTasks = response.data;
          this.stats = {
            totalEscalated: response.totalCount,
            criticalTasks: response.data.filter((t: EscalatedTask) => t.daysPending > 10).length,
            pendingReview: response.data.filter((t: EscalatedTask) => t.isHighlighted).length
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading escalated tasks:', error);
        this.loading = false;
      }
    });
  }

  reassignTask(task: EscalatedTask): void {
    // Implement reassign logic
    console.log('Reassign task:', task);
  }

  markAsReviewed(task: EscalatedTask): void {
    // Implement mark as reviewed logic
    task.isHighlighted = false;
  }

  viewDetails(task: EscalatedTask): void {
    if (task.referenceType === 'Complaint') {
      this.router.navigate(['/complaints', task.referenceId]);
    } else {
      this.router.navigate(['/service-requests', task.referenceId]);
    }
  }

  getPriorityClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'High': 'badge-danger',
      'Medium': 'badge-warning',
      'Low': 'badge-info',
      'Normal': 'badge-secondary'
    };
    return `badge ${priorityMap[priority] || 'badge-secondary'}`;
  }

  getEscalationLevelClass(level: number): string {
    const levelMap: { [key: number]: string } = {
      1: 'badge-warning', // First Level
      2: 'badge-danger',  // Second Level
      3: 'badge-dark'     // Third Level
    };
    return `badge ${levelMap[level] || 'badge-secondary'}`;
  }

  getEscalationLevelText(level: number): string {
    const levelMap: { [key: number]: string } = {
      1: 'Senior Officer',
      2: 'Admin',
      3: 'Super Admin'
    };
    return levelMap[level] || 'Unknown';
  }
}
