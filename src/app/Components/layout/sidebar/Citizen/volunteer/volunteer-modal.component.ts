import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-volunteer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './volunteer-modal.component.html',
})
export class VolunteerModalComponent implements OnInit {
  @Input() disasterEventId!: string;
  @Input() eventName: string = '';
  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private apiService: ApiService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName:        ['', [Validators.required, Validators.maxLength(100)]],
      lastName:         ['', [Validators.required, Validators.maxLength(100)]],
      email:            ['', [Validators.required, Validators.email]],
      phoneNumber:      ['', [Validators.required]],
      dateOfBirth:      [''],
      address:          [''],
      skills:           [''],
      availability:     [''],
      emergencyContact: [''],
      emergencyPhone:   [''],
      notes:            [''],
    });
  }

  get f() { return this.form.controls; }

  close(): void {
    this.form.reset();
    this.error = '';
    this.closed.emit();
  }

  submit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.error = '';

  const payload = {
    ...this.form.value,
    disasterEventId: this.disasterEventId,
  };

  this.apiService.selfRegisterVolunteer(payload).subscribe({
    next: (res) => {
      this.loading = false;
      alert(res.message); // or use a toast notification
      this.registered.emit();
      this.close();
    },
    error: (err) => {
      this.loading = false;
      this.error = err?.error?.message ?? 'Registration failed. Please try again.';
    }
  });
}
}