import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  
  isStaff = false;
  isCitizen = false;
  isAdmin = true;
  isBrowser = false;
  userName: string = '';
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = this.authService.decodeToken();
        if (decodedToken) {
          this.userRole = decodedToken.Role;
          this.userName = decodedToken.UserName;
          
          // Set role flags
          this.isAdmin = this.userRole === 'Admin' || this.userRole === 'admin';
          this.isStaff = this.userRole === 'Staff' || this.userRole === 'staff';
          this.isCitizen = this.userRole === 'Citizen' || this.userRole === 'citizen';
          
          console.log('Sidebar - User role:', this.userRole);
        }
      }
    } catch (error) {
      console.error('Error loading user data in sidebar:', error);
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }
}