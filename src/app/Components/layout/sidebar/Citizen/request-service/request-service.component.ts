import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-request-service',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './request-service.component.html',
  styleUrl: './request-service.component.css'
})
export class RequestServiceComponent implements OnInit {
requestForm!: FormGroup;
ngOnInit(): void {
  this.requestForm = this.fb.group({
      ServiceType: ['', Validators.required],
      Purpose: ['', Validators.required],
      Description: ['', Validators.required],
      RequestedWard: ['', Validators.required],
      RequestedMunicipality: ['', Validators.required],
      PriorityLevel: ['0'],
      SubmissionMode: ['Online'],
      Remarks: [''],

      // Birth Fields
      ChildFullName: [''], DateOfBirth: [''], Gender: [''], PlaceOfBirth: [''],
      FatherFullName: [''], MotherFullName: [''], GrandfatherFullName: [''],

      // Death Fields
      DeceasedFullName: [''], DateOfDeath: [''], PlaceOfDeath: [''], 
      CauseOfDeath: [''], RelationshipToApplicant: [''], CitizenshipNoOfDeceased: [''],

      // Recommendation Fields
      LetterCategory: [''], RecipientOrganization: [''],

      // Property Fields
      PlotNumber: [''], SheetNumber: [''], TotalArea: [''], 
      PropertyType: [''], CurrentOwnerName: [''], LandRevenueReceiptNumber: [''],

      // Marriage Fields
      GroomFullName: [''], BrideFullName: [''], MarriageDate: [''], 
      MarriageVenue: [''], GroomCitizenshipNo: [''], BrideCitizenshipNo: [''],

      // Migration Fields
      MigrationType: ['Incoming'], OriginAddress: [''], DestinationAddress: [''], 
      TotalFamilyMembersMoving: [1], ReasonForMigration: [''],

      // Address Fields
      HouseNumber: [''], StreetName: [''], YearsOfStay: ['']
    });
}

private resetFormToDefaults() {
  this.requestForm.reset({
    // Re-generate the Application Number
    ApplicationNumber: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
    // Reset the dropdowns to their default values
    ServiceType: '',
    PriorityLevel: '0',
    SubmissionMode: 'Online',
    MigrationType: 'Incoming',
    TotalFamilyMembersMoving: 1
  });
}

serviceOptions = [
    { value: 7, label: 'Birth Certificate' },
    { value: 1, label: 'Death Certificate' },
    { value: 2, label: 'Recommendation Letter' },
    { value: 3, label: 'Property Document' },
    { value: 4, label: 'Marriage Registration' },
    { value: 5, label: 'Migration Certificate' },
    { value: 6, label: 'Address Verification' }
  ];

  constructor(private fb: FormBuilder, private authService:AuthService, private router:Router, private apiService:ApiService) {}

  get selectedService(): number {
    return Number(this.requestForm.get('ServiceType')?.value);
  }

  

  onSubmit() {
    if (this.requestForm.valid) {
      const userId = this.authService.decodeToken().UserId;
      if (!userId) {
        alert("Session expired. Please login again.");
        this.router.navigate(['/login']);
        return;
      }

      const formRawValue = { ...this.requestForm.value };

    // Clean empty strings to null so C# DateTime? doesn't break
    Object.keys(formRawValue).forEach(key => {
      if (formRawValue[key] === '') {
        formRawValue[key] = null;
      }
    });
      const payload = { 
        ...formRawValue,
        UserId: userId 
      };


      this.apiService.requestService(payload).subscribe({
        next: (res) => {
          console.log("Success:", res);
          alert("Service Request Submitted Successfully! Ref: " + res.reference);
          this.resetFormToDefaults();
        },
        error: (err) => {
          console.error("Submission Error:", err);
          alert("Failed to submit request: " + (err.error?.message || "Server Error"));
        }
      });
    }

}}
