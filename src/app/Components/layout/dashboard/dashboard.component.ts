import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
    isStaff: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    let role = this.authService.decodeToken().Role;
    console.log(role);
    if(role=='Staff')
    {
      this.isStaff=true
    }
  }

}
