import { Component } from '@angular/core';
import { Login } from '../../Models/login';
import { AuthService } from '../../Services/auth.service';
import { ApiService } from '../../Services/api.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtPayload } from '../../Services/jwtPayload/jwtpayload.module';

interface CustomJwtPayload extends JwtPayload {
  role: string;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!:FormGroup;
  constructor(private fb: FormBuilder,private authService: AuthService, private ApiCall: ApiService, private router: Router){
    this.loginForm=this.fb.group({
      Username:['',Validators.required],
      Password:['',Validators.required]
    });
  }

 

  onLogin() {
     
    this.ApiCall.login(this.loginForm.value).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
          const role = this.authService.decodeToken().Role;
          if(role=="citizen")
          {
            this.router.navigateByUrl("citizen");
          }
          else{
            this.router.navigateByUrl("ward");
          }
      },
      error: (error) => {
        console.error('Login failed', error);
      }
    });
  }
}



