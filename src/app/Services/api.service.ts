import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Login } from '../Models/login';
import { Vote } from '../Models/vote.model';
import { Poll } from '../Models/Poll.Model';
import { PollCategory } from '../Models/poll-category';
import { NoticeCategory } from '../Models/Category';
import { Resource as ResourceModel, CreateResource, UpdateResource } from '../Models/resource.model';
import { WeeklySchedule, WasteCollectionRoute, CreateRoute, RouteStatusUpdate, Vehicle, Driver, RealtimeUpdate } from '../Models/WasteCollectionRoute';
import { DisasterEvent, CreateDisasterEvent, UpdateDisasterEvent } from '../Models/DisasterEvent.model';
import { Volunteer, CreateVolunteer, UpdateVolunteer } from '../Models/volunteer.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Base API URLs
  private baseApiUrl = 'https://localhost:7069/api';
  private wasteApiUrl = 'https://localhost:7069/api/WasteCollection';
  private appointmentApiUrl = 'https://localhost:7069/api/Appointment';
  private authApiUrl = 'https://localhost:7069/api';
  private volunteerApiUrl = 'https://localhost:7069/api/Volunteer'

  constructor(private http: HttpClient, private authService: AuthService) { }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  login(login: Login): Observable<{
    token: string;
    expiration: string;
    isFirstLogin: boolean;
    user: {
      userId: number;
      username: string;
      email: string;
      role: string;
      wardNumber: number | null;
      fullName: string;
    };
  }> {
    return this.http.post<any>(`${this.authApiUrl}/Login`, login);
  }

  changePassword(data: { CurrentPassword: string; NewPassword: string; ConfirmPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/Login/ChangePassword`, data);
  }

  getPendingCitizens(): Observable<any[]> {
    return this.http.get<any[]>(`${this.authApiUrl}/CitizenVerification/pending`);
  }

  verifyCitizen(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/CitizenVerification/verify/${userId}`, {});
  }

  rejectCitizen(userId: string, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/CitizenVerification/reject/${userId}`, { reason });
  }

  // Citizen self-registration (creates volunteer + assignment in one call)
selfRegisterVolunteer(payload: any): Observable<any> {
  return this.http.post(`${this.volunteerApiUrl}/self-register`, payload);
}

// Admin use — assign an existing volunteer to an event
createVolunteerAssignment(payload: any): Observable<any> {
  return this.http.post(`${this.volunteerApiUrl}/VolunteerAssignments`, payload);
}

  // ─── User / Registration ─────────────────────────────────────────────────────

  createUser(signup: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/SignUp/Register`, signup);
  }

createVolunteer(payload: any): Observable<any> {
  return this.http.post(`${this.disasterapiUrl}/volunteers`, payload);
}

// createVolunteerAssignment(payload: any): Observable<any> {
//   return this.http.post(`${this.disasterapiUrl}/volunteer-assignments`, payload);
// }

  verifyEmail(data: { userId: string, otpCode: string }) {
    return this.http.post(`${this.authApiUrl}/SignUp/VerifyEmail`, data);
  }

  resendOtp(data: { email: string }) {
    return this.http.post(`${this.authApiUrl}/SignUp/ResendOTP`, data);
  }

  createStaff(newStaff: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/SignUp/Register`, newStaff);
  }

  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/SignUp/GetUserProfile/${userId}`);
  }

  getDirectProfilePictureUrl(profilePicturePath: string): string {
    if (!profilePicturePath) return 'https://i.pravatar.cc/40';
    const path = profilePicturePath.startsWith('/')
      ? profilePicturePath.substring(1)
      : profilePicturePath;
    return `https://localhost:7069/${path}?t=${new Date().getTime()}`;
  }

  // ─── Service Requests ────────────────────────────────────────────────────────

  requestService(request: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/servicerequest`, request);
  }

  getAllService(UserId: any): Observable<any> {
    return this.http.get(`${this.authApiUrl}/ServiceRequest/GetAllRequestedServicesOfUser`, { params: { userId: UserId } });
  }

  getAllServices(): Observable<any> {
    return this.http.get(`${this.authApiUrl}/ServiceRequest/GetAllRequestedServices`);
  }

  updateServiceRequest(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.authApiUrl}/ServiceRequest/${id}`, payload);
  }

  deleteServiceRequest(id: string): Observable<any> {
    return this.http.delete(`${this.authApiUrl}/ServiceRequest/${id}`);
  }

  updateServiceStatus(data: any): Observable<any> {
    return this.http.put(`${this.authApiUrl}/ServiceRequest/update-status`, data);
  }

  // Delete complaint
deleteComplaint(complaintId: string): Observable<any> {
  return this.http.delete(`https://localhost:7069/api/Complaint/${complaintId}`);
}

// Update complaint
updateComplaint(complaintId: string, data: any): Observable<any> {
  return this.http.put(`https://localhost:7069/api/Complaint/${complaintId}`, data);
}

// Update complaint with image
updateComplaintWithImage(complaintId: string, formData: FormData): Observable<any> {
  return this.http.put(`https://localhost:7069/api/Complaint/${complaintId}/with-image`, formData);
}

  // ─── Complaints ──────────────────────────────────────────────────────────────

  submitComplaint(complaintData: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/Complaint/RegisterComplaint`, complaintData);
  }

  getComplaints(UserId: any): Observable<any> {
    return this.http.get(`${this.authApiUrl}/Complaint/Complaints`, { params: { userId: UserId } });
  }

  getAllComplaints(): Observable<any> {
    return this.http.get(`${this.authApiUrl}/Complaint/GetAllComplaints`);
  }

  updateComplaintStatus(data: any): Observable<any> {
    return this.http.put(`${this.authApiUrl}/Complaint/update-status`, data);
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  uploadDocument(document: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/DocumentCommand/upload`, document);
  }

  verifyDocument(id: any): Observable<any> {
    return this.http.put(`${this.authApiUrl}/DocumentCommand/{id}/verify`, id);
  }

  // ─── Appointments ────────────────────────────────────────────────────────────
  // FIXED: Using the correct appointmentApiUrl

  bookAppointment(appointment: any): Observable<any> {
    return this.http.post(`${this.appointmentApiUrl}/book`, appointment);
  }

  getAllAppointments(): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/GetAllAppointments`);
  }

  getMyAppointments(UserId: string): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/MyAppointments`, { params: { userId: UserId } });
  }

  // FIXED: Get appointment by ID - Correct URL
  getAppointmentById(appointmentId: string): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/appointment/${appointmentId}`);
  }

  // FIXED: Cancel appointment
  cancelAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.appointmentApiUrl}/cancel/${appointmentId}`);
  }

  // FIXED: Update appointment
  updateAppointment(appointmentId: string, data: any): Observable<any> {
    return this.http.put(`${this.appointmentApiUrl}/update/${appointmentId}`, data);
  }

  // Get appointments by ward
  getAppointmentsByWard(wardNumber: number): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/appointments/ward/${wardNumber}`);
  }

  // Get queue statistics
  getQueueStatistics(wardNumber: number): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/queue/statistics/${wardNumber}`);
  }

  // Get queue by ward
  getQueueByWard(wardNumber: number): Observable<any> {
    return this.http.get(`${this.appointmentApiUrl}/queue/${wardNumber}`);
  }

  
  // Update queue status
  updateQueueStatus(tokenNumber: string, status: string): Observable<any> {
    return this.http.put(
      `${this.baseApiUrl}/queue/update/${tokenNumber}`,
      JSON.stringify(status),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ─── Notices ─────────────────────────────────────────────────────────────────

  getNotices(): Observable<any> {
    return this.http.get<any>(`${this.authApiUrl}/Notice/`);
  }

  createNotice(data: FormData) {
    return this.http.post(`${this.authApiUrl}/Notice/`, data);
  }

  updateNotice(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.authApiUrl}/Notice/${id}`, formData);
  }

  deleteNotice(id: string): Observable<any> {
    return this.http.delete(`${this.authApiUrl}/Notice/${id}`);
  }

  getCategories(): Observable<NoticeCategory[]> {
    return this.http.get<NoticeCategory[]>(`${this.authApiUrl}/NoticeCategory/`);
  }

  addCategory(category: any) {
    return this.http.post(`${this.authApiUrl}/NoticeCategory/`, category);
  }

  // ─── Polls ───────────────────────────────────────────────────────────────────

  getPollCategories(): Observable<PollCategory[]> {
    return this.http.get<PollCategory[]>(`${this.authApiUrl}/Poll/categories`);
  }

  createPollCategory(name: string) {
    return this.http.post(`${this.authApiUrl}/Poll/categories`, { name });
  }

  getActivePolls(): Observable<Poll[]> {
    return this.http.get<Poll[]>(`${this.authApiUrl}/Poll/active`);
  }

  createPoll(data: any) {
    return this.http.post(`${this.authApiUrl}/Poll/create`, data);
  }

  vote(vote: Vote) {
    return this.http.post(`${this.authApiUrl}/Poll/vote`, vote);
  }

  getResults(pollId: string) {
    return this.http.get(`${this.authApiUrl}/Poll/${pollId}/results`);
  }

  // ─── Waste Collection ────────────────────────────────────────────────────────

  getWeeklySchedule(startDate: Date): Observable<WeeklySchedule> {
    const formattedDate = startDate.toISOString().split('T')[0];
    return this.http.get<WeeklySchedule>(`${this.wasteApiUrl}/routes/weekly?startDate=${formattedDate}`);
  }

  getMonthlySchedule(year: number, month: number): Observable<WasteCollectionRoute[]> {
    return this.http.get<WasteCollectionRoute[]>(`${this.wasteApiUrl}/routes/monthly?year=${year}&month=${month}`);
  }

  getRoute(id: string): Observable<WasteCollectionRoute> {
    return this.http.get<WasteCollectionRoute>(`${this.wasteApiUrl}/routes/${id}`);
  }

  createRoute(route: any): Observable<any> {
    return this.http.post(`${this.wasteApiUrl}/routes`, route, { responseType: 'text' }).pipe(
      map(response => {
        try {
          return JSON.parse(response);
        } catch (e) {
          console.error('Response is not JSON:', response);
          throw new Error('Server returned non-JSON response');
        }
      })
    );
  }

  updateRouteStatus(routeId: string, statusUpdate: RouteStatusUpdate): Observable<void> {
    return this.http.put<void>(`${this.wasteApiUrl}/routes/${routeId}/status`, statusUpdate);
  }

  deleteRoute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.wasteApiUrl}/routes/${id}`);
  }

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.wasteApiUrl}/vehicles`);
  }

  getAvailableVehicles(date: Date): Observable<Vehicle[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<Vehicle[]>(`${this.wasteApiUrl}/vehicles/available?date=${formattedDate}`);
  }

  updateVehicleLocation(vehicleId: string, latitude: number, longitude: number): Observable<void> {
    return this.http.post<void>(`${this.wasteApiUrl}/vehicles/location`, { vehicleId, latitude, longitude });
  }

  getAvailableDrivers(date: Date): Observable<Driver[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<Driver[]>(`${this.wasteApiUrl}/drivers/available?date=${formattedDate}`);
  }

  getRealtimeUpdates(): Observable<RealtimeUpdate[]> {
    return this.http.get<RealtimeUpdate[]>(`${this.wasteApiUrl}/realtime-updates`);
  }

  getAssignedRoutes(driverId: string): Observable<any> {
    return this.http.get(`${this.wasteApiUrl}/drivers/${driverId}/routes`);
  }

  startRoute(routeId: string): Observable<any> {
    return this.http.put(`${this.wasteApiUrl}/routes/${routeId}/status`, { routeId, status: 2 });
  }

  completeCollectionPoint(pointId: string, wasteQuantity: number, notes: string): Observable<any> {
    return this.http.post(`${this.wasteApiUrl}/collection-points/${pointId}/complete`, { wasteQuantity, notes });
  }

  reportDelay(routeId: string, delayReason: string, delayMinutes: number): Observable<any> {
    return this.http.put(`${this.wasteApiUrl}/routes/${routeId}/status`, { routeId, status: 4, delayReason, delayMinutes });
  }

  completeRoute(routeId: string): Observable<any> {
    return this.http.put(`${this.wasteApiUrl}/routes/${routeId}/status`, { routeId, status: 3 });
  }

  // ─── Volunteers ──────────────────────────────────────────────────────────────

  private volunteerapiUrl = `${this.authApiUrl}/Volunteers`;

  getVolunteers(): Observable<Volunteer[]> {
    return this.http.get<Volunteer[]>(this.volunteerapiUrl);
  }

  getVolunteer(id: string): Observable<Volunteer> {
    return this.http.get<Volunteer>(`${this.volunteerapiUrl}/${id}`);
  }

  // createVolunteer(volunteer: FormData): Observable<Volunteer> {
  //   return this.http.post<Volunteer>(this.volunteerapiUrl, volunteer);
  // }

  updateVolunteer(id: string, volunteer: UpdateVolunteer): Observable<void> {
    return this.http.put<void>(`${this.volunteerapiUrl}/${id}`, volunteer);
  }

  deleteVolunteer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.volunteerapiUrl}/${id}`);
  }

  // ─── Resources ───────────────────────────────────────────────────────────────

  private resourcesapiUrl = `${this.authApiUrl}/Resources`;

  getResources(): Observable<ResourceModel[]> {
    return this.http.get<ResourceModel[]>(this.resourcesapiUrl);
  }

  getResourcesByType(type: string): Observable<ResourceModel[]> {
    return this.http.get<ResourceModel[]>(`${this.resourcesapiUrl}/type/${type}`);
  }

  getLowStockResources(): Observable<ResourceModel[]> {
    return this.http.get<ResourceModel[]>(`${this.resourcesapiUrl}/lowstock`);
  }

  getResource(id: string): Observable<ResourceModel> {
    return this.http.get<ResourceModel>(`${this.resourcesapiUrl}/${id}`);
  }

  createResource(resource: CreateResource): Observable<ResourceModel> {
    return this.http.post<ResourceModel>(this.resourcesapiUrl, resource);
  }

  updateResource(id: string, resource: UpdateResource): Observable<void> {
    return this.http.put<void>(`${this.resourcesapiUrl}/${id}`, resource);
  }

  updateQuantity(id: string, quantity: number): Observable<void> {
    return this.http.patch<void>(`${this.resourcesapiUrl}/${id}/quantity`, quantity);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resourcesapiUrl}/${id}`);
  }

  // ─── Disaster Events ─────────────────────────────────────────────────────────

  private disasterapiUrl = `${this.authApiUrl}/DisasterEvents`;

  getDisasterEvents(): Observable<DisasterEvent[]> {
    return this.http.get<DisasterEvent[]>(this.disasterapiUrl);
  }

  async registerAndAssign(payload: any): Promise<void> {
  // Step 1: Create the volunteer profile
  const volunteer = await firstValueFrom(
    this.http.post<Volunteer>(`${this.volunteerApiUrl}/api/volunteers`, {
      firstName:        payload.firstName,
      lastName:         payload.lastName,
      email:            payload.email,
      phoneNumber:      payload.phoneNumber,
      dateOfBirth:      payload.dateOfBirth,
      address:          payload.address,
      skills:           payload.skills,
      availability:     payload.availability,
      emergencyContact: payload.emergencyContact,
      emergencyPhone:   payload.emergencyPhone,
      profilePicture: "comming"
    })
  );

  // Step 2: Create the assignment linking volunteer → disaster event
  await firstValueFrom(
    this.http.post('/api/volunteer-assignments', {
      volunteerId:      volunteer.id,
      disasterEventId:  payload.disasterEventId,
      role:             'General Volunteer',
      status:           'Assigned',
      notes:            payload.notes,
    })
  );
}

  getActiveEvents(): Observable<DisasterEvent[]> {
    return this.http.get<DisasterEvent[]>(`${this.disasterapiUrl}/active`);
  }

  getDisasterEvent(id: string): Observable<DisasterEvent> {
    return this.http.get<DisasterEvent>(`${this.disasterapiUrl}/${id}`);
  }

  createDisasterEvent(event: CreateDisasterEvent): Observable<DisasterEvent> {
    return this.http.post<DisasterEvent>(this.disasterapiUrl, event);
  }

  updateDisasterEvent(id: string, event: UpdateDisasterEvent): Observable<void> {
    return this.http.put<void>(`${this.disasterapiUrl}/${id}`, event);
  }

  deleteDisasterEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.disasterapiUrl}/${id}`);
  }

  // ─── OCR ─────────────────────────────────────────────────────────────────────

  scandocument(previews: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/Ocr/scan`, previews);
  }

  scanBothSides(formData: FormData): Observable<any> {
    return this.http.post(`${this.authApiUrl}/Ocr/scan-both-sides`, formData);
  }

  // ─── Follow-up / Escalation ──────────────────────────────────────────────────

  getOfficerAssignments(officerId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/officer-assignments/${officerId}`);
  }

  getEscalatedTasks(adminId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/escalated-tasks/${adminId}`);
  }

  sendReminder(reminder: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/FollowUp/send-reminder`, reminder);
  }

  escalateTask(assignmentId: string, reason: string): Observable<any> {
    return this.http.post(`${this.authApiUrl}/FollowUp/escalate/${assignmentId}`,
      JSON.stringify(reason), { headers: { 'Content-Type': 'application/json' } });
  }

  getDashboardStats(userId: string, role: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/dashboard-stats/${userId}?role=${role}`);
  }

  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${this.authApiUrl}/FollowUp/Notification/mark-read/${notificationId}`, {});
  }

  markAllNotificationsAsRead(userId: string): Observable<any> {
    return this.http.put(`${this.authApiUrl}/FollowUp/Notification/mark-all-read/${userId}`, {});
  }

  getUnreadCount(userId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/Notification/unread-count/${userId}`);
  }

  getNotifications(userId: string, unreadOnly: boolean = false): Observable<any> {
    const params = new HttpParams().set('unreadOnly', unreadOnly.toString());
    return this.http.get(`${this.authApiUrl}/FollowUp/Notification/user/${userId}`, { params });
  }

  getAllOverdueTasks(): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/admin/all-overdue-tasks`);
  }

  trackComplaintStatus(complaintId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/citizen/track/${complaintId}`);
  }

  getStaffAssignments(staffId: string): Observable<any> {
    return this.http.get(`${this.authApiUrl}/FollowUp/staff-assignments/${staffId}`);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────

  getAllCitizens() {
    return this.http.get<RealtimeUpdate[]>(`${this.authApiUrl}/Citizens`);
  }

  getAllPolls() {
    return this.http.get<RealtimeUpdate[]>(`${this.authApiUrl}/Polls`);
  }

  getAllStaff() {
    return this.http.get<RealtimeUpdate[]>(`${this.authApiUrl}/Staff`);
  }

  requestReview(id: any): Observable<any> {
    return this.http.put(`${this.authApiUrl}/service-requests/{id}/review`, id);
  }

  getOverdueComplaints(days: number = 7) {
  return this.http.get<any>(`${this.authApiUrl}/Complaint/GetOverdueComplaints?days=${days}`);
}
}