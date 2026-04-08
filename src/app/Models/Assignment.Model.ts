export interface Assignment {
  id: string;
  referenceId: string;
  referenceType: string;
  referenceNumber: string;
  title: string;
  description: string;
  assignedToOfficerId: string;
  assignedToOfficerName: string;
  assignedDate: Date;
  lastReminderDate?: Date;
  reminderCount: number;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  isEscalated: boolean;
  currentEscalationLevel?: number;
  priority: string;
  wardNumber: string;
}

export interface EscalatedTask {
  id: string;
  referenceId: string;
  referenceType: string;
  referenceNumber: string;
  title: string;
  description: string;
  originalOfficerName: string;
  originalOfficerId: string;
  escalatedToOfficerName: string;
  escalatedDate: Date;
  escalationLevel: number;
  daysPending: number;
  priority: string;
  wardNumber: string;
  isHighlighted: boolean;
}

export interface DashboardStats {
  totalTasks?: number;
  overdueTasks?: number;
  escalatedToMe?: number;
  pendingTasks?: number;
  recentReminders?: Assignment[];
  escalatedTasks?: EscalatedTask[];
  totalEscalated?: number;
  criticalTasks?: number;
  pendingReview?: number;
}