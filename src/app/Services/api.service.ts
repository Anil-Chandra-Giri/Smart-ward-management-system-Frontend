import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../Models/service-request';
import { Login } from '../Models/login';


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
  
     requestService(request: ServiceRequest): Observable<any> {
    return this.http.post('https://localhost:7069/api/service-requests',request);
  }
  
 submitComplaint(complaintDetails: string, latitude: number | null, longitude: number | null): Observable<any> {
  const complaintData = {
    complaintDetails,
    latitude,
    longitude
  };
  return this.http.post('https://localhost:7069/api/submit-complaint', complaintData);
}
       requestReview(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/service-requests/{id}/review',id);
  }

       getService(id: any): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequestQuery/my');
  }
       uploadDocument(document: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/DocumentCommand/upload',document);
  }

       verifyDocument(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/DocumentCommand/{id}/verify',id);
  }
  
}
