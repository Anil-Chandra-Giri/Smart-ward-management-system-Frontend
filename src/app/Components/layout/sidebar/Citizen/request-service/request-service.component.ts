import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../Services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import NepaliDate from 'nepali-date-converter';
ModuleRegistry.registerModules([AllCommunityModule]);

const StatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'In Review',
  3: 'Approved',
  4:'Rejected'
};
const ServiceType:any={
  1: 'Birth Certificate',
  2: 'Death Certificate',
  3: 'Recommendation Letter',
  4: 'Property Document',
  5: 'Marriage Registration',
  6: 'Migration Certificate',
  7: 'Address Verification'
}
const PriorityLevels:any={
  0: 'Normal',
  1:'Urgent'
}
@Component({
  selector: 'app-request-service',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, AgGridAngular],
  templateUrl: './request-service.component.html',
  styleUrl: './request-service.component.css'
})
export class RequestServiceComponent implements OnInit {
  requestForm!: FormGroup;
  pageSize=7;
  public rowData: any[] = [];
  isBrowser = false;
  isModalOpen:boolean = false ;


columnDefs:ColDef[]=[
    {field: 'applicationNumber', headerName: 'Appliction Number', flex: 1, filter: true },
    {field:'serviceType',headerName:'Service Type',flex:1, filter:true,
      valueFormatter: (params) => {
    return ServiceType[params.value] ?? 'Unknown';
  }

    },
    {field:'purpose',headerName:'Purpose', flex:1, filter:true},
    {field:'requestedWard', headerName:'Requested Ward', flex:1, filter:true},
    {field:'status', headerName:'Status', flex:1, filter:true,
cellRenderer: (params: any) => {
    const colorMap: Record<number,string> = {
      1:'orange',
      2:'blue',
      3:'green',
      4:'red'
    };

    const labels: Record<number,string> = {
      1:'Pending',
      2:'In Review',
      3:'Approved',
      4:'Rejected'
    };

    return `<span style="color:${colorMap[params.value]}; font-weight:bold;">
            ${labels[params.value]}
            </span>`;
  }
    },
    {field:'priorityLevel', headerName:'Priority Level', flex:1, filter:true,
      cellRenderer:(params:any)=>{
        const text = PriorityLevels[params.value]??'Unknown'
        let color = '#666';
        if (params.value === 0) color = 'Green';
        if (params.value === 1) color = 'Red';
        return `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
      }
  },
    {field:'createdAt', headerName:'Submitted On', flex:1, filter:true,
        valueFormatter: (params) => {
    if (!params.value) return '';
    
    try {
      const adDate = new Date(params.value);
      const bsDate = new NepaliDate(adDate);
      
      // Returns format: 2082/11/20 (Year/Month/Day)
      return bsDate.format('YYYY/MM/DD'); 
    } catch (e) {
      return params.value; // Fallback to original if conversion fails
    }
  }

    },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) =>
      {
        return `
        <button class="btn btn-sm btn-outline-primary me-2" data-action="view">
          <i class="bi bi-pencil"></i> View
        </button>
            <button class="btn btn-sm btn-outline-primary me-2" data-action="edit">
        <i class="bi bi-pencil"></i> Edit
      </button>
      <button class="btn btn-sm btn-outline-danger" data-action="delete">
        <i class="bi bi-trash"></i> Delete
      </button>
        `;
      },
      onCellClicked: (params: any) => {
    const action = params.event.target.getAttribute('data-action') || 
                   params.event.target.parentElement.getAttribute('data-action');
    
    if (action === 'edit') {
      //this.getStaffById(params.data.id);
    } else if (action === 'delete') {
      //this.deleteStaff(params.data.id);
    }
  }
    }
  ]

ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  this.listRequestedServices();
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

  constructor(private fb: FormBuilder, private authService:AuthService, private router:Router, private apiService:ApiService,@Inject(PLATFORM_ID) private platformId: Object) {}

  get selectedService(): number {
    return Number(this.requestForm.get('ServiceType')?.value);
  }

  toggleModal(show:boolean){
    this.isModalOpen=show;
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
          this.listRequestedServices();
          this.isModalOpen = false
          this.resetFormToDefaults();
          alert("Service Request Submitted Successfully! Ref: " + res.reference);
        },
        error: (err) => {
          console.error("Submission Error:", err);
          alert("Failed to submit request: " + (err.error?.message || "Server Error"));
        }
      });
    }

}

listRequestedServices(){
  const UserId=this.authService.decodeToken().UserId;
  if(UserId==null)
  {
    alert("Login First");
  }
  else{
    this.apiService.getAllService(UserId).subscribe(
      res=>{
        this.rowData=res;
        console.log(res);
      },
      err=>{
        console.log(err);
      }
    )
  }
}
}
