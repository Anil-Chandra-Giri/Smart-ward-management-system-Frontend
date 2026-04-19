import {Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { JwtPayload } from './jwtPayload/jwtpayload.module';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  jwtPayload: JwtPayload = new JwtPayload();
  private userProfileSubject = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject.asObservable();
  constructor(private route:Router,@Inject(PLATFORM_ID) private platformId: Object ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  decodeToken(): JwtPayload {
    if (isPlatformBrowser(this.platformId)) {

      const token = localStorage.getItem('token');
      console.log("token",token);
      if (token) {
        this.jwtPayload = this.decodeJwt(token);
      }
    }

    return this.jwtPayload;
  }

    getCurrentUser(): any {
    // Only access localStorage in browser environment
    if (this.isBrowser) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }
    
    // Fallback to decode from token (also needs browser check)
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = this.decodeToken();
        if (decoded) {
          return decoded;
        }
      }
    }
    
    return null;
  }

  decodeJwt(token: string): any {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  }

  setUserProfile(profile: any) {
    this.userProfileSubject.next(profile);
    if (profile?.profilePicturePath) {
      localStorage.setItem('userProfilePicture', profile.profilePicturePath);
    }
  }

  getTokenExpirationDate(): Date {
    const decodedToken = this.decodeToken();
    if (decodedToken && decodedToken.exp) {
      const date = new Date();
      date.setUTCSeconds(decodedToken.exp);
      return date;
    } else {
      return new Date();
    }
  }

  isTokenExpired(): boolean {
    const tokenExpirationDate = this.getTokenExpirationDate();
    if (tokenExpirationDate) {
      return !(tokenExpirationDate.valueOf() > new Date().valueOf());
    } else {
      return false;
    }
  }

  logout() {
     if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.route.navigateByUrl('');
  }
  }
