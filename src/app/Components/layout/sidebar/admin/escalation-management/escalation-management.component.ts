import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';
import { Assignment, EscalatedTask, ReminderRequest } from '../../../../../Models/Assignment.Model';

// ============ INTERFACES ============

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

// ============ LOOKUP MAPS ============

const PRIORITY_CLASSES: Record<string, string> = {
    High: 'danger',
    Critical: 'danger',
    Medium: 'warning',
    Low: 'info',
    Normal: 'secondary',
};

const STATUS_CLASSES: Record<string, string> = {
    Pending: 'warning',
    'In Progress': 'info',
    Resolved: 'success',
    Closed: 'secondary',
    Rejected: 'danger',
    Approved: 'success',
};

const ESCALATION_CLASSES: Record<number, string> = { 1: 'warning', 2: 'danger', 3: 'dark' };
const ESCALATION_TEXTS: Record<number, string> = { 1: 'Senior Officer', 2: 'Admin', 3: 'Super Admin' };

const NOTIFICATION_CLASSES: Record<number, string> = {
    1: 'info', 2: 'success', 3: 'warning', 4: 'error', 5: 'reminder', 6: 'escalation',
};

const NOTIFICATION_ICONS: Record<number, string> = {
    1: 'fa-info-circle',
    2: 'fa-check-circle',
    3: 'fa-exclamation-triangle',
    4: 'fa-times-circle',
    5: 'fa-bell',
    6: 'fa-arrow-up',
};

// ============ COMPONENT ============

@Component({
    selector: 'app-escalation-management',
    templateUrl: './escalation-management.component.html',
    styleUrls: ['./escalation-management.component.css'],
    imports: [CommonModule, FormsModule],
})
export class EscalationManagementComponent implements OnInit, OnDestroy {

    // ---- User ----
    currentUser: any = null;
    userRole: string = 'Citizen';
    userId: string = '';

    // ---- Data ----
    dashboardStats: any = {};
    assignments: Assignment[] = [];
    escalatedTasks: EscalatedTask[] = [];
    notifications: Notification[] = [];
    unreadCount: number = 0;
    allOverdueTasks: any[] = [];
    myComplaints: any[] = [];
    myServiceRequests: any[] = [];

    // ---- UI State ----
    loading: boolean = false;
    showNotifications: boolean = false;
    selectedFilter: string = 'all';
    searchTerm: string = '';
    activeTab: string = 'overview';
    message: { type: string; text: string } | null = null;

    // ---- Private ----
    private originalAssignments: Assignment[] = [];
    private destroy$ = new Subject<void>();
    private refreshTimer: ReturnType<typeof setInterval> | null = null;
    private isBrowser: boolean;

    constructor(
        private apiService: ApiService,
        private authService: AuthService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: object,
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    // ============ LIFECYCLE ============

    ngOnInit(): void {
        // Never run auth or API calls on the server
        if (!this.isBrowser) return;

        if (!this.resolveUser()) return;

        this.loadDashboardData();
        this.loadNotifications();

        this.refreshTimer = setInterval(() => this.refreshData(), 300_000);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.refreshTimer) clearInterval(this.refreshTimer);
    }

    // ============ AUTH ============

    /**
     * Resolves the current user from AuthService or falls back to token decode.
     * Returns false and redirects if no valid session is found.
     */
    private resolveUser(): boolean {
        const user = this.authService.getCurrentUser?.() ?? this.authService.decodeToken?.();

        if (!user || !user.UserId) {
            this.router.navigate(['/login']);
            return false;
        }

        this.currentUser = user;
        this.userRole = user.Role || user.role || 'Citizen';
        this.userId = user.UserId || user.userId || '';

        if (!this.userId) {
            this.showError('Invalid user session. Please login again.');
            this.router.navigate(['/login']);
            return false;
        }

        return true;
    }

    // ============ DATA LOADING ============

    loadDashboardData(): void {
        this.loading = true;

        this.apiService.getDashboardStats(this.userId, this.userRole)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.dashboardStats = response.data;
                        this.loadRoleSpecificData();
                    } else {
                        this.showError(response.message || 'Failed to load dashboard data');
                    }
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading dashboard:', err);
                    this.showError('Failed to load dashboard data');
                    this.loading = false;
                },
            });
    }

    private loadRoleSpecificData(): void {
        const loaders: Record<string, () => void> = {
            Staff: () => this.loadStaffData(),
            Admin: () => this.loadAdminData(),
            Citizen: () => this.loadCitizenData(),
        };
        loaders[this.userRole]?.();
    }

    private loadStaffData(): void {
        this.apiService.getStaffAssignments(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.assignments = res.data ?? [];
                        this.originalAssignments = [...this.assignments];
                    }
                },
                error: (err) => console.error('Error loading assignments:', err),
            });
    }

    private loadAdminData(): void {
        this.apiService.getEscalatedTasks(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.escalatedTasks = res.data ?? []; },
                error: (err) => console.error('Error loading escalated tasks:', err),
            });

        this.apiService.getAllOverdueTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.allOverdueTasks = res.data ?? []; },
                error: (err) => console.error('Error loading overdue tasks:', err),
            });
    }

    private loadCitizenData(): void {
        this.apiService.getComplaints(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.myComplaints = res.data ?? []; },
                error: (err) => console.error('Error loading complaints:', err),
            });

        this.apiService.getAllService(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.myServiceRequests = res.data ?? []; },
                error: (err) => console.error('Error loading service requests:', err),
            });
    }

    loadNotifications(): void {
        if (!this.userId) return;

        this.apiService.getNotifications(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.notifications = res.data ?? []; },
                error: (err) => console.error('Error loading notifications:', err),
            });

        this.apiService.getUnreadCount(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { if (res.success) this.unreadCount = res.data ?? 0; },
                error: (err) => console.error('Error loading unread count:', err),
            });
    }

    refreshData(): void {
        this.loadDashboardData();
        this.loadNotifications();
    }

    // ============ FILTERING ============

    filterAssignments(): void {
        // Restore from backup before applying filters
        let filtered = [...this.originalAssignments];

        switch (this.selectedFilter) {
            case 'overdue':    filtered = filtered.filter(a => a.isOverdue);  break;
            case 'escalated':  filtered = filtered.filter(a => a.isEscalated); break;
            case 'pending':    filtered = filtered.filter(a => !a.isOverdue && !a.isEscalated); break;
        }

        const term = this.searchTerm?.trim().toLowerCase();
        if (term) {
            filtered = filtered.filter(a =>
                a.title?.toLowerCase().includes(term) ||
                a.referenceNumber?.toLowerCase().includes(term) ||
                a.wardNumber?.toLowerCase().includes(term)
            );
        }

        this.assignments = filtered;
    }

    // ============ ACTIONS ============

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
            reminderType: 1,
        };

        this.apiService.sendReminder(reminder)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.showSuccess('Reminder sent successfully');
                        this.loadDashboardData();
                    } else {
                        this.showError(res.message || 'Failed to send reminder');
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.showError('Failed to send reminder');
                },
            });
    }

    escalateTask(task: any, reason: string = ''): void {
        if (!task?.id) {
            this.showError('Invalid task data');
            return;
        }

        const escalationReason = reason || prompt(
            'Please provide a reason for escalation:',
            'Task overdue and no response from assigned officer'
        );

        if (!escalationReason) {
            this.showInfo('Escalation cancelled');
            return;
        }

        if (!confirm(`Are you sure you want to escalate this task?\n\nReason: ${escalationReason}`)) return;

        this.apiService.escalateTask(task.id, escalationReason)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.showSuccess('Task escalated successfully');
                        this.loadDashboardData();
                    } else {
                        this.showError(res.message || 'Failed to escalate task');
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.showError('Failed to escalate task');
                },
            });
    }

    markNotificationAsRead(notificationId: string): void {
        if (!notificationId) return;

        this.apiService.markNotificationAsRead(notificationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        const n = this.notifications.find(n => n.id === notificationId);
                        if (n) n.isRead = true;
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                },
                error: (err) => console.error('Error marking notification as read:', err),
            });
    }

    markAllNotificationsAsRead(): void {
        if (!this.userId) return;

        this.apiService.markAllNotificationsAsRead(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.notifications.forEach(n => (n.isRead = true));
                        this.unreadCount = 0;
                        this.showSuccess('All notifications marked as read');
                    }
                },
                error: (err) => console.error('Error marking all notifications as read:', err),
            });
    }

    viewDetails(item: any): void {
        const referenceId = item.referenceId ?? item.id;
        if (!referenceId) { this.showError('Invalid reference ID'); return; }

        const routes: Record<string, string> = {
            Complaint: '/complaints',
            Service: '/service-requests',
        };

        const base = routes[item.referenceType ?? 'Complaint'];
        if (base) this.router.navigate([base, referenceId]);
    }

    trackComplaint(complaintId: string): void {
        this.apiService.getComplaints(complaintId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        const s = res.data;
                        alert(`Status: ${s.status}\nAssigned Date: ${s.assignedDate}\nEstimated Resolution: ${s.estimatedResolution}`);
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.showError('Failed to track complaint');
                },
            });
    }

    reassignTask(task: any): void {
        const newOfficerId = prompt('Enter the new officer ID to reassign this task:')?.trim();
        if (newOfficerId) {
            // TODO: call API to reassign
            this.showInfo(`Task will be reassigned to officer: ${newOfficerId}`);
        }
    }

    markAsResolved(task: any): void {
        if (!confirm('Are you sure you want to mark this task as resolved?')) return;
        // TODO: call API to resolve task
        this.showSuccess('Task marked as resolved');
        this.loadDashboardData();
    }

    // ============ HELPER / DISPLAY ============

    setActiveTab(tab: string): void { this.activeTab = tab; }

    getPriorityClass(priority?: string): string {
        return PRIORITY_CLASSES[priority ?? ''] ?? 'secondary';
    }

    getStatusClass(status?: string): string {
        return STATUS_CLASSES[status ?? ''] ?? 'secondary';
    }

    getEscalationLevelClass(level?: number): string {
        return level != null ? (ESCALATION_CLASSES[level] ?? 'secondary') : 'secondary';
    }

    getEscalationLevelText(level?: number): string {
        return level != null ? (ESCALATION_TEXTS[level] ?? 'Unknown') : 'Unknown';
    }

    getNotificationClass(type: number): string {
        return NOTIFICATION_CLASSES[type] ?? 'info';
    }

    getNotificationIcon(type: number): string {
        return NOTIFICATION_ICONS[type] ?? 'fa-bell';
    }

    getNotificationIconClass(type: number): string {
        return this.getNotificationClass(type);
    }

    // ============ MESSAGES ============

    clearMessage(): void { this.message = null; }

    private showSuccess(text: string): void { this.setMessage('success', text); }
    private showError(text: string): void   { this.setMessage('error',   text); }
    private showWarning(text: string): void  { this.setMessage('warning', text); }
    private showInfo(text: string): void     { this.setMessage('info',    text); }

    private setMessage(type: string, text: string): void {
        this.message = { type, text };
        setTimeout(() => (this.message = null), 5000);
    }
}