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
    let role = this.authService.decodeToken().Role;
    console.log(role);
    if(role=='Staff')
    {
      this.isStaff=true
    }
  }

  logout(): void {
    localStorage.removeItem('userToken');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
