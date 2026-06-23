import { Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { DashboardComponent } from './Components/layout/dashboard/dashboard.component';
import { LayoutComponent } from './Components/layout/layout.component';
import { UserRegisterComponent } from './Components/user-register/user-register.component';
import { ServiceRequestComponent } from './Components/layout/sidebar/Staff/service-request/service-request.component';
import { ComplaintsComponent } from './Components/layout/sidebar/Staff/complaints/complaints.component';
import { AppointmentsComponent } from './Components/layout/sidebar/Staff/appointments/appointments.component';
import { MyDetailsComponent } from './Components/layout/sidebar/Citizen/my-details/my-details.component';
import { SubmitComplaintComponent } from './Components/layout/sidebar/Citizen/submit-complaint/submit-complaint.component';
import { BookAppointmentComponent } from './Components/layout/sidebar/Citizen/book-appointment/book-appointment.component';
import { CitizenSettingsComponent } from './Components/layout/sidebar/Citizen/citizen-settings/citizen-settings.component';
import { CitizenNoticesComponent } from './Components/layout/sidebar/Citizen/citizen-notices/citizen-notices.component';
import { StaffSettingsComponent } from './Components/layout/sidebar/Staff/staff-settings/staff-settings.component';
import { StaffNoticesComponent } from './Components/layout/sidebar/Staff/staff-notices/staff-notices.component';
import { RequestServiceComponent } from './Components/layout/sidebar/Citizen/request-service/request-service.component';
import { HomeComponent } from './Components/home/home.component';
import { CreatePollComponent } from './Components/layout/sidebar/Staff/create-poll/create-poll.component';
import { VotePollComponent } from './Components/layout/sidebar/Citizen/vote-poll/vote-poll.component';
import { PollResultsComponent } from './Components/layout/sidebar/Citizen/poll-results/poll-results.component';
import { PollListComponent } from './Components/layout/sidebar/Citizen/poll-list/poll-list.component';
import { AuthGuardService } from './Services/auth-guard.service';
import { StaffDetailsComponent } from './Components/layout/sidebar/Staff/staff-details/staff-details.component';
import { NavigateComponent } from './Components/navigate/navigate.component';
import { RoutePlanningComponent } from './Components/route-planning/route-planning.component';
import { WeeklyScheduleComponent } from './Components/layout/sidebar/Staff/weekly-schedule/weekly-schedule.component';
import { RealtimeUpdatesComponent } from './Components/realtime-updates/realtime-updates.component';
import { ResourceListComponent } from './Components/resource-list/resource-list.component';
import { VolunteerListComponent } from './Components/layout/sidebar/Staff/volunteer-list/volunteer-list.component';
import { ResourceFormComponent } from './Components/resource-form/resource-form.component';
import { VolunteerFormComponent } from './Components/layout/sidebar/Staff/volunteer-form/volunteer-form.component';
import { ServiceManagementComponent } from './Components/layout/sidebar/admin/service-management/service-management.component';
import { ComplaintManagementComponent } from './Components/layout/sidebar/admin/complaint-management/complaint-management.component';
import { NoticeManagementComponent } from './Components/layout/sidebar/admin/notice-management/notice-management.component';
import { AuditAndLogsComponent } from './Components/layout/sidebar/admin/audit-and-logs/audit-and-logs.component';
import { AppointmentManagementComponent } from './Components/layout/sidebar/admin/appointment-management/appointment-management.component';
import { SystemSettingsComponent } from './Components/layout/sidebar/admin/system-settings/system-settings.component';
import { StaffManagementComponent } from './Components/layout/sidebar/admin/staff-management/staff-management.component';
import { CitizenManagementComponent } from './Components/layout/sidebar/admin/citizen-management/citizen-management.component';
import { PollManagementComponent } from './Components/layout/sidebar/admin/poll-management/poll-management.component';
import { ReportsComponent } from './Components/layout/sidebar/admin/reports/reports.component';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard.component';
import { DisasterEventFormComponent } from './Components/layout/sidebar/Staff/disaster-event-form/disaster-event-form.component';
import { DisasterEventListComponent } from './Components/layout/sidebar/Staff/disaster-event-list/disaster-event-list.component';
import { EscalationDashboardComponent } from './Components/layout/sidebar/Staff/escalation-dashboard/escalation-dashboard.component';
import { OfficerDashboardComponent } from './Components/officer-dashboard/officer-dashboard.component';
import { EscalationManagementComponent } from './Components/layout/sidebar/admin/escalation-management/escalation-management.component';

import { ChangePasswordComponent } from './Components/layout/sidebar/Staff/change-password/change-password.component';
import { firstLoginGuard } from './Guards/first-login.guard';
import { VerifyCitizenComponent } from './Components/layout/sidebar/Staff/verify-citizen/verify-citizen.component';
import { PendingVerificationComponent } from './Components/pending-verification/pending-verification.component';
import { verifiedGuard } from './Guards/verifiedGuard';

export const routes: Routes = [
  // Public
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registerUser', component: UserRegisterComponent, pathMatch: 'full' },

  // ← NEW: staff land here after first login; accessible only while token exists
  { path: 'change-password', component: ChangePasswordComponent },

  // Admin — firstLoginGuard added so staff can't bypass change-password by typing URL
  {
    path: 'Admin',
    component: LayoutComponent,
    canActivate: [firstLoginGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'service-management', component: ServiceRequestComponent },
      { path: 'complaint-management', component: ComplaintsComponent },
      { path: 'notice-management', component: StaffNoticesComponent},
      { path: 'audit-and-logs', component: AuditAndLogsComponent },
      { path: 'appointment-management', component: AppointmentsComponent },
      { path: 'system-settings', component: SystemSettingsComponent },
      { path: 'staff-management', component: StaffManagementComponent },
      { path: 'citizen-management', component: CitizenManagementComponent },
      { path: 'poll-management', component: PollListComponent },
      { path: 'escalation-management', component: EscalationManagementComponent, data: { roles: ['Officer', 'SeniorOfficer', 'Admin', 'SuperAdmin'] } },
      { path: 'reports', component: ReportsComponent },
    ],
  },

  // Ward / Staff — both guards applied
  {
    path: 'ward',
    component: LayoutComponent,
    canActivate: [AuthGuardService, firstLoginGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'verify-citizen', component: VerifyCitizenComponent },
      { path: 'service-request', component: ServiceRequestComponent },
      { path: 'complaints', component: ComplaintsComponent },
      { path: 'notices', component: StaffNoticesComponent },
      { path: 'createPoll', component: CreatePollComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'settings', component: StaffSettingsComponent },
      { path: 'polls', component: PollListComponent },
      { path: 'polls/results/:id', component: PollResultsComponent },
      { path: 'my-details', component: StaffDetailsComponent },
      { path: 'route-planning', component: RoutePlanningComponent },
      { path: 'weekly-schedule', component: WeeklyScheduleComponent },
      { path: 'realtime-updates', component: RealtimeUpdatesComponent },
      { path: 'volunteers', component: VolunteerListComponent },
      { path: 'volunteers/new', component: VolunteerFormComponent },
      { path: 'volunteers/:id', component: VolunteerFormComponent },
      { path: 'volunteers/:id/edit', component: VolunteerFormComponent },
      { path: 'resources', component: ResourceListComponent },
      { path: 'resources/new', component: ResourceFormComponent },
      { path: 'resources/:id', component: ResourceFormComponent },
      { path: 'resources/:id/edit', component: ResourceFormComponent },
      { path: 'disaster-events', component: DisasterEventListComponent },
      { path: 'disaster-events/new', component: DisasterEventFormComponent },
      { path: 'disaster-events/:id', component: DisasterEventFormComponent },
      { path: 'disaster-events/:id/edit', component: DisasterEventFormComponent },
      { path: 'escalation-dashboard', component: EscalationDashboardComponent, data: { roles: ['Officer', 'SeniorOfficer', 'Admin', 'SuperAdmin'] } },
    ],
  },

  // Citizen — firstLoginGuard added
  {
    path: 'citizen',
    component: LayoutComponent,
    canActivate: [firstLoginGuard], // ← added
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {path: 'pending-verification', component: PendingVerificationComponent },
      { path: 'notices', component: CitizenNoticesComponent },
      { path: 'polls/results/:id', component: PollResultsComponent },
      { path: 'weekly-schedule', component: WeeklyScheduleComponent },
      { path: 'resources', component: ResourceListComponent },
      { path: 'disaster-events', component: DisasterEventListComponent },
      { path: 'request-service', component: RequestServiceComponent, canActivate: [verifiedGuard] },
    { path: 'my-details', component: MyDetailsComponent, canActivate: [verifiedGuard] },
    { path: 'submit-complaint', component: SubmitComplaintComponent, canActivate: [verifiedGuard] },
    { path: 'book-appointment', component: BookAppointmentComponent, canActivate: [verifiedGuard] },
    { path: 'settings', component: CitizenSettingsComponent, canActivate: [verifiedGuard] },
    { path: 'polls', component: PollListComponent, canActivate: [verifiedGuard] },
    { path: 'vote/:id', component: VotePollComponent, canActivate: [verifiedGuard] },
    { path: 'volunteers/new', component: VolunteerFormComponent, canActivate: [verifiedGuard] },
    { path: 'volunteers', component: VolunteerListComponent, canActivate: [verifiedGuard] },
    { path: 'disaster-events/new', component: DisasterEventFormComponent, canActivate: [verifiedGuard] },
    ],
  },

  { path: 'navigate/:id', component: NavigateComponent },

  {
    path: 'officer-dashboard',
    component: OfficerDashboardComponent,
    canActivate: [firstLoginGuard], // ← added
    data: { roles: ['Officer', 'SeniorOfficer'] }
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [firstLoginGuard], // ← added
    data: { roles: ['Admin', 'SuperAdmin'] }
  },
];