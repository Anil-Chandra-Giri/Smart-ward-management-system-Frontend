// src/app/components/disaster-event-form/disaster-event-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../Services/api.service';
import { UpdateDisasterEvent, CreateDisasterEvent } from '../../Models/DisasterEvent.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-disaster-event-form',
  templateUrl: './disaster-event-form.component.html',
  styleUrls: ['./disaster-event-form.component.css'],
  imports:[ReactiveFormsModule, CommonModule]
})
export class DisasterEventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  eventId: string | null = null;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';

  eventTypes = [
    'Flood', 'Earthquake', 'Fire', 'Hurricane', 'Tornado', 
    'Tsunami', 'Landslide', 'Drought', 'Pandemic', 'Industrial Accident',
    'Transportation Accident', 'Terrorist Attack', 'Other'
  ];

  severityLevels = ['Low', 'Medium', 'High', 'Critical'];
  
  statusOptions = ['Active', 'Inactive', 'Completed'];

  constructor(
    private fb: FormBuilder,
    private disasterEventService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.eventForm = this.createForm();
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId && this.route.snapshot.url.toString().includes('edit');
    
    if (this.isEditMode && this.eventId) {
      this.loadEvent(this.eventId);
    } else {
      // Set default start date to today for new events
      this.eventForm.patchValue({
        startDate: this.formatDateForInput(new Date())
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      eventName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      eventType: ['', Validators.required],
      description: ['', Validators.maxLength(1000)],
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      severity: ['Medium', Validators.required],
      status: ['Active', Validators.required],
      affectedPeople: [0, [Validators.required, Validators.min(0)]],
      requiredResources: [''],
      coordinator: [''],
      contactNumber: ['', Validators.pattern('^[0-9+\-\s]*$')]
    });
  }

  loadEvent(id: string): void {
    this.loading = true;
    this.disasterEventService.getDisasterEvent(id).subscribe({
      next: (event) => {
        this.eventForm.patchValue({
          eventName: event.eventName,
          eventType: event.eventType,
          description: event.description,
          location: event.location,
          startDate: this.formatDateForInput(event.startDate),
          endDate: event.endDate ? this.formatDateForInput(event.endDate) : '',
          severity: event.severity,
          status: event.status,
          affectedPeople: event.affectedPeople,
          requiredResources: event.requiredResources,
          coordinator: event.coordinator,
          contactNumber: event.contactNumber
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading event details';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    // Validate end date is after start date if provided
    const startDate = new Date(this.eventForm.get('startDate')?.value);
    const endDate = this.eventForm.get('endDate')?.value ? new Date(this.eventForm.get('endDate')?.value) : null;
    
    if (endDate && endDate < startDate) {
      this.error = 'End date cannot be before start date';
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const formData = this.eventForm.value;

    if (this.isEditMode && this.eventId) {
      const updateData: UpdateDisasterEvent = {
        eventName: formData.eventName,
        eventType: formData.eventType,
        description: formData.description,
        location: formData.location,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        severity: formData.severity,
        status: formData.status,
        affectedPeople: formData.affectedPeople,
        requiredResources: formData.requiredResources,
        coordinator: formData.coordinator,
        contactNumber: formData.contactNumber
      };

      this.disasterEventService.updateDisasterEvent(this.eventId, updateData).subscribe({
        next: () => {
          this.successMessage = 'Event updated successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/disaster-events']);
          }, 2000);
        },
        error: (error) => {
          this.error = 'Error updating event';
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    } else {
      const createData: CreateDisasterEvent = {
        eventName: formData.eventName,
        eventType: formData.eventType,
        description: formData.description,
        location: formData.location,
        startDate: new Date(formData.startDate),
        severity: formData.severity,
        affectedPeople: formData.affectedPeople,
        requiredResources: formData.requiredResources,
        coordinator: formData.coordinator,
        contactNumber: formData.contactNumber
      };

      this.disasterEventService.createDisasterEvent(createData).subscribe({
        next: () => {
          this.successMessage = 'Event created successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/disaster-events']);
          }, 2000);
        },
        error: (error) => {
          this.error = 'Error creating event';
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
    const control = this.eventForm.get(field);
    return control ? control.hasError(error) && control.touched : false;
  }

  onCancel(): void {
    this.router.navigate(['/disaster-events']);
  }

  get today(): string {
    return this.formatDateForInput(new Date());
  }
}