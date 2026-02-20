import {Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { JwtPayload } from './jwtPayload/jwtpayload.module';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  jwtPayload: JwtPayload = new JwtPayload();
  constructor(private route:Router ) {}

  decodeToken(): JwtPayload {
    const token = localStorage.getItem('token');
    if (token != null) {
      this.jwtPayload = this.decodeJwt(token);
    }
    return this.jwtPayload;
  }
  decodeJwt(token: string): any {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
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
    localStorage.clear();
    this.route.navigateByUrl('');
  }
}

