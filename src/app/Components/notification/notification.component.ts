import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../Services/api.service';

@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationCenterComponent implements OnInit {
  @Input() userId: string = '';
  @Output() notificationRead = new EventEmitter<string>();
  
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;

  constructor(private escalationService: ApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  loadNotifications(): void {
    this.escalationService.getNotifications(this.userId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notifications = response.data;
          }
        }
      });
    
    this.escalationService.getUnreadCount(this.userId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.unreadCount = response.data;
          }
        }
      });
  }

  markAsRead(notificationId: string): void {
    this.escalationService.markNotificationAsRead(notificationId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadNotifications();
            this.notificationRead.emit(notificationId);
          }
        }
      });
  }

  markAllAsRead(): void {
    this.escalationService.markAllNotificationsAsRead(this.userId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadNotifications();
          }
        }
      });
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
}
