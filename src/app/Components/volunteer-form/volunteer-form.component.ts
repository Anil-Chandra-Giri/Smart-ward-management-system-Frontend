// src/app/components/volunteer-form/volunteer-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../Services/api.service';
import { UpdateVolunteer, CreateVolunteer } from '../../Models/volunteer.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-volunteer-form',
  templateUrl: './volunteer-form.component.html',
  styleUrls: ['./volunteer-form.component.css'],
  imports:[CommonModule,ReactiveFormsModule]
})
export class VolunteerFormComponent implements OnInit {
  volunteerForm: FormGroup;
  isEditMode = false;
  volunteerId: string | null = null;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';

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
    private volunteerService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.volunteerForm = this.createForm();
  }

  ngOnInit(): void {
    this.volunteerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.volunteerId && this.route.snapshot.url.toString().includes('edit');
    
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
      skills: [[]], // Initialize as empty array for multiple select
      availability: [[]], // Initialize as empty array for multiple select
      emergencyContact: ['', Validators.required],
      emergencyPhone: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s]+$')]],
      isActive: [true]
    });
  }

  loadVolunteer(id: string): void {
    this.loading = true;
    this.volunteerService.getVolunteer(id).subscribe({
      next: (volunteer) => {
        // Split the skills string back into array if it's a string
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

  onSubmit(): void {
    if (this.volunteerForm.invalid) {
      this.markFormGroupTouched(this.volunteerForm);
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const formData = this.volunteerForm.value;

    // Convert arrays to comma-separated strings for the backend
    const skillsString = Array.isArray(formData.skills) ? formData.skills.join(', ') : '';
    const availabilityString = Array.isArray(formData.availability) ? formData.availability.join(', ') : '';

    if (this.isEditMode && this.volunteerId) {
      const updateData: UpdateVolunteer = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        skills: skillsString,
        availability: availabilityString,
        isActive: formData.isActive,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone
      };

      console.log('Sending update data:', updateData); // For debugging

      this.volunteerService.updateVolunteer(this.volunteerId, updateData).subscribe({
        next: () => {
          this.successMessage = 'Volunteer updated successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/volunteers']);
          }, 2000);
        },
        error: (error) => {
          this.error = 'Error updating volunteer: ' + (error.error?.message || 'Unknown error');
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    } else {
      const createData: CreateVolunteer = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        dateOfBirth: new Date(formData.dateOfBirth),
        skills: skillsString,
        availability: availabilityString,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone
      };

      console.log('Sending create data:', createData); // For debugging

      this.volunteerService.createVolunteer(createData).subscribe({
        next: () => {
          this.successMessage = 'Volunteer registered successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/volunteers']);
          }, 2000);
        },
        error: (error) => {
          this.error = 'Error registering volunteer: ' + (error.error?.message || 'Unknown error');
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
    this.router.navigate(['/volunteers']);
  }
}