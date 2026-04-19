import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import NepaliDate from 'nepali-date-converter';
import { ApiService } from '../../../../../Services/api.service';
import { AuthService } from '../../../../../Services/auth.service';

const StatusLabels: Record<number, string> = {
  1: 'Pending',
  2:'In Review',
  3: 'Approved',
  4: 'Rejected',
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
  selector: 'app-service-management',
  imports: [CommonModule,AgGridAngular, FormsModule],
  templateUrl: './service-management.component.html',
  styleUrl: './service-management.component.css'
})
export class ServiceManagementComponent implements OnInit{
pageSize = 7;
rowData: any[] = [];
isBrowser = true;

selectedService:any = null;
selectedStatus:number = 1;
showModal:boolean=false;

columnDefs:ColDef[]=[
    {field: 'applicationNumber', headerName: 'Appliction Number', flex: 1, filter: true },
    {field:'serviceType',headerName:'Service Type',flex:1, filter:true,
      valueFormatter: (params) => {
    return ServiceType[params.value] ?? 'Unknown';
  }

    },
    {field:'purpose',headerName:'Purpose', flex:1, filter:true},
    {field:'requestedWard', headerName:'Requested Ward', flex:1, filter:true},
    {
  field: 'status',
  headerName: 'Status',
  flex: 1,
  filter: true,
  editable: true,

  valueFormatter: (params: any) => {
    const labels: Record<number,string> = {
      1:'Pending',
      2:'In Review',
      3:'Approved',
      4:'Rejected'
    };
    return labels[params.value] ?? 'Unknown';
  },

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
  },
  cellEditorParams: {
    values: [1,2,3,4]
  },

  cellEditor: 'agSelectCellEditor',
  
  
  onCellValueChanged: (params: any) => {

    const newStatus = Number(params.newValue);
    const serviceId = params.data.serviceRequestId;

    if(newStatus !== params.oldValue){
      params.context.componentParent.updateStatusInline(serviceId, newStatus, params);
    }

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
  flex:1.5,
  cellRenderer: (params: any) =>
  {
    return `
    <div class="d-flex gap-2">
      <button class="btn btn-sm btn-outline-warning" data-action="view">
        <i class="bi bi-eye"></i> View
      </button>

      <button class="btn btn-sm btn-outline-primary" data-action="edit">
        <i class="bi bi-pencil"></i> Change Status
      </button>
    </div>
    `;
  },

  onCellClicked: (params: any) => {
  const action =
    params.event.target.getAttribute('data-action') ||
    params.event.target.parentElement.getAttribute('data-action');

  if (action === 'view') {
    this.openViewModal(params.data);
  }
  else if (action === 'edit') {
    // Start editing the 'status' cell
    params.api.startEditingCell({
      rowIndex: params.node.rowIndex,
      colKey: 'status'
    });
  }
}
}
  ]

  constructor(private authService:AuthService, private apiService:ApiService){}

 ngOnInit(): void {
    this.listRequestedServices();
  }

  updateStatusInline(serviceId: number, status: number) {
  const payload = {
    id: serviceId,
    status: status
  };

  console.log("Inline status payload:", payload);

  this.apiService.updateServiceStatus(payload).subscribe(
    res => {
      alert("✅ Status Updated Successfully");
      this.listRequestedServices(); // refresh grid
    },
    err => {
      console.log(err);
      alert("❌ Failed to update status");
      this.listRequestedServices(); // revert grid to old value
    }
  );
}

  openViewModal(data:any)
{
  this.selectedService = data;
  this.selectedStatus = data.status;
  this.showModal = true;
}

updateStatus(){

const payload={
id:this.selectedService.serviceRequestId,
status: Number(this.selectedStatus),
}
  console.log("Payload sent to API:", payload);
this.apiService.updateServiceStatus(payload).subscribe(
res=>{
alert("✅ Status Updated Successfully");
this.listRequestedServices();
},
err=>{
console.log(err);
alert("❌ Failed to update status");
}
)

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