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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent},
  {
    path: 'ward',
    component: LayoutComponent,
    canActivate: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'service-request', component: ServiceRequestComponent },
      { path: 'applications', component: ApplicationsComponent },
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
      {path:'polls/results/:id',component:PollResultsComponent}
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
];
