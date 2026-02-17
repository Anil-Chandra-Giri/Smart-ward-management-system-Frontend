import {Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }
   getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role');
    }
    return null;
  }

   logout(): void {
    // Clear any authentication data, for example:
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    // Optionally, you could also handle any server-side logout logic if needed
    console.log('User logged out');
  }
}
