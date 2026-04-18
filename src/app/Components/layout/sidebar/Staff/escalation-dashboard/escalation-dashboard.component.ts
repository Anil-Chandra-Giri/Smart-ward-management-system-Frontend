import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Assignment, DashboardStats, EscalatedTask, ReminderRequest } from '../../../../../Models/Assignment.Model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: number;
    createdAt: Date;
    isRead: boolean;
    actionUrl?: string;
}

@Component({
  selector: 'app-escalation-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './escalation-dashboard.component.html',
  styleUrl: './escalation-dashboard.component.css'
})
export class EscalationDashboardComponent implements OnInit, OnDestroy {
  isReading: boolean = false;
  currentUser: any;
  userRole: string = '';
  dashboardStats: DashboardStats = {};
  assignments: Assignment[] = [];
  escalatedTasks: EscalatedTask[] = [];
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private originalAssignments: Assignment[] = [];
  
  loading: boolean = true;
  showNotifications: boolean = false;
  selectedFilter: string = 'all';
  searchTerm: string = '';
   message: { type: string; text: string } | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private escalationService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.decodeToken().Role;
    this.currentUser = this.authService.decodeToken();
    this.loadDashboardData();
    this.loadNotifications();
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.refreshData();
    }, 300000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.escalationService.getDashboardStats(this.currentUser.UserId, this.userRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dashboardStats = response.data;
            
            if (this.userRole === 'Officer' || this.userRole === 'Staff' || this.userRole === 'SeniorOfficer' ) {
              this.assignments = this.dashboardStats.recentReminders || [];
              this.originalAssignments = [...this.assignments];
            } else if (this.userRole === 'Admin' || this.userRole === 'SuperAdmin') {
              this.escalatedTasks = this.dashboardStats.escalatedTasks || [];
            }
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.loading = false;
        }
      });
  }

  loadNotifications(): void {
    this.escalationService.getNotifications(this.currentUser.UserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notifications = response.data;
          }
        },
        error: (error) => console.error('Error loading notifications:', error)
      });
    
    this.escalationService.getUnreadCount(this.currentUser.UserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.unreadCount = response.data;
          }
        },
        error: (error) => console.error('Error loading unread count:', error)
      });
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadNotifications();
  }

  sendReminder(assignment: Assignment): void {
    const reminder: ReminderRequest = {
      assignmentId: assignment.id,
      officerId: assignment.assignedToOfficerId,
      referenceType: assignment.referenceType,
      referenceNumber: assignment.referenceNumber,
      daysOverdue: assignment.daysOverdue,
      reminderType: 1
    };

    this.escalationService.sendReminder(reminder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Reminder sent successfully');
            this.loadDashboardData();
          }
        },
        error: (error) => {
          this.showError('Failed to send reminder');
          console.error(error);
        }
      });
  }

  escalateTask(task: Assignment | EscalatedTask, reason: string = ''): void {
    // Validate task exists
    if (!task) {
        this.showError('Invalid task data');
        return;
    }
    
    let escalationReason = reason;
    
    // If no reason provided, prompt user
    if (!escalationReason) {
        const userInput = prompt(
            'Please provide a reason for escalation:',
            'Task overdue and no response from assigned officer'
        );
        
        // Handle cancellation
        if (userInput === null) {
            this.showInfo('Escalation cancelled');
            return;
        }
        
        // Handle empty reason
        if (userInput.trim() === '') {
            this.showWarning('Please provide a reason for escalation');
            return;
        }
        
        escalationReason = userInput.trim();
    }
    
    // Get task ID safely
    const taskId = task.id || (task as any).referenceId;
    if (!taskId) {
        this.showError('Unable to identify task ID');
        return;
    }
    
    // Confirm escalation with user
    if (confirm(`Are you sure you want to escalate this task?\n\nReason: ${escalationReason}`)) {
        this.performEscalation(taskId, escalationReason);
    } else {
        this.showInfo('Escalation cancelled');
    }
}



private performEscalation(taskId: string, reason: string): void {
    this.loading = true;
    
    this.escalationService.escalateTask(taskId, reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (response) => {
                this.loading = false;
                if (response && response.success) {
                    this.showSuccess('Task escalated successfully');
                    this.loadDashboardData(); // Refresh the data
                } else {
                    this.showError(response?.message || 'Failed to escalate task');
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('Escalation error:', error);
                this.showError('An error occurred while escalating the task');
            }
        });
}

  markNotificationAsRead(notificationId: string): void {
    this.escalationService.markNotificationAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadNotifications();
          }
        },
        error: (error) => console.error('Error marking notification as read:', error)
      });
  }

  markAllNotificationsAsRead(): void {
    this.escalationService.markAllNotificationsAsRead(this.currentUser.UserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadNotifications();
            this.showSuccess('All notifications marked as read');
          }
        },
        error: (error) => console.error('Error marking all notifications as read:', error)
      });
  }

  markAsResolved(task: EscalatedTask): void {
        console.log('Mark as resolved:', task);
        if (confirm('Are you sure you want to mark this task as resolved?')) {
            this.showSuccess('Task marked as resolved');
            // Call API to resolve task
            this.loadDashboardData();
        }
    }

     reassignTask(task: EscalatedTask): void {
        console.log('Reassign task:', task);
        // Implement reassign logic here
        const newOfficerId = prompt('Enter the new officer ID to reassign this task:');
        if (newOfficerId) {
            this.showInfo(`Task will be reassigned to officer: ${newOfficerId}`);
            // Call API to reassign
        }
    }

  viewDetails(item: Assignment | EscalatedTask): void {
    if (item.referenceType === 'Complaint') {
      this.router.navigate(['/complaints', item.referenceId]);
    } else if (item.referenceType === 'Service') {
      this.router.navigate(['/service-requests', item.referenceId]);
    }
  }

 // Priority class mapping
getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'secondary';
    
    const classes: Record<string, string> = {
        'High': 'danger',
        'Critical': 'danger',
        'Medium': 'warning',
        'Low': 'info',
        'Normal': 'secondary'
    };
    
    return classes[priority] || 'secondary';
}

// Status class mapping
getStatusClass(status: string | undefined): string {
    if (!status) return 'secondary';
    
    const classes: Record<string, string> = {
        'Pending': 'warning',
        'In Progress': 'info',
        'Resolved': 'success',
        'Closed': 'secondary',
        'Rejected': 'danger',
        'Approved': 'success'
    };
    
    return classes[status] || 'secondary';
}

// Escalation level class mapping
getEscalationLevelClass(level: number | undefined): string {
    if (!level) return 'secondary';
    
    const classes: Record<number, string> = {
        1: 'warning',
        2: 'danger',
        3: 'dark'
    };
    
    return classes[level] || 'secondary';
}

// Escalation level text mapping
getEscalationLevelText(level: number | undefined): string {
    if (!level) return 'Unknown';
    
    const texts: Record<number, string> = {
        1: 'Senior Officer',
        2: 'Admin',
        3: 'Super Admin'
    };
    
    return texts[level] || 'Unknown';
}

// Notification icon class mapping
getNotificationIconClass(type: number | undefined): string {
    if (!type) return 'info';
    
    const classes: Record<number, string> = {
        1: 'info',
        2: 'success',
        3: 'warning',
        4: 'error',
        5: 'reminder',
        6: 'escalation'
    };
    
    return classes[type] || 'info';
}

// Notification icon mapping
getNotificationIcon(type: number | undefined): string {
    if (!type) return 'fa-bell';
    
    const icons: Record<number, string> = {
        1: 'fa-info-circle',
        2: 'fa-check-circle',
        3: 'fa-exclamation-triangle',
        4: 'fa-times-circle',
        5: 'fa-bell',
        6: 'fa-arrow-up'
    };
    
    return icons[type] || 'fa-bell';
}
  private showError(message: string): void {
    // Implement your toast/notification service
    console.error('Error:', message);
  }

   private showSuccess(message: string): void {
    this.message = { type: 'success', text: message };
    console.log('✅ Success:', message);
    this.autoClearMessage();

  }

  private showWarning(message: string): void {
    this.message = { type: 'warning', text: message };
    console.warn('⚠️ Warning:', message);
    this.autoClearMessage();
    
    // You can also use a toast service here
    // this.toastService.warning(message);
  }

  private showInfo(message: string): void {
    this.message = { type: 'info', text: message };
    console.info('ℹ️ Info:', message);
    this.autoClearMessage();
    
    // You can also use a toast service here
    // this.toastService.info(message);
  }

  private autoClearMessage(): void {
    setTimeout(() => {
      this.message = null;
    }, 5000);
  }

  clearMessage(): void {
    this.message = null;
  }

   filterAssignments(): void {
        
        
        let filtered = [...this.originalAssignments];

        // Apply status filter
        switch (this.selectedFilter) {
            case 'overdue':
                filtered = filtered.filter(a => a.isOverdue === true);
                break;
            case 'escalated':
                filtered = filtered.filter(a => a.isEscalated === true);
                break;
            case 'pending':
                filtered = filtered.filter(a => !a.isOverdue && !a.isEscalated);
                break;
            default:
                break;
        }

        // Apply search filter
        if (this.searchTerm && this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(a => 
                (a.title?.toLowerCase() ?? '').includes(term) ||
                (a.referenceNumber?.toLowerCase() ?? '').includes(term) ||
                (a.wardNumber?.toLowerCase() ?? '').includes(term)
            );
        }

        this.assignments = filtered;
    }

}
