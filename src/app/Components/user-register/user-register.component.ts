import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-register',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  currentStep: number = 1;
  
  citizenshipFront: File | null = null;
  citizenshipBack: File | null = null;
  livePhoto: File | null = null;

  previews: { [key: string]: string | ArrayBuffer | null } = {
    front: null,
    back: null,
    live: null
  };

  // OTP related properties
  registrationResponse: any = null;
  otpCode: string = '';
  isVerifying: boolean = false;
  isResending: boolean = false;
  isSubmitting: boolean = false;
  otpMessage: string = '';
  otpMessageType: 'success' | 'error' = 'success';
  otpTimer: number = 0;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registrationForm = this.fb.group({
      fullNameNepali: ['', Validators.required],
      fullNameEnglish: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      citizenshipNumber: ['', Validators.required],
      citizenshipIssuedDate: ['', Validators.required],
      citizenshipIssuedDistrict: ['', Validators.required],
      nationalIdNumber: [''],
      permanentAddress: ['', Validators.required],
      temporaryAddress: ['', Validators.required],
      wardNumber: ['', Validators.required],
      municipality: ['', Validators.required],
      district: ['', Validators.required],
      province: ['', Validators.required],
      username: ['', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      role: ['citizen']
    });
  }

  isStep1Valid(): boolean {
    const controls = [
      'fullNameEnglish', 'fullNameNepali', 'email', 'gender', 
      'dateOfBirth', 'phoneNumber', 'citizenshipNumber', 
      'citizenshipIssuedDate', 'citizenshipIssuedDistrict', 
      'permanentAddress', 'temporaryAddress', 'wardNumber', 
      'municipality', 'district', 'province', 'username', 'passwordHash'
    ];
    return controls.every(control => 
      this.registrationForm.get(control)?.valid
    );
  }

  isStep2Valid(): boolean {
    return !!(this.citizenshipFront && this.citizenshipBack && this.livePhoto);
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'front') this.citizenshipFront = file;
      if (type === 'back') this.citizenshipBack = file;
      if (type === 'live') this.livePhoto = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.previews[type] = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitRegistration() {
    if (this.registrationForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!this.isStep2Valid()) {
      alert('Please upload all required documents.');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();

    // Append form controls
    Object.keys(this.registrationForm.controls).forEach(key => {
      const value = this.registrationForm.get(key)?.value;
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    // Append files
    if (this.citizenshipFront) formData.append('CitizenshipFront', this.citizenshipFront);
    if (this.citizenshipBack) formData.append('CitizenshipBack', this.citizenshipBack);
    if (this.livePhoto) formData.append('LivePhoto', this.livePhoto);

    this.apiService.createUser(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.registrationResponse = res;
        this.currentStep = 4; // Move to OTP step
        this.startOtpTimer(600); // 10 minutes in seconds
        this.showOtpMessage('OTP has been sent to your email!', 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Registration Failed', err);
        alert(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  // OTP Verification Methods
  verifyOtp() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.showOtpMessage('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    this.isVerifying = true;
    const verificationData = {
      userId: this.registrationResponse.userId,
      otpCode: this.otpCode
    };

    this.apiService.verifyEmail(verificationData).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        this.showOtpMessage('Email verified successfully! Redirecting to login...', 'success');
        this.stopOtpTimer();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigateByUrl('login');
        }, 2000);
      },
      error: (err) => {
        this.isVerifying = false;
        this.showOtpMessage(err.error?.message || 'Verification failed. Please try again.', 'error');
        this.otpCode = ''; // Clear OTP field on error
      }
    });
  }

  resendOtp() {
    if (!this.registrationResponse?.email) return;

    this.isResending = true;
    const resendData = {
      email: this.registrationResponse.email
    };

    this.apiService.resendOtp(resendData).subscribe({
      next: (res: any) => {
        this.isResending = false;
        this.showOtpMessage('New OTP has been sent to your email!', 'success');
        this.startOtpTimer(600); // Reset timer to 10 minutes
        this.otpCode = ''; // Clear OTP field
      },
      error: (err) => {
        this.isResending = false;
        this.showOtpMessage(err.error?.message || 'Failed to resend OTP. Please try again.', 'error');
      }
    });
  }

  showOtpMessage(message: string, type: 'success' | 'error') {
    this.otpMessage = message;
    this.otpMessageType = type;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      this.otpMessage = '';
    }, 5000);
  }

  startOtpTimer(seconds: number) {
    this.otpTimer = seconds;
    this.stopOtpTimer(); // Clear any existing timer
    
    this.timerInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      } else {
        this.stopOtpTimer();
      }
    }, 1000);
  }

  stopOtpTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  ngOnDestroy() {
    this.stopOtpTimer();
  }
}