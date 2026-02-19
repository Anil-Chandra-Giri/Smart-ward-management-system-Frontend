import { Component } from '@angular/core';
import { Login } from '../../Models/login';
import { AuthService } from '../../Services/auth.service';
import { ApiService } from '../../Services/api.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private authService: AuthService, private ApiCall: ApiService, private router: Router){}

 loginData : Login = new Login();
 isStaff: boolean = false;

 onLogin() {
  if (!this.loginData.username || !this.loginData.password) {
    console.error('Please enter both username and password.');
    return;
  }

  this.ApiCall.login(this.loginData).subscribe({
    next: (response) => {
      console.log('Login successful', response);
      const token = response.token
      console.log(token)
    
      if(this.isStaff==true)
      {
        this.router.navigateByUrl('ward/dashboard')
      }
      else
      {
        this.router.navigateByUrl('citizen/dashboard')

      }
    },
    error: (error) => {
      console.error('Login failed', error);
      if (error.status === 400) {
        alert('Invalid credentials. Please check your username and password.');
      } else {
        alert('An unexpected error occurred. Please try again later.');
      }
    }
  });
}

}
