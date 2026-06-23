// src/app/components/volunteer-form/volunteer-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';
import { UpdateVolunteer } from '../../../../../Models/volunteer.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-volunteer-form',
  templateUrl: './volunteer-form.component.html',
  styleUrls: ['./volunteer-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class VolunteerFormComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() volunteerId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  volunteerForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  skillsList = [
    'First Aid', 'CPR', 'Search & Rescue', 'Fire Fighting', 
    'Medical', 'Driving', 'Cooking', 'Counseling', 
    'Translation', 'Administration', 'Logistics', 'Communication'
  ];

  availabilityOptions = [
    'Weekdays', 'Weekends', 'Mornings', 'Afternoons', 
    'Evenings', 'Full Time', 'Part Time', 'On Call'
  ];

  constructor(
    private fb: FormBuilder,
    private volunteerService: ApiService
  ) {
    this.volunteerForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.volunteerId) {
      this.loadVolunteer(this.volunteerId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s]+$')]],
      address: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      skills: [[]],
      availability: [[]],
      emergencyContact: ['', Validators.required],
      emergencyPhone: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s]+$')]],
      isActive: [true],
      profilePicture: ['']
    });
  }

  loadVolunteer(id: string): void {
    this.loading = true;
    this.volunteerService.getVolunteer(id).subscribe({
      next: (volunteer) => {
        const skillsArray = volunteer.skills ? volunteer.skills.split(',').map(s => s.trim()) : [];
        const availabilityArray = volunteer.availability ? volunteer.availability.split(',').map(a => a.trim()) : [];

        this.volunteerForm.patchValue({
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          email: volunteer.email,
          phoneNumber: volunteer.phoneNumber,
          address: volunteer.address,
          dateOfBirth: this.formatDateForInput(volunteer.dateOfBirth),
          skills: skillsArray,
          availability: availabilityArray,
          emergencyContact: volunteer.emergencyContact,
          emergencyPhone: volunteer.emergencyPhone,
          isActive: volunteer.isActive
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading volunteer details';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File too large. Maximum size is 2MB.');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.volunteerForm.invalid) {
      this.markFormGroupTouched(this.volunteerForm);
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const formValue = this.volunteerForm.value;
    const skillsString = Array.isArray(formValue.skills) ? formValue.skills.join(', ') : '';
    const availabilityString = Array.isArray(formValue.availability) ? formValue.availability.join(', ') : '';

    if (this.isEditMode && this.volunteerId) {
      const updateData: UpdateVolunteer = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        address: formValue.address,
        skills: skillsString,
        availability: availabilityString,
        isActive: formValue.isActive,
        emergencyContact: formValue.emergencyContact,
        emergencyPhone: formValue.emergencyPhone,
      };

      this.volunteerService.updateVolunteer(this.volunteerId, updateData).subscribe({
        next: () => {
          this.successMessage = 'Volunteer updated successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.saved.emit();
          }, 1500);
        },
        error: (error) => {
          this.error = 'Error updating volunteer: ' + (error.error?.message || 'Unknown error');
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    } else {
      const formData = new FormData();
      formData.append('firstName', formValue.firstName);
      formData.append('lastName', formValue.lastName);
      formData.append('email', formValue.email);
      formData.append('phoneNumber', formValue.phoneNumber);
      formData.append('address', formValue.address);
      formData.append('dateOfBirth', formValue.dateOfBirth);
      formData.append('skills', skillsString);
      formData.append('availability', availabilityString);
      formData.append('emergencyContact', formValue.emergencyContact);
      formData.append('emergencyPhone', formValue.emergencyPhone);

      if (this.selectedFile) {
        formData.append('profilePicture', this.selectedFile);
      }

      this.volunteerService.createVolunteer(formData).subscribe({
        next: () => {
          this.successMessage = 'Volunteer registered successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.saved.emit();
          }, 1500);
        },
        error: (error) => {
          this.error = 'Error registering volunteer';
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.volunteerForm.get(field);
    return control ? control.hasError(error) && control.touched : false;
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}