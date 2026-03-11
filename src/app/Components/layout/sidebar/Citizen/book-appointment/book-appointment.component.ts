import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-book-appointment',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent {
  appointmentForm!: FormGroup;
  showModal = false;

  constructor(private fb: FormBuilder, private apiCallService:ApiService) {
    this.appointmentForm = this.fb.group({
      citizenName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      serviceType: ['', Validators.required],
      wardNumber: ['', Validators.required],
      appointmentTime: ['', Validators.required]
    });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.appointmentForm.reset();
  }

  submitForm() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    console.log(this.appointmentForm.value);

    // TODO: Call your API here
    this.apiCallService.bookAppointment(this.appointmentForm.value).subscribe(res=>{
      console.log(res);
    },
    err=>{
      console.log(err);
    }
  
  )

    this.closeModal();
  }
}
