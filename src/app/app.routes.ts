import { Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { DashboardComponent } from './Components/layout/dashboard/dashboard.component';
import { LayoutComponent } from './Components/layout/layout.component';
import { UserRegisterComponent } from './Components/user-register/user-register.component';
import { ServiceRequestComponent } from './Components/layout/sidebar/Staff/service-request/service-request.component';
import { ApplicationsComponent } from './Components/layout/sidebar/Staff/applications/applications.component';
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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'ward',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'service-request', component: ServiceRequestComponent },
      { path: 'applications', component: ApplicationsComponent },
      { path: 'complaints', component: ComplaintsComponent },
      { path: 'notices', component: StaffNoticesComponent},
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'settings', component: StaffSettingsComponent },
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
    ],
  },
  { path: 'registerUser', component: UserRegisterComponent, pathMatch: 'full' },
];
