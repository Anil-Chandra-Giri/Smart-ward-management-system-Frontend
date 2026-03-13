import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../Models/service-request';
import { Login } from '../Models/login';
import { Notice } from '../Models/Notice';
import { NoticeCategory } from '../Models/Category';
import { Poll } from '../Models/Poll.Model';
import { Vote } from '../Models/vote.model';
import { PollCategory } from '../Models/poll-category';


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

    login(login: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/Login', login);
  }
  
     requestService(request: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/servicerequest',request);
  }
  
       requestReview(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/service-requests/{id}/review',id);
  }

       getAllService(UserId: any): Observable<any> {
    return this.http.get('https://localhost:7069/api/ServiceRequest/GetAllServices',{params: { userId: UserId }});
  }
       uploadDocument(document: any): Observable<any> {
    return this.http.post('https://localhost:7069/api/DocumentCommand/upload',document);
  }

       verifyDocument(id: any): Observable<any> {
    return this.http.put('https://localhost:7069/api/DocumentCommand/{id}/verify',id);
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
  
}
