import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-verification.component.html',
  styleUrl: './pending-verification.component.css'
})
export class PendingVerificationComponent {
  decoded: any;

  constructor(private authService: AuthService, private router: Router) {
    this.decoded = this.authService.decodeToken() as any;
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('login');
  }

  goToDashboard() {
    this.router.navigateByUrl('citizen/dashboard');
  }
}