import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Add this interface for keyvalue pipe
interface KeyValuePair {
  key: string;
  value: any;
}

@Component({
  selector: 'app-user-register',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent implements OnInit, OnDestroy {
  @ViewChild('frontInput') frontInput!: ElementRef;
  @ViewChild('backInput') backInput!: ElementRef;
  @ViewChild('liveInput') liveInput!: ElementRef;
  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;

  registrationForm!: FormGroup;
  currentStep: number = 1;
  
  // Document files
  citizenshipFront: File | null = null;
  citizenshipBack: File | null = null;
  livePhoto: File | null = null;

  // Previews
  previews: { [key: string]: string | ArrayBuffer | null } = {
    front: null,
    back: null,
    live: null
  };

  // OCR related
  isOcrProcessing: boolean = false;
  ocrProgress: number = 0;
  ocrExtractedData: any = null;
  ocrError: string | null = null;
  extractedFields: Set<string> = new Set();
  frontProcessed: boolean = false;
  backProcessed: boolean = false;

  // OTP related
  registrationResponse: any = null;
  otpCode: string = '';
  isVerifying: boolean = false;
  isResending: boolean = false;
  isSubmitting: boolean = false;
  otpMessage: string = '';
  otpMessageType: 'success' | 'error' = 'success';
  otpTimer: number = 0;
  termsAccepted: boolean = false;
  
  // Camera related
  showCamera: boolean = false;
  cameraStream: any = null;
  isCameraSupported: boolean = true;
  
  private timerInterval: any;
  private ocrInterval: any;

  // Add this for Object.keys usage in template
  objectKeys = Object.keys;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService, 
    private router: Router
  ) {
    // Check if camera is supported
    this.isCameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

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
    return !!(this.citizenshipFront && this.citizenshipBack && this.livePhoto);
  }

  isStep2Valid(): boolean {
    const controls = [
      'fullNameEnglish', 'fullNameNepali', 'email', 'gender', 
      'dateOfBirth', 'phoneNumber', 'citizenshipNumber', 
      'citizenshipIssuedDate', 'citizenshipIssuedDistrict', 
      'permanentAddress', 'temporaryAddress', 'wardNumber', 
      'municipality', 'district', 'province', 'username', 'passwordHash'
    ];
    return controls.every(control => 
      this.registrationForm.get(control)?.valid || false
    );
  }

  isFieldExtracted(fieldName: string): boolean {
    return this.extractedFields.has(fieldName);
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

  // ==================== CAMERA METHODS ====================
  openCamera() {
    if (!this.isCameraSupported) {
      alert('Your browser does not support camera access. Please use the file upload option.');
      return;
    }
    
    this.showCamera = true;
    
    // Wait for DOM to update
    setTimeout(() => {
      this.startCamera();
    }, 100);
  }

  startCamera() {
    const video = this.videoElement?.nativeElement;
    
    if (!video) {
      console.error('Video element not found');
      return;
    }

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then((stream) => {
      this.cameraStream = stream;
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      console.error('Camera error:', err);
      alert('Could not access camera. Please use file upload instead.');
      this.showCamera = false;
    });
  }

  capturePhoto() {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;
    
    if (!video || !canvas) {
      console.error('Video or canvas element not found');
      return;
    }

    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        // Create a file from the blob
        const file = new File([blob], `live-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Set the file
        this.livePhoto = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          this.previews['live'] = reader.result;
        };
        reader.readAsDataURL(file);
      }
      
      // Stop camera and close modal
      this.stopCamera();
      this.showCamera = false;
    }, 'image/jpeg', 0.9);
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.cameraStream = null;
    }
  }

  closeCamera() {
    this.stopCamera();
    this.showCamera = false;
  }

  retakePhoto() {
    // Clear current photo
    this.livePhoto = null;
    this.previews['live'] = null;
    
    // Clear file input
    if (this.liveInput) {
      this.liveInput.nativeElement.value = '';
    }
    
    // Open camera again
    this.openCamera();
  }
  // ==================== END CAMERA METHODS ====================

  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('Please upload only JPEG or PNG images');
      this.clearFileInput(type);
      return;
    }

    if (file.size > maxSize) {
      alert('File size should be less than 5MB');
      this.clearFileInput(type);
      return;
    }

    // Set file based on type
    if (type === 'front') {
      this.citizenshipFront = file;
      this.frontProcessed = false;
    }
    if (type === 'back') {
      this.citizenshipBack = file;
      this.backProcessed = false;
    }
    if (type === 'live') this.livePhoto = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previews[type] = reader.result;
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsDataURL(file);

    // Automatically process OCR when images are uploaded
    if (type === 'front') {
      this.processSingleSide(file, 'front');
    } else if (type === 'back') {
      this.processSingleSide(file, 'back');
    }

    // If both sides are uploaded, process them together
    if (this.citizenshipFront && this.citizenshipBack && !this.frontProcessed && !this.backProcessed) {
      this.processBothSides();
    }
  }

  clearFileInput(type: string) {
    if (type === 'front' && this.frontInput) {
      this.frontInput.nativeElement.value = '';
      this.citizenshipFront = null;
      this.previews['front'] = null;
      this.frontProcessed = false;
    } else if (type === 'back' && this.backInput) {
      this.backInput.nativeElement.value = '';
      this.citizenshipBack = null;
      this.previews['back'] = null;
      this.backProcessed = false;
    } else if (type === 'live' && this.liveInput) {
      this.liveInput.nativeElement.value = '';
      this.livePhoto = null;
      this.previews['live'] = null;
    }
  }

  processSingleSide(file: File, side: 'front' | 'back') {
    this.isOcrProcessing = true;
    this.ocrProgress = 0;
    this.ocrError = null;
    
    // Simulate OCR progress
    this.ocrInterval = setInterval(() => {
      if (this.ocrProgress < 90) {
        this.ocrProgress += 10;
      }
    }, 200);

    const formData = new FormData();
    formData.append('file', file);

    this.apiService.scandocument(formData).subscribe({
      next: (response: any) => {
        clearInterval(this.ocrInterval);
        
        if (side === 'front') {
          this.frontProcessed = true;
        } else {
          this.backProcessed = true;
        }

        // Store the extracted data
        if (!this.ocrExtractedData) {
          this.ocrExtractedData = {};
        }
        
        if (response.fields) {
          Object.assign(this.ocrExtractedData, response.fields);
        }

        this.ocrProgress = 100;
        
        setTimeout(() => {
          this.isOcrProcessing = false;
          this.mapOcrDataToForm(this.ocrExtractedData);
          
          if (this.frontProcessed && this.backProcessed) {
            this.ocrError = null;
            alert('Both sides processed successfully!');
          }
        }, 500);
      },
      error: (err) => {
        clearInterval(this.ocrInterval);
        this.isOcrProcessing = false;
        
        if (side === 'front') {
          this.frontProcessed = false;
        } else {
          this.backProcessed = false;
        }

        console.error(`OCR Error for ${side} side:`, err);
        this.ocrError = `Failed to process ${side} side. You can still fill the form manually.`;
      }
    });
  }

  processBothSides() {
    if (!this.citizenshipFront || !this.citizenshipBack) {
      alert('Please upload both front and back of citizenship');
      return;
    }

    this.isOcrProcessing = true;
    this.ocrProgress = 0;
    this.ocrError = null;
    
    // Simulate progress
    this.ocrInterval = setInterval(() => {
      if (this.ocrProgress < 90) {
        this.ocrProgress += 5;
      }
    }, 200);

    // Create FormData with both files
    const formData = new FormData();
    formData.append('frontFile', this.citizenshipFront);
    formData.append('backFile', this.citizenshipBack);

    // Call your API endpoint
    this.apiService.scanBothSides?.(formData).subscribe({
      next: (response: any) => {
        clearInterval(this.ocrInterval);
        this.ocrProgress = 100;
        
        setTimeout(() => {
          this.isOcrProcessing = false;
          
          if (response.success && response.fields) {
            this.ocrExtractedData = response.fields;
            this.mapOcrDataToForm(response.fields);
            this.frontProcessed = true;
            this.backProcessed = true;
            this.ocrError = null;
            
            const fieldCount = Object.keys(response.fields).length;
            alert(`Successfully extracted ${fieldCount} fields from both sides!`);
          }
        }, 500);
      },
      error: (err) => {
        clearInterval(this.ocrInterval);
        this.isOcrProcessing = false;
        this.ocrError = 'Failed to process documents. Please fill the form manually.';
        console.error('OCR Error:', err);
      }
    });
  }

  mapOcrDataToForm(fields: any) {
    if (!fields) return;

    const fieldMapping: {[key: string]: string} = {
      fullName: 'fullNameNepali',
      fullNameEnglish: 'fullNameEnglish',
      gender: 'gender',
      dateOfBirth: 'dateOfBirth',
      dateOfBirthBS: 'dateOfBirth',
      ward: 'wardNumber',
      wardNumber: 'wardNumber',
      citizenshipNumber: 'citizenshipNumber',
      citizenshipNo: 'citizenshipNumber',
      citizenshipIssuedDistrict: 'citizenshipIssuedDistrict',
      issuedDistrict: 'citizenshipIssuedDistrict',
      citizenshipIssuedDate: 'citizenshipIssuedDate',
      issuedDate: 'citizenshipIssuedDate',
      permanentAddress: 'permanentAddress',
      address: 'permanentAddress',
      municipality: 'municipality',
      district: 'district',
      province: 'province'
    };

    // Clear previous extracted fields
    this.extractedFields.clear();

    // Update form with extracted data
    Object.keys(fieldMapping).forEach(ocrField => {
      const formField = fieldMapping[ocrField];
      if (fields[ocrField] && fields[ocrField].trim() !== '') {
        let value = fields[ocrField].trim();
        
        // Clean the value
        value = this.cleanFieldValue(value);
        
        // Special handling for specific fields
        if (formField === 'gender') {
          value = this.normalizeGender(value);
        } else if (formField === 'dateOfBirth') {
          value = this.normalizeDate(value);
        }
        
        this.registrationForm.patchValue({
          [formField]: value
        });
        this.extractedFields.add(formField);
      }
    });

    // Show success message
    if (this.extractedFields.size > 0) {
      console.log(`Extracted ${this.extractedFields.size} fields:`, Array.from(this.extractedFields));
    }
  }

  cleanFieldValue(value: string): string {
    if (!value) return '';
    // Remove extra spaces and special characters
    return value.replace(/\s+/g, ' ').trim();
  }

  normalizeGender(gender: string): string {
    const genderLower = gender.toLowerCase();
    if (genderLower.includes('male') || genderLower.includes('पुरुष')) {
      return 'Male';
    } else if (genderLower.includes('female') || genderLower.includes('महिला')) {
      return 'Female';
    } else if (genderLower.includes('other') || genderLower.includes('अन्य')) {
      return 'Other';
    }
    return gender;
  }

  normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Try to format date to YYYY-MM-DD
    try {
      // If it's in DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  getFieldLabel(fieldKey: string): string {
    const labels: {[key: string]: string} = {
      fullName: 'Full Name',
      fullNameEnglish: 'Name (English)',
      fullNameNepali: 'Name (Nepali)',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      dateOfBirthBS: 'Date of Birth (BS)',
      citizenshipNumber: 'Citizenship No',
      citizenshipIssuedDistrict: 'Issued District',
      citizenshipIssuedDate: 'Issued Date',
      permanentAddress: 'Permanent Address',
      wardNumber: 'Ward No',
      municipality: 'Municipality',
      district: 'District',
      province: 'Province'
    };
    return labels[fieldKey] || fieldKey;
  }

  processAndGoToStep2() {
    if (!this.isStep1Valid()) {
      alert('Please upload all required documents.');
      return;
    }

    // If there's an OCR error but user wants to proceed manually
    if (this.ocrError && (!this.frontProcessed || !this.backProcessed)) {
      if (confirm('Document processing had issues. Do you want to continue with manual entry?')) {
        this.nextStep();
      }
    } else {
      this.nextStep();
    }
  }

  submitRegistration() {
    // Validate form
    if (this.registrationForm.invalid) {
      const invalidFields = [];
      const controls = this.registrationForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidFields.push(name);
        }
      }
      alert(`Please fill all required fields correctly. Missing: ${invalidFields.join(', ')}`);
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

    // Append files with proper names
    if (this.citizenshipFront) {
      formData.append('CitizenshipFront', this.citizenshipFront, this.citizenshipFront.name);
    }
    if (this.citizenshipBack) {
      formData.append('CitizenshipBack', this.citizenshipBack, this.citizenshipBack.name);
    }
    if (this.livePhoto) {
      formData.append('LivePhoto', this.livePhoto, this.livePhoto.name);
    }

    // Add metadata
    formData.append('ocrUsed', this.ocrExtractedData ? 'true' : 'false');

    this.apiService.createUser(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.registrationResponse = res;
        this.currentStep = 4;
        this.startOtpTimer(600);
        this.showOtpMessage('OTP has been sent to your email!', 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Registration Failed', err);
        
        let errorMessage = 'Registration failed. ';
        if (err.error && err.error.message) {
          errorMessage += err.error.message;
        } else if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
      }
    });
  }

  // OTP Methods
  verifyOtp() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.showOtpMessage('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    this.isVerifying = true;
    const verificationData = {
      userId: this.registrationResponse?.userId,
      otpCode: this.otpCode
    };

    this.apiService.verifyEmail(verificationData).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        this.showOtpMessage('Email verified successfully! Redirecting to login...', 'success');
        this.stopOtpTimer();
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isVerifying = false;
        this.showOtpMessage(err.error?.message || 'Verification failed. Please try again.', 'error');
        this.otpCode = '';
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
        this.startOtpTimer(600);
        this.otpCode = '';
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
    
    setTimeout(() => {
      this.otpMessage = '';
    }, 5000);
  }

  startOtpTimer(seconds: number) {
    this.otpTimer = seconds;
    this.stopOtpTimer();
    
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

  // Add this method to safely get field label
getSafeFieldLabel(key: unknown): string {
  if (typeof key === 'string') {
    return this.getFieldLabel(key);
  }
  return String(key);
}

  ngOnDestroy() {
    this.stopOtpTimer();
    if (this.ocrInterval) {
      clearInterval(this.ocrInterval);
    }
    this.stopCamera();
  }
}