import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ServiceRequest } from '../Models/service-request';
import { Login } from '../Models/login';
import { Complaint } from '../Models/complaint';
import { Vote } from '../Models/vote.model';
import { Poll } from '../Models/Poll.Model';
import { PollCategory } from '../Models/poll-category';
import { NoticeCategory } from '../Models/Category';
import { Notice } from '../Models/notice';
import { WeeklySchedule, WasteCollectionRoute, CreateRoute, RouteStatusUpdate, Vehicle, Driver, RealtimeUpdate } from '../Models/WasteCollectionRoute';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'https://localhost:7069/api/WasteCollection';

  constructor(private http: HttpClient) { }

    createUser(signup: any): Observable<any> {
    return this.http.post(
      'https://localhost:7069/api/SignUp/Register',signup);
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

   getNotices():Observable<Notice[]>{
    return this.http.get<Notice[]>('https://localhost:7069/api/Notice/');
  }

  createNotice(data:FormData){
    return this.http.post('https://localhost:7069/api/Notice/',data);
  }

  deleteNotice(id:number){
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

  
}
