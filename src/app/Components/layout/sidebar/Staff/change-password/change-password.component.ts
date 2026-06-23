import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private ApiCall: ApiService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group(
      {
        CurrentPassword: ['', Validators.required],
        NewPassword: ['', [Validators.required, Validators.minLength(6)]],
        ConfirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPass = form.get('NewPassword')?.value;
    const confirmPass = form.get('ConfirmPassword')?.value;
    return newPass === confirmPass ? null : { passwordMismatch: true };
  }

  toggleVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { CurrentPassword, NewPassword, ConfirmPassword } = this.changePasswordForm.value;

    this.ApiCall.changePassword({ CurrentPassword, NewPassword, ConfirmPassword }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password changed successfully! Redirecting to login...';
        setTimeout(() => {
          localStorage.removeItem('token');
          this.router.navigateByUrl('login');
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to change password. Please try again.';
      }
    });
  }

  get passwordMismatch(): boolean {
    return this.changePasswordForm.hasError('passwordMismatch') &&
      !!this.changePasswordForm.get('ConfirmPassword')?.touched;
  }
}