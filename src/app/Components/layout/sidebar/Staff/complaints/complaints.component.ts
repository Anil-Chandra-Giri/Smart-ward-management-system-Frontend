import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ImageCellRendererComponent } from '../../../../shared/image-cell/image-cell.component';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-complaints',
  imports: [CommonModule,AgGridAngular],
  templateUrl: './complaints.component.html',
  styleUrl: './complaints.component.css'
})
export class ComplaintsComponent {
pageSize = 7;
rowData: any[] = [];
isBrowser = true;
selectedComplaint:any = null;
selectedStatus:string = '';
context:any;

columnDefs: ColDef[] = [

  { 
    field: 'category', 
    headerName: 'Category', 
    filter: true,
    flex: 1 
  },
  
  { 
    field: 'status', 
    headerName: 'Status', 
    width: 130,
    editable:true,
    cellClassRules: {
      'text-danger': "x === 'Pending'",
      'text-warning': "x === 'In Progress'",
      'text-info': "x === 'Approved'",
      'text-success': "x === 'Resolved'"
    },
    cellEditorParams: {
    values: ["Pending","Approved","In Review","Resolved"]
  },

  cellEditor: 'agSelectCellEditor',
  
  
  onCellValueChanged: (params: any) => {

    const newStatus = params.newValue;
    const complaintId = params.data.complaintId;

    if(newStatus !== params.oldValue){
      params.context.componentParent.updateStatus(complaintId, newStatus, params);
    }

  }
  },
  {
    headerName:'Image',
    field:'imageUrl',
    cellRenderer: ImageCellRendererComponent,
    width: 130
  },

  { field: 'priority', headerName: 'Priority', width: 110 },
  { 
    field: 'createdAt', 
    headerName: 'Submitted On', 
    flex: 1,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString() 
  },

  { field: 'latitude', headerName: 'Latitude', width: 100}, 
  { field: 'longitude', headerName: 'Longitude', width: 100},

  { field: 'complaintDetails', headerName: 'Details', flex: 2, tooltipField: 'complaintDetails' },

     {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const hasLocation = params.data.latitude && params.data.longitude;
        
        return `
          <div class="action-buttons">
            
            <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" title="Edit Complaint">
              <i class="bi bi-pencil"></i> Change Status
            </button>
            ${hasLocation ? 
              `<button class="btn btn-sm btn-outline-success me-1" data-action="navigate" title="Navigate to Location">
                <i class="bi bi-geo-alt-fill"></i> Navigate
              </button>` : 
              `<button class="btn btn-sm btn-outline-secondary me-1" disabled title="No Location Available">
                <i class="bi bi-geo-alt"></i>
              </button>`
            }
          </div>
        `;
      },

       onCellClicked: (params: any) => {
        const action = params.event.target.getAttribute('data-action') || 
                       params.event.target.parentElement?.getAttribute('data-action') ||
                       params.event.target.parentElement?.parentElement?.getAttribute('data-action');
        
        if (action === 'edit') {
          // this.editComplaint(params.data);
          setTimeout(() => {
  params.api.startEditingCell({
    rowIndex: params.node.rowIndex,
    colKey: 'status'
  });
});
        } else if (action === 'delete') {
          // this.deleteComplaint(params.data);
        } else if (action === 'view') {
          // this.viewComplaint(params.data);
        } else if (action === 'navigate') {
          this.navigateToComplaint(params.data);
        }
      },
      width: 250,
      cellStyle: { 'text-align': 'center' }
    }
  
];

 constructor(private authService:AuthService, private apiService:ApiService, private router:Router){}

ngOnInit(): void {
    this.context = { componentParent: this };
    this.listAllComplaints();
  }
  
  listAllComplaints(){
  const UserId=this.authService.decodeToken().UserId;
  if(UserId==null)
  {
    alert("Login First");
  }
 else{
    this.apiService.getAllComplaints().subscribe(
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

  navigateToComplaint(complaint: any) {
    if (complaint.latitude && complaint.longitude) {
      // Navigate to the tracking component with complaint details
      this.router.navigate(['/navigate', complaint.complaintId], {
        queryParams: {
          lat: complaint.latitude,
          lng: complaint.longitude,
          category: complaint.category,
          address: complaint.municipality + ', Ward ' + complaint.wardNumber
        }
      });
    } else {
      alert('No location coordinates available for this complaint');
    }
  }

  updateStatus(complaintId: number, newStatus: string, params: any){

      const payload={
      id:complaintId,
      status: newStatus,
      }
        console.log("Payload sent to API:", payload);
      this.apiService.updateComplaintStatus(payload).subscribe(
      res=>{
      alert("✅ Status Updated Successfully");
      this.listAllComplaints();
      },
      err=>{
      console.log(err);
      alert("❌ Failed to update status");
      }
      )

}

}
