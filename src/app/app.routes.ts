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
import { WeeklyScheduleComponent } from './Components/weekly-schedule/weekly-schedule.component';
import { RealtimeUpdatesComponent } from './Components/realtime-updates/realtime-updates.component';
import { ResourceListComponent } from './Components/resource-list/resource-list.component';
import { VolunteerListComponent } from './Components/volunteer-list/volunteer-list.component';
import { DisasterEventFormComponent } from './Components/disaster-event-form/disaster-event-form.component';
import { DisasterEventListComponent } from './Components/disaster-event-list/disaster-event-list.component';
import { ResourceFormComponent } from './Components/resource-form/resource-form.component';
import { VolunteerFormComponent } from './Components/volunteer-form/volunteer-form.component';
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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent},
    {
    path: 'Admin',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'service-management', component: ServiceManagementComponent },
      { path: 'complaint-management', component: ComplaintManagementComponent },
      { path: 'notice-management', component: NoticeManagementComponent},
      {path:  'audit-and-logs',component:AuditAndLogsComponent},
      { path: 'appointment-management', component: AppointmentManagementComponent},
      { path: 'system-settings', component: SystemSettingsComponent },
      {path:  'staff-management',component:StaffManagementComponent},
      { path: 'citizen-management', component: CitizenManagementComponent },
      { path: 'poll-management', component: PollManagementComponent },
      { path: 'reports', component: ReportsComponent },
    ],
  },
  {
    path: 'ward',
    component: LayoutComponent,
    canActivate: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'service-request', component: ServiceRequestComponent },
      { path: 'complaints', component: ComplaintsComponent },
      { path: 'notices', component: StaffNoticesComponent},
      {path:'createPoll',component:CreatePollComponent},
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'settings', component: StaffSettingsComponent },
      {path:'polls',component:PollListComponent},

      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
      { path: 'service-request', component: ServiceRequestComponent, canActivate: [AuthGuardService] },
      { path: 'complaints', component: ComplaintsComponent, canActivate: [AuthGuardService] },
      { path: 'notices', component: StaffNoticesComponent, canActivate: [AuthGuardService]},
      { path: 'appointments', component: AppointmentsComponent, canActivate: [AuthGuardService] },
      { path: 'my-details', component: StaffDetailsComponent, canActivate: [AuthGuardService] },
      { path: 'settings', component: StaffSettingsComponent, canActivate: [AuthGuardService] }
    ],
  },
    {
    path: 'citizen',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'request-service', component: RequestServiceComponent },
      { path: 'my-details', component: MyDetailsComponent },
      { path: 'submit-complaint', component: SubmitComplaintComponent },
      { path: 'notices', component:CitizenNoticesComponent },
      { path: 'book-appointment', component: BookAppointmentComponent },
      { path: 'settings', component: CitizenSettingsComponent },
      {path:'polls',component:PollListComponent},
      {path:'vote/:id',component:VotePollComponent},
      {path:'polls/results/:id',component:PollResultsComponent},
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
      { path: 'request-service', component: RequestServiceComponent, canActivate: [AuthGuardService] },
      { path: 'my-details', component: MyDetailsComponent, canActivate: [AuthGuardService] },
      { path: 'submit-complaint', component: SubmitComplaintComponent, canActivate: [AuthGuardService] },
      { path: 'notices', component:CitizenNoticesComponent, canActivate: [AuthGuardService] },
      { path: 'book-appointment', component: BookAppointmentComponent, canActivate: [AuthGuardService] },
      { path: 'settings', component: CitizenSettingsComponent, canActivate: [AuthGuardService] },
    ],
  },
  { path: 'registerUser', component: UserRegisterComponent, pathMatch: 'full' },
  { path: 'navigate/:id', component: NavigateComponent },
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
  { path: 'disaster-events/:id/edit', component: DisasterEventFormComponent }
];
