import { Component } from '@angular/core';
import { AuthService } from '../../Services/auth.service';
import { ApiService } from '../../Services/api.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '../../Services/local-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private ApiCall: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    this.loginForm = this.fb.group({
      Username: ['', Validators.required],
      Password: ['', Validators.required]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.ApiCall.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.localStorageService.setItem('token', res.token); // ← uses LocalStorageService so interceptor reads it correctly

        // Staff on their first login must change their temporary password
        if (res.isFirstLogin) {
          this.router.navigateByUrl('change-password');
          return;
        }

        // Normal role-based routing
        const role = this.authService.decodeToken().Role;
        if (role === 'citizen') {
          this.router.navigateByUrl('citizen');
        } else if (role === 'Admin' || role === 'SuperAdmin') {
          this.router.navigateByUrl('Admin');
        } else if (role === 'Officer' || role === 'SeniorOfficer') {
          this.router.navigateByUrl('officer-dashboard');
        } else {
          this.router.navigateByUrl('ward');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}