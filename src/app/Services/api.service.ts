import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Resource } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Login } from '../Models/login';
import { Vote } from '../Models/vote.model';
import { Poll } from '../Models/Poll.Model';
import { PollCategory } from '../Models/poll-category';
import { NoticeCategory } from '../Models/Category';
import { Resource as ResourceModel, CreateResource, UpdateResource } from '../Models/resource.model';
import { Notice } from '../Models/notice';
import { WeeklySchedule, WasteCollectionRoute, CreateRoute, RouteStatusUpdate, Vehicle, Driver, RealtimeUpdate } from '../Models/WasteCollectionRoute';
import { DisasterEvent, CreateDisasterEvent, UpdateDisasterEvent } from '../Models/DisasterEvent.model';
// import { CreateResource, UpdateResource } from '../Models/resource.model';
import { Volunteer, CreateVolunteer, UpdateVolunteer } from '../Models/volunteer.model';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'https://localhost:7069/api/WasteCollection';

  constructor(private http: HttpClient, private authService:AuthService) { }

    createUser(signup: any): Observable<any> {
    return this.http.post(
      'https://localhost:7069/api/SignUp/Register',signup);
  }

   verifyEmail(data: { userId: string, otpCode: string }) {
    return this.http.post(`https://localhost:7069/api/SignUp/VerifyEmail`, data);
  }

  resendOtp(data: { email: string }) {
    return this.http.post(`https://localhost:7069/api/SignUp/ResendOTP`, data);
  }
  
    createStaff(newStaff: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/SignUp/Register',newStaff);
  }

    login(login: Login): Observable<any> {
    return this.http.post('https://localhost:7069/api/Login', login);
  }
  
     requestService(request: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/servicerequest',request);
  }
  
    submitComplaint(complaintData: any): Observable<any> {
      return this.http.post('https://localhost:7069/api/Complaint/RegisterComplaint', complaintData);
    }

    getComplaints(UserId:any):Observable<any>{
      return this.http.get('https://localhost:7069/api/Complaint/Complaints', {params: { userId: UserId }});
    }

    getAllComplaints():Observable<any>{
      return this.http.get('https://localhost:7069/api/Complaint/GetAllComplaints');
    }

    updateComplaintStatus(data:any): Observable<any>{
  return this.http.put('https://localhost:7069/api/Complaint/update-status',data);
}

       requestReview(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/service-requests/{id}/review',id);
  }

       getAllService(UserId: any): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequest/GetAllRequestedServicesOfUser',{params: { userId: UserId }});
  }

  getAllServices(): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequest/GetAllRequestedServices');
  }

  updateServiceRequest(id: string, payload: any): Observable<any> {
  return this.http.put(`https://localhost:7069/api/ServiceRequest/${id}`, payload);
}

// Delete a service request
deleteServiceRequest(id: string): Observable<any> {
  return this.http.delete(`https://localhost:7069/api/ServiceRequest/${id}`);
}

  updateServiceStatus(data:any): Observable<any>{
  return this.http.put('https://localhost:7069/api/ServiceRequest/update-status',data);
}

  
       uploadDocument(document: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/DocumentCommand/upload',document);
  }

       verifyDocument(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/DocumentCommand/{id}/verify',id);
  }

  bookAppointment(appointment:any):Observable<any> {
    return this.http.post('https://localhost:7069/api/Appointment/book',appointment)
  }

   getAllAppointments(): Observable<any> {
    return this.http.get('https://localhost:7069/api/Appointment/GetAllAppointments');
  }

  getMyAppointments(UserId:string): Observable<any> {
    return this.http.get('https://localhost:7069/api/Appointment/MyAppointments',{params: { userId: UserId }});
  }

   getNotices():Observable<any>{
    return this.http.get<any>('https://localhost:7069/api/Notice/');
  }

  createNotice(data:FormData){
    return this.http.post('https://localhost:7069/api/Notice/',data);
  }

  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`https://localhost:7069/api/SignUp/GetUserProfile/${userId}`);
  }

  // Get profile picture URL
  // getProfilePictureUrl(userId: string): string {
  //   return `https://localhost:7069/api/SignUp/GetProfilePicture/${userId}?t=${new Date().getTime()}`;
  // }
  getDirectProfilePictureUrl(profilePicturePath: string): string {
  if (!profilePicturePath) return 'https://i.pravatar.cc/40';
  
  // Remove leading slash if present
  const path = profilePicturePath.startsWith('/') 
    ? profilePicturePath.substring(1) 
    : profilePicturePath;
  
  // Add timestamp to prevent caching
  return `https://localhost:7069/${path}?t=${new Date().getTime()}`;
}

  // Get stored profile picture path or return default
  // getUserProfilePicture(): string {
  //   const profilePic = localStorage.getItem('userProfilePicture');
  //   const userId = this.authService.decodeToken()?.UserId;
    
  //   if (profilePic && userId) {
  //     return this.getProfilePictureUrl(userId);
  //   }
  //   return 'https://i.pravatar.cc/40'; // Default avatar
  // }

updateNotice(id: string, formData: FormData): Observable<any> {
  return this.http.put(`https://localhost:7069/api/Notice/${id}`, formData);
}

deleteNotice(id: string): Observable<any> {
  return this.http.delete(`https://localhost:7069/api/Notice/${id}`);
}

  getCategories():Observable<NoticeCategory[]>{
    return this.http.get<NoticeCategory[]>('https://localhost:7069/api/NoticeCategory/')
  }

  addCategory(category:any){
    return this.http.post('https://localhost:7069/api/NoticeCategory/',category)
  }

   getPollCategories():Observable<PollCategory[]>{
    return this.http.get<PollCategory[]>(`https://localhost:7069/api/Poll/categories`)
  }

  createPollCategory(name:string){
    return this.http.post('https://localhost:7069/api/Poll/categories',{name})
  }

  getActivePolls():Observable<Poll[]>{
    return this.http.get<Poll[]>(`https://localhost:7069/api/Poll/active`)
  }

  createPoll(data:any){
    return this.http.post(`https://localhost:7069/api/Poll/create`,data)
  }

  vote(vote:Vote){
    return this.http.post(`https://localhost:7069/api/Poll/vote`,vote)
  }

  getResults(pollId:string){
    return this.http.get(`https://localhost:7069/api/Poll/${pollId}/results`)
  }

  getWeeklySchedule(startDate: Date): Observable<WeeklySchedule> {
    const formattedDate = startDate.toISOString().split('T')[0];
    return this.http.get<WeeklySchedule>(`${this.apiUrl}/routes/weekly?startDate=${formattedDate}`);
  }

  getMonthlySchedule(year: number, month: number): Observable<WasteCollectionRoute[]> {
    return this.http.get<WasteCollectionRoute[]>(`${this.apiUrl}/routes/monthly?year=${year}&month=${month}`);
  }

  getRoute(id: string): Observable<WasteCollectionRoute> {
    return this.http.get<WasteCollectionRoute>(`${this.apiUrl}/routes/${id}`);
  }

  createRoute(route: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/routes`, route, {
    responseType: 'text' // Temporarily get as text to see what's being returned
  }).pipe(
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
    return this.http.put<void>(`${this.apiUrl}/routes/${routeId}/status`, statusUpdate);
  }

  deleteRoute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/routes/${id}`);
  }

  // Vehicle Management
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`);
  }

  getAvailableVehicles(date: Date): Observable<Vehicle[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles/available?date=${formattedDate}`);
  }

  updateVehicleLocation(vehicleId: string, latitude: number, longitude: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/vehicles/location`, {
      vehicleId,
      latitude,
      longitude
    });
  }

  // Driver Management
  getAvailableDrivers(date: Date): Observable<Driver[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<Driver[]>(`${this.apiUrl}/drivers/available?date=${formattedDate}`);
  }

  // Real-time Updates
  getRealtimeUpdates(): Observable<RealtimeUpdate[]> {
    return this.http.get<RealtimeUpdate[]>(`${this.apiUrl}/realtime-updates`);
  }

  getAssignedRoutes(driverId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/drivers/${driverId}/routes`);
  }

  // Start route
  startRoute(routeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/routes/${routeId}/status`, {
      routeId: routeId,
      status: 2 // InProgress
    });
  }

  // Complete collection point
  completeCollectionPoint(pointId: string, wasteQuantity: number, notes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/collection-points/${pointId}/complete`, {
      wasteQuantity: wasteQuantity,
      notes: notes
    });
  }

  // Report delay
  reportDelay(routeId: string, delayReason: string, delayMinutes: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/routes/${routeId}/status`, {
      routeId: routeId,
      status: 4, // Delayed
      delayReason: delayReason,
      delayMinutes: delayMinutes
    });
  }

  // Complete route
  completeRoute(routeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/routes/${routeId}/status`, {
      routeId: routeId,
      status: 3 // Completed
    });
  }

  private volunteerapiUrl = `https://localhost:7069/api/Volunteers`;

    getVolunteers(): Observable<Volunteer[]> {
    return this.http.get<Volunteer[]>(this.volunteerapiUrl);
  }

  getVolunteer(id: string): Observable<Volunteer> {
    return this.http.get<Volunteer>(`${this.volunteerapiUrl}/${id}`);
  }

  createVolunteer(volunteer: FormData): Observable<Volunteer> {
    return this.http.post<Volunteer>(this.volunteerapiUrl, volunteer);
  }

  updateVolunteer(id: string, volunteer: UpdateVolunteer): Observable<void> {
    return this.http.put<void>(`${this.volunteerapiUrl}/${id}`, volunteer);
  }

  deleteVolunteer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.volunteerapiUrl}/${id}`);
  }

   
  private resourcesapiUrl = `https://localhost:7069/api/Resources`;

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

   private disasterapiUrl = `https://localhost:7069/api/DisasterEvents`;


  getDisasterEvents(): Observable<DisasterEvent[]> {
    return this.http.get<DisasterEvent[]>(this.disasterapiUrl);
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



   scandocument(previews:any): Observable<any> {
    return this.http.post('https://localhost:7069/api/Ocr/scan',previews);
  }

  scanBothSides(formData: FormData): Observable<any> {
  return this.http.post('https://localhost:7069/api/Ocr/scan-both-sides', formData);
}

  getOfficerAssignments(officerId: string): Observable<any> {
    return this.http.get(`https://localhost:7069/api/FollowUp/officer-assignments/${officerId}`);
  }

  getEscalatedTasks(adminId: string): Observable<any> {
    return this.http.get(`https://localhost:7069/api/FollowUp/escalated-tasks/${adminId}`);
  }

  sendReminder(reminder: any): Observable<any> {
    return this.http.post(`https://localhost:7069/api/FollowUp/send-reminder`, reminder);
  }

  escalateTask(assignmentId: string, reason: string): Observable<any> {
    return this.http.post(`https://localhost:7069/api/FollowUp/escalate/${assignmentId}`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getDashboardStats(userId: string, role: string): Observable<any> {
    return this.http.get(`https://localhost:7069/api/FollowUp/dashboard-stats/${userId}?role=${role}`);
  }

   markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put(`https://localhost:7069/api/FollowUp/Notification/mark-read/${notificationId}`, {});
  }

  markAllNotificationsAsRead(userId: string): Observable<any> {
    return this.http.put(`https://localhost:7069/api/FollowUp/Notification/mark-all-read/${userId}`, {});
  }

  getUnreadCount(userId: string): Observable<any> {
    return this.http.get(`https://localhost:7069/api/FollowUp/Notification/unread-count/${userId}`);
  }

   getNotifications(userId: string, unreadOnly: boolean = false): Observable<any> {
    const params = new HttpParams().set('unreadOnly', unreadOnly.toString());
    return this.http.get(`https://localhost:7069/api/FollowUp/Notification/user/${userId}`, { params });
  }
 
}
