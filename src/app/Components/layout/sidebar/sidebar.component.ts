import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    isStaff: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}
    ngOnInit(): void {
    // this.isStaff = this.authService.getUserRole() === 'staff';
     console.log('isStaff:', this.isStaff)
  }

  logout(): void {
    localStorage.removeItem('userToken');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
