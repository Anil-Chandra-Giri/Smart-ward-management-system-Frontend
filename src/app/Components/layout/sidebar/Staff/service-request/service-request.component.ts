import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import NepaliDate from 'nepali-date-converter';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';


const StatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
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
  selector: 'app-service-request',
  imports: [CommonModule,AgGridAngular],
  templateUrl: './service-request.component.html',
  styleUrl: './service-request.component.css'
})
export class ServiceRequestComponent implements OnInit{
pageSize = 7;
rowData: any[] = [];
isBrowser = true;

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
cellRenderer: (params:any) => {
    const text = StatusLabels[params.value] ?? 'Unknown';
    let color = '#666'; // Default Gray
    
    if (params.value === 1) color = 'orange'; // Pending
    if (params.value === 2) color = 'green';  // Approved
    if (params.value === 3) color = 'red';    // Rejected

    return `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
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

  constructor(private authService:AuthService, private apiService:ApiService){}

 ngOnInit(): void {
    this.listRequestedServices();
  }
  
  listRequestedServices(){
  const UserId=this.authService.decodeToken().UserId;
  if(UserId==null)
  {
    alert("Login First");
  }
 else{
    this.apiService.getAllServices().subscribe(
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
