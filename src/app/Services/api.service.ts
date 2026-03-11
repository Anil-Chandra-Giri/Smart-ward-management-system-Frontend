import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../Models/service-request';
import { Login } from '../Models/login';
import { Complaint } from '../Models/complaint';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

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

       requestReview(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/service-requests/{id}/review',id);
  }

       getAllService(UserId: any): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequest/GetAllRequestedServicesOfUser',{params: { userId: UserId }});
  }

  getAllServices(): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequest/GetAllRequestedServices');
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
  
}
