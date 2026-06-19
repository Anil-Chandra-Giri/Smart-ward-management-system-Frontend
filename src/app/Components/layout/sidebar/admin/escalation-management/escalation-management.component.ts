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

// Normalizes whatever casing the backend sends ('staff', 'Staff', 'STAFF')
// into the canonical PascalCase form the template and loaders expect.
const ROLE_MAP: Record<string, string> = {
    staff: 'Staff',
    admin: 'Admin',
    citizen: 'Citizen',
};

function normalizeRole(role: string | undefined | null): string {
    if (!role) return 'Citizen';
    return ROLE_MAP[role.toLowerCase()] ?? 'Citizen';
}

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

    // ---- Escalation modal state ----
    showEscalationModal: boolean = false;
    escalationReason: string = '';
    private escalationTarget: any = null;

    // ---- Reassign modal state ----
    showReassignModal: boolean = false;
    reassignOfficerId: string = '';
    private reassignTarget: any = null;

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

        // Set a sensible default active tab per role so the dashboard
        // doesn't render an empty 'overview' that nothing matches.
        this.activeTab = this.userRole === 'Admin' ? 'escalated'
            : this.userRole === 'Citizen' ? 'complaints'
            : 'overview';

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
        const user = this.authService.getCurrentUser() ?? this.authService.decodeToken();

        if (!user || !user.UserId) {
            this.router.navigate(['/login']);
            return false;
        }

        this.currentUser = user;
        // Backend sends Role as lowercase ('staff'), normalize to PascalCase
        // ('Staff') so it matches the template's *ngIf checks and the
        // loaders/routes lookup tables below.
        this.userRole = normalizeRole(user.Role ?? user.role);
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
                    // Backend may or may not wrap the payload in {success, data}.
                    // Handle both shapes so a missing wrapper doesn't silently
                    // skip loading everything.
                    if (response && response.success === false) {
                        this.showError(response.message || 'Failed to load dashboard data');
                    } else {
                        this.dashboardStats = response?.data ?? response ?? {};
                        this.loadRoleSpecificData();
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

    private unwrap<T>(res: any, fallback: T): T {
        // Same defensive unwrap as loadDashboardData: accept either
        // {success, data} or a raw array/object body.
        if (res && typeof res === 'object' && 'success' in res) {
            return res.success ? (res.data ?? fallback) : fallback;
        }
        return res ?? fallback;
    }

    private loadStaffData(): void {
        this.apiService.getStaffAssignments(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.assignments = this.unwrap(res, []);
                    this.originalAssignments = [...this.assignments];
                },
                error: (err) => console.error('Error loading assignments:', err),
            });
    }

    private loadAdminData(): void {
        this.apiService.getEscalatedTasks(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.escalatedTasks = this.unwrap(res, []); },
                error: (err) => console.error('Error loading escalated tasks:', err),
            });

        this.apiService.getAllOverdueTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.allOverdueTasks = this.unwrap(res, []); },
                error: (err) => console.error('Error loading overdue tasks:', err),
            });
    }

    private loadCitizenData(): void {
        this.apiService.getComplaints(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.myComplaints = this.unwrap(res, []); },
                error: (err) => console.error('Error loading complaints:', err),
            });

        this.apiService.getAllService(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.myServiceRequests = this.unwrap(res, []); },
                error: (err) => console.error('Error loading service requests:', err),
            });
    }

    loadNotifications(): void {
        if (!this.userId) return;

        this.apiService.getNotifications(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.notifications = this.unwrap(res, []); },
                error: (err) => console.error('Error loading notifications:', err),
            });

        this.apiService.getUnreadCount(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => { this.unreadCount = this.unwrap(res, 0); },
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
                    if (res.success !== false) {
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

    // ============ ESCALATION MODAL ============

    openEscalationModal(task: any): void {
        if (!task?.id) {
            this.showError('Invalid task data');
            return;
        }
        this.escalationTarget = task;
        this.escalationReason = 'Task overdue and no response from assigned officer';
        this.showEscalationModal = true;
    }

    cancelEscalation(): void {
        this.showEscalationModal = false;
        this.escalationReason = '';
        this.escalationTarget = null;
    }

    confirmEscalation(): void {
        const reason = this.escalationReason?.trim();
        if (!reason || !this.escalationTarget?.id) return;

        const task = this.escalationTarget;

        // NOTE: apiService.escalateTask currently does
        //   JSON.stringify(reason) as the raw body.
        // That sends a bare quoted string ("reason text") instead of an
        // object. If the backend expects a DTO like { reason: string },
        // update ApiService.escalateTask to send { reason } instead.
        this.apiService.escalateTask(task.id, reason)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res?.success !== false) {
                        this.showSuccess('Task escalated successfully');
                        this.loadDashboardData();
                    } else {
                        this.showError(res?.message || 'Failed to escalate task');
                    }
                    this.cancelEscalation();
                },
                error: (err) => {
                    console.error(err);
                    this.showError('Failed to escalate task');
                    this.cancelEscalation();
                },
            });
    }

    // ============ REASSIGN MODAL ============

    openReassignModal(task: any): void {
        if (!task?.id) {
            this.showError('Invalid task data');
            return;
        }
        this.reassignTarget = task;
        this.reassignOfficerId = '';
        this.showReassignModal = true;
    }

    cancelReassign(): void {
        this.showReassignModal = false;
        this.reassignOfficerId = '';
        this.reassignTarget = null;
    }

    confirmReassign(): void {
        const officerId = this.reassignOfficerId?.trim();
        if (!officerId || !this.reassignTarget?.id) return;

        const task = this.reassignTarget;

        // NOTE: There is no reassign endpoint in ApiService yet.
        // Add one (e.g. POST /api/FollowUp/reassign/{taskId}) and call it
        // here, for example:
        //
        // this.apiService.reassignTask(task.id, officerId)
        //   .pipe(takeUntil(this.destroy$))
        //   .subscribe({
        //     next: (res) => {
        //       if (res?.success !== false) {
        //         this.showSuccess(`Task reassigned to officer ${officerId}`);
        //         this.loadDashboardData();
        //       } else {
        //         this.showError(res?.message || 'Failed to reassign task');
        //       }
        //       this.cancelReassign();
        //     },
        //     error: (err) => {
        //       console.error(err);
        //       this.showError('Failed to reassign task');
        //       this.cancelReassign();
        //     },
        //   });
        this.showInfo(`Task will be reassigned to officer: ${officerId} (backend endpoint not yet implemented)`);
        this.cancelReassign();
    }

    markNotificationAsRead(notificationId: string): void {
        if (!notificationId) return;

        this.apiService.markNotificationAsRead(notificationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success !== false) {
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
                    if (res.success !== false) {
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
        // FIX: was calling getComplaints(complaintId) which expects a userId,
        // not a complaintId. The correct endpoint is trackComplaintStatus.
        this.apiService.trackComplaintStatus(complaintId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const s = this.unwrap<any>(res, null);
                    if (s) {
                        alert(`Status: ${s.status}\nAssigned Date: ${s.assignedDate}\nEstimated Resolution: ${s.estimatedResolution}`);
                    } else {
                        this.showError('No tracking information found');
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.showError('Failed to track complaint');
                },
            });
    }

    markAsResolved(task: any): void {
        if (!confirm('Are you sure you want to mark this task as resolved?')) return;

        // NOTE: There is no "resolve escalated task" endpoint in ApiService yet.
        // The closest existing method is updateComplaintStatus/updateServiceStatus,
        // but those operate on Complaints/ServiceRequests, not escalated tasks
        // directly. Add a dedicated endpoint (e.g. PUT /api/FollowUp/resolve/{taskId})
        // and call it here, for example:
        //
        // this.apiService.resolveEscalatedTask(task.id)
        //   .pipe(takeUntil(this.destroy$))
        //   .subscribe({
        //     next: (res) => {
        //       if (res.success !== false) {
        //         this.showSuccess('Task marked as resolved');
        //         this.loadDashboardData();
        //       } else {
        //         this.showError(res.message || 'Failed to resolve task');
        //       }
        //     },
        //     error: (err) => {
        //       console.error(err);
        //       this.showError('Failed to resolve task');
        //     },
        //   });
        this.showInfo('Resolve action not yet wired to backend');
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