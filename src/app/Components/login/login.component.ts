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

  onLogin() {

    this.ApiCall.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful', response);

        // if (role === 'Employer') {
        //     this.router.navigateByUrl('Company/dashboard');
        //   } else if (role === 'Candidate') {
        //     if (currentUrl === '/' || currentUrl.includes('home')) {
        //       this.dialogRef?.close({ success: true, fromHome: true });
        //     } else {
        //       this.router.navigateByUrl('Candidate/dashboard');
        //     }
        //   }

        //   alert('Login Successful');
        // }
      },
      error: (error) => {
        console.error('Login failed', error);
      }
    });
  }

}
