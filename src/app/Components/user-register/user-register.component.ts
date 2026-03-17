import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { response } from 'express';

@Component({
  selector: 'app-user-register',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent {
  registrationForm!: FormGroup;
  docdata : any;
  
  citizenshipFront: File | null = null;
  citizenshipBack: File | null = null;
  livePhoto: File | null = null;


  previews: { [key: string]: string | ArrayBuffer | null } = {
    front: null,
    back: null,
    live: null
  };

  constructor(private fb: FormBuilder, private apiService:ApiService, private router:Router)
  {
    this.registrationForm = this.fb.group({
      fullNameNepali: ['', Validators.required],
      fullNameEnglish: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender:[''],
      dateOfBirth:[''],
      phoneNumber:[''],
      citizenshipNumber:[''],
      citizenshipIssuedDate:[''],
      citizenshipIssuedDistrict:[''],
      nationalIdNumber:[''],
      permanentAddress:[''],
      temporaryAddress:[''],
      wardNumber:[''],
      municipality:[''],
      district:[''],
      province:[''],
      username:[''],
      passwordHash:[''],
      role:['citizen'],

      
    });
  }

    cleanField(value: string): string {
    return value ? value.replace(/[^अ-ह0-9\s]/g, '').trim() : '';
  }

  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (type === 'front') this.citizenshipFront = file;
    if (type === 'back') this.citizenshipBack = file;
    if (type === 'live') this.livePhoto = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previews[type] = reader.result; // This stores the image string
    };
    const data = new FormData();
    data.append('file',file);
    reader.readAsDataURL(file);
    this.apiService.scandocument(data).subscribe({
      next:(response)=>{
        const fields = response.fields;
        console.log("Document scanned");
        console.log(response);
        this.registrationForm.patchValue({
          fullNameNepali: fields.fullName,
          gender: fields.gender,
          dateOfBirth:fields.dateOfBirthBS,
          wardNumber:fields.ward,
          citizenshipNumber:fields.citizenshipNumber,
          district: fields.district,
          municipality: fields.municipality,})
      },error:(err)=>{
        console.error("Error scanning",err);
      }

    });
  }

  submitRegistration() {
    const formData = new FormData();

    Object.keys(this.registrationForm.controls).forEach(key => {
      formData.append(key, this.registrationForm.get(key)?.value);
    });

    if (this.citizenshipFront) formData.append('CitizenshipFront', this.citizenshipFront);
    if (this.citizenshipBack) formData.append('CitizenshipBack', this.citizenshipBack);
    if (this.livePhoto) formData.append('LivePhoto', this.livePhoto);

    this.apiService.createUser(formData)
      .subscribe({
        next: (res) => {
          alert('Registration Successful!');
          this.router.navigateByUrl('login');

        },
        error: (err) => console.error('Registration Failed', err)
      });
  }
  
}
