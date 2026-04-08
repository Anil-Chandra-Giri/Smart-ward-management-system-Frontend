import { Component, OnInit } from '@angular/core';
import { Assignment } from '../../Models/Assignment.Model';
import { ApiService } from '../../Services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-officer-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './officer-dashboard.component.html',
  styleUrl: './officer-dashboard.component.css'
})
export class OfficerDashboardComponent implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  stats = {
    totalTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0,
    escalatedToMe: 0
  };
  
  selectedFilter: string = 'all';
  searchTerm: string = '';
  loading: boolean = true;
  currentOfficerId: string = '';

  constructor(
    private followUpService: ApiService,
    private router: Router
  ) {
    // Get current user ID from localStorage or auth service
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentOfficerId = user.id || '';
  }

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    this.followUpService.getOfficerAssignments(this.currentOfficerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignments = response.data;
          this.filteredAssignments = [...this.assignments];
          this.stats = {
            totalTasks: response.overdueCount + response.data.filter((a: Assignment) => !a.isOverdue).length,
            overdueTasks: response.overdueCount,
            pendingTasks: response.data.filter((a: Assignment) => !a.isOverdue && !a.isEscalated).length,
            escalatedToMe: response.escalatedCount
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.loading = false;
      }
    });
  }

  filterAssignments(): void {
    let filtered = [...this.assignments];

    // Apply filter
    switch (this.selectedFilter) {
      case 'overdue':
        filtered = filtered.filter(a => a.isOverdue);
        break;
      case 'escalated':
        filtered = filtered.filter(a => a.isEscalated);
        break;
      case 'pending':
        filtered = filtered.filter(a => !a.isOverdue && !a.isEscalated);
        break;
      default:
        break;
    }

    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.referenceNumber.toLowerCase().includes(term) ||
        a.wardNumber.toLowerCase().includes(term)
      );
    }

    this.filteredAssignments = filtered;
  }

  sendReminder(assignment: Assignment): void {
    const reminder = {
      assignmentId: assignment.id,
      officerId: assignment.assignedToOfficerId,
      referenceType: assignment.referenceType,
      referenceNumber: assignment.referenceNumber,
      daysOverdue: assignment.daysOverdue,
      reminderType: 1 // First reminder
    };

    this.followUpService.sendReminder(reminder).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Reminder sent successfully');
        }
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        alert('Failed to send reminder');
      }
    });
  }

  viewDetails(assignment: Assignment): void {
    if (assignment.referenceType === 'Complaint') {
      this.router.navigate(['/complaints', assignment.referenceId]);
    } else {
      this.router.navigate(['/service-requests', assignment.referenceId]);
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

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'badge-warning',
      'In Progress': 'badge-info',
      'Resolved': 'badge-success',
      'Closed': 'badge-secondary',
      'Rejected': 'badge-danger'
    };
    return `badge ${statusMap[status] || 'badge-secondary'}`;
  }
}
