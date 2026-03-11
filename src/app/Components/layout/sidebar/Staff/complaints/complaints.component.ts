import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ImageCellRendererComponent } from '../../../../shared/image-cell/image-cell.component';
import { AuthService } from '../../../../../Services/auth.service';
import { ApiService } from '../../../../../Services/api.service';

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

columnDefs: ColDef[] = [
  { 
    field: 'complaintId', 
    headerName: 'ID', 
    width: 100, 
    pinned: 'left',
    cellStyle: { fontWeight: 'bold' } 
  },
  
  { 
    field: 'category', 
    headerName: 'Category', 
    filter: true,
    flex: 1 
  },
  
  { field: 'wardNumber', headerName: 'Ward', width: 90, filter: 'agNumberColumnFilter' },
  { field: 'municipality', headerName: 'Municipality', flex: 1 },
  
  { 
    field: 'status', 
    headerName: 'Status', 
    width: 130,
    cellClassRules: {
      'text-danger': "x === 'Pending'",
      'text-warning': "x === 'In Progress'",
      'text-success': "x === 'Resolved'"
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

  { field: 'latitude', headerName: 'Lat', width: 100, hide: true }, 
  { field: 'longitude', headerName: 'Lng', width: 100, hide: true },

  { field: 'complaintDetails', headerName: 'Details', flex: 2, tooltipField: 'complaintDetails' },

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
];

 constructor(private authService:AuthService, private apiService:ApiService){}

ngOnInit(): void {
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

}
