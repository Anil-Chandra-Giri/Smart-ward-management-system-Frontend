import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../Models/service-request';
import { SignUp } from '../Models/sign-up';
import { Login } from '../Models/login';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

    createUser(signup: SignUp): Observable<any> {
    return this.http.post(
      'https://localhost:7008/api/UsersCommand/CreateUser',signup);
  }
  
    createStaff(newStaff: any): Observable<any> {
    return this.http.post('https://localhost:7008/api/Staff/CreateStaff',newStaff);
  }

    login(login: Login): Observable<any> {
    return this.http.post('https://localhost:7008/api/LoginQuery/login', login);
  }
  
     requestService(request: ServiceRequest): Observable<any> {
    return this.http.post('https://localhost:7008/api/service-requests',request);
  }
  
       requestReview(id: any): Observable<any> {
    return this.http.put('https://localhost:7008/api/service-requests/{id}/review',id);
  }

       getService(id: any): Observable<any> {
    return this.http.get('https://localhost:7008/api/ServiceRequestQuery/my');
  }
       uploadDocument(document: any): Observable<any> {
    return this.http.post('https://localhost:7008/api/DocumentCommand/upload',document);
  }

       verifyDocument(id: any): Observable<any> {
    return this.http.put('https://localhost:7008/api/DocumentCommand/{id}/verify',id);
  }
  
}
