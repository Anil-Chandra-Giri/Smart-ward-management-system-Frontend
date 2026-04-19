import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';
import { Assignment, EscalatedTask, ReminderRequest } from '../../../../../Models/Assignment.Model';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
    selector: 'app-escalation-management',
    templateUrl: './escalation-management.component.html',
    styleUrls: ['./escalation-management.component.css'],
    imports: [CommonModule, FormsModule]
})
export class EscalationManagementComponent implements OnInit, OnDestroy {
    // User properties
    currentUser: any = null;
    userRole: string = 'Citizen';
    userId: string = '';
    
    // Data properties
    dashboardStats: any = {};
    assignments: Assignment[] = [];
    escalatedTasks: EscalatedTask[] = [];
    notifications: Notification[] = [];
    unreadCount: number = 0;
    allOverdueTasks: any[] = [];
    myComplaints: any[] = [];
    myServiceRequests: any[] = [];
    
    // UI state properties
    loading: boolean = true;
    showNotifications: boolean = false;
    selectedFilter: string = 'all';
    searchTerm: string = '';
    activeTab: string = 'overview';
    
    // Backup for filtering
    private originalAssignments: Assignment[] = [];
    
    // Message properties
    message: { type: string; text: string } | null = null;
    
    // Cleanup
    private destroy$ = new Subject<void>();
  private isBrowser: boolean;
    constructor(
        private escalationService: ApiService,
        private authService: AuthService,
        private router: Router,
         @Inject(PLATFORM_ID) private platformId: object
    ) {
       this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
    console.log('=== Escalation Management Initialized ===');
    
    // Get current user from AuthService (not decode token again)
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
        this.userRole = this.currentUser.Role || this.currentUser.role || 'Citizen';
        this.userId = this.currentUser.UserId || this.currentUser.userId || '';
        
        console.log('User loaded from AuthService:', { 
            userId: this.userId, 
            userRole: this.userRole,
            fullUser: this.currentUser 
        });
    } else {
        // Fallback to decode token if getCurrentUser returns null
        const decodedToken = this.authService.decodeToken();
        console.log('Decoded Token (fallback):', decodedToken);
        
        if (decodedToken) {
            this.currentUser = decodedToken;
            this.userRole = decodedToken.Role || decodedToken.Role || 'Citizen';
            this.userId = decodedToken.UserId || decodedToken.UserId || '';
        } else {
            console.error('No user found!');
            this.showError('Please login to access this page');
            this.router.navigate(['/login']);
            return;
        }
    }
    
    // Only load data if we have valid user ID
    if (this.userId && this.userRole) {
        this.loadDashboardData();
        this.loadNotifications();
    } else {
        console.error('Invalid user data:', { userId: this.userId, userRole: this.userRole });
        this.showError('Invalid user session. Please login again.');
        this.loading = false;
    }
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        this.refreshData();
    }, 300000);
}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ============ DATA LOADING METHODS ============
    
    loadDashboardData(): void {
        if (!this.userId) {
            this.showError('User not logged in');
            this.loading = false;
            return;
        }
        
        this.loading = true;
        
        console.log('Loading dashboard for:', { userId: this.userId, role: this.userRole });
        
        this.escalationService.getDashboardStats(this.userId, this.userRole)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    console.log('Dashboard response:', response);
                    if (response.success) {
                        this.dashboardStats = response.data;
                        
                        // Load role-specific data
                        if (this.userRole === 'Staff') {
                            this.loadStaffData();
                        } else if (this.userRole === 'Admin') {
                            this.loadAdminData();
                        } else if (this.userRole === 'Citizen') {
                            this.loadCitizenData();
                        }
                    } else {
                        this.showError(response.message || 'Failed to load dashboard data');
                    }
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading dashboard:', error);
                    this.showError('Failed to load dashboard data');
                    this.loading = false;
                }
            });
    }

    loadStaffData(): void {
        // Load staff assignments
        this.escalationService.getStaffAssignments(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.assignments = response.data ?? [];
                        this.originalAssignments = [...this.assignments];
                    }
                },
                error: (error) => console.error('Error loading assignments:', error)
            });
    }

    loadAdminData(): void {
        // Load escalated tasks for admin
        this.escalationService.getEscalatedTasks(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.escalatedTasks = response.data ?? [];
                    }
                },
                error: (error) => console.error('Error loading escalated tasks:', error)
            });
        
        // Load all overdue tasks
        this.escalationService.getAllOverdueTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.allOverdueTasks = response.data ?? [];
                    }
                },
                error: (error) => console.error('Error loading overdue tasks:', error)
            });
    }

    loadCitizenData(): void {
        // Load citizen complaints
        this.escalationService.getComplaints(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.myComplaints = response.data ?? [];
                    }
                },
                error: (error) => console.error('Error loading complaints:', error)
            });
        
        // Load citizen service requests
        this.escalationService.getAllService(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.myServiceRequests = response.data ?? [];
                    }
                },
                error: (error) => console.error('Error loading service requests:', error)
            });
    }

    loadNotifications(): void {
        if (!this.userId) return;
        
        this.escalationService.getNotifications(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.notifications = response.data ?? [];
                    }
                },
                error: (error) => console.error('Error loading notifications:', error)
            });
        
        this.escalationService.getUnreadCount(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.unreadCount = response.data ?? 0;
                    }
                },
                error: (error) => console.error('Error loading unread count:', error)
            });
    }

    refreshData(): void {
        this.loadDashboardData();
        this.loadNotifications();
    }

    // ============ FILTER METHODS ============
    
    filterAssignments(): void {
        if (!this.originalAssignments.length) {
            this.originalAssignments = [...this.assignments];
        }
        
        let filtered = [...this.originalAssignments];

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

    // ============ ACTION METHODS ============
    
    sendReminder(assignment: Assignment): void {
        if (!assignment.id || !assignment.assignedToOfficerId) {
            this.showError('Invalid assignment data');
            return;
        }
        
        const reminder: ReminderRequest = {
            assignmentId: assignment.id,
            officerId: assignment.assignedToOfficerId,
            referenceType: assignment.referenceType ?? 'Unknown',
            referenceNumber: assignment.referenceNumber ?? 'N/A',
            daysOverdue: assignment.daysOverdue ?? 0,
            reminderType: 1
        };

        this.escalationService.sendReminder(reminder)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.showSuccess('Reminder sent successfully');
                        this.loadDashboardData();
                    } else {
                        this.showError(response.message || 'Failed to send reminder');
                    }
                },
                error: (error) => {
                    this.showError('Failed to send reminder');
                    console.error(error);
                }
            });
    }

    escalateTask(task: any, reason: string = ''): void {
        if (!task) {
            this.showError('Invalid task data');
            return;
        }
        
        let escalationReason = reason;
        
        if (!escalationReason) {
            escalationReason = prompt(
                'Please provide a reason for escalation:',
                'Task overdue and no response from assigned officer'
            ) ?? '';
            
            if (!escalationReason) {
                this.showInfo('Escalation cancelled');
                return;
            }
        }
        
        const taskId = task.id;
        if (!taskId) {
            this.showError('Unable to identify task ID');
            return;
        }
        
        if (confirm(`Are you sure you want to escalate this task?\n\nReason: ${escalationReason}`)) {
            this.escalationService.escalateTask(taskId, escalationReason)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.showSuccess('Task escalated successfully');
                            this.loadDashboardData();
                        } else {
                            this.showError(response.message || 'Failed to escalate task');
                        }
                    },
                    error: (error) => {
                        this.showError('Failed to escalate task');
                        console.error(error);
                    }
                });
        }
    }

    markNotificationAsRead(notificationId: string): void {
        if (!notificationId) return;
        
        this.escalationService.markNotificationAsRead(notificationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        const notification = this.notifications.find(n => n.id === notificationId);
                        if (notification) {
                            notification.isRead = true;
                        }
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                        this.showSuccess('Notification marked as read');
                    }
                },
                error: (error) => console.error('Error marking notification as read:', error)
            });
    }

    markAllNotificationsAsRead(): void {
        if (!this.userId) return;
        
        this.escalationService.markAllNotificationsAsRead(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.notifications.forEach(n => n.isRead = true);
                        this.unreadCount = 0;
                        this.showSuccess('All notifications marked as read');
                    }
                },
                error: (error) => console.error('Error marking all notifications as read:', error)
            });
    }

    viewDetails(item: any): void {
        const referenceType = item.referenceType ?? 'Complaint';
        const referenceId = item.referenceId ?? item.id;
        
        if (!referenceId) {
            this.showError('Invalid reference ID');
            return;
        }
        
        if (referenceType === 'Complaint') {
            this.router.navigate(['/complaints', referenceId]);
        } else if (referenceType === 'Service') {
            this.router.navigate(['/service-requests', referenceId]);
        }
    }

    trackComplaint(complaintId: string): void {
        this.escalationService.getComplaints(complaintId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        const status = response.data;
                        alert(`Status: ${status.status}\nAssigned Date: ${status.assignedDate}\nEstimated Resolution: ${status.estimatedResolution}`);
                    }
                },
                error: (error) => {
                    this.showError('Failed to track complaint');
                    console.error(error);
                }
            });
    }

    reassignTask(task: any): void {
        const newOfficerId = prompt('Enter the new officer ID to reassign this task:');
        if (newOfficerId && newOfficerId.trim()) {
            this.showInfo(`Task will be reassigned to officer: ${newOfficerId}`);
            // TODO: Call API to reassign
        }
    }

    markAsResolved(task: any): void {
        if (confirm('Are you sure you want to mark this task as resolved?')) {
            this.showSuccess('Task marked as resolved');
            // TODO: Call API to resolve task
            this.loadDashboardData();
        }
    }

    // ============ HELPER METHODS ============
    
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

    getEscalationLevelClass(level: number | undefined): string {
        if (!level) return 'secondary';
        
        const classes: Record<number, string> = {
            1: 'warning',
            2: 'danger',
            3: 'dark'
        };
        return classes[level] || 'secondary';
    }

    getEscalationLevelText(level: number | undefined): string {
        if (!level) return 'Unknown';
        
        const texts: Record<number, string> = {
            1: 'Senior Officer',
            2: 'Admin',
            3: 'Super Admin'
        };
        return texts[level] || 'Unknown';
    }

    getNotificationClass(type: number): string {
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

    getNotificationIcon(type: number): string {
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

    getNotificationIconClass(type: number): string {
        return this.getNotificationClass(type);
    }

    // ============ MESSAGE METHODS ============
    
    private showSuccess(message: string): void {
        this.message = { type: 'success', text: message };
        console.log('✅ Success:', message);
        this.autoClearMessage();
    }

    private showError(message: string): void {
        this.message = { type: 'error', text: message };
        console.error('❌ Error:', message);
        this.autoClearMessage();
    }

    private showWarning(message: string): void {
        this.message = { type: 'warning', text: message };
        console.warn('⚠️ Warning:', message);
        this.autoClearMessage();
    }

    private showInfo(message: string): void {
        this.message = { type: 'info', text: message };
        console.info('ℹ️ Info:', message);
        this.autoClearMessage();
    }

    private autoClearMessage(): void {
        setTimeout(() => {
            this.message = null;
        }, 5000);
    }

    clearMessage(): void {
        this.message = null;
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
}