import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../../Services/api.service';
import { FormsModule } from '@angular/forms';
import { NoticeCategory } from '../../../../../Models/Category';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from "ag-grid-angular";

declare var bootstrap:any;

@Component({
  selector: 'app-staff-notices',
  imports: [FormsModule, CommonModule, AgGridAngular],
  templateUrl: './staff-notices.component.html',
  styleUrls: ['./staff-notices.component.css']
})
export class StaffNoticesComponent implements OnInit {

  title=''
  description=''
  categoryId=0
  isUrgent=false
  expiryDate=''
  file:any
  rowData:any[]=[]
  categories:NoticeCategory[]=[]

  showCategoryInput=false
  newCategoryName=''

  columnDefs: ColDef[] = [
  { field: 'id', headerName: 'ID', flex: 1, filter: true },
  { field: 'title', headerName: 'Title', flex: 2, filter: true },
  { field: 'description', headerName: 'Description', flex: 3, filter: true },
  { field: 'category', headerName: 'Category', flex: 1, filter: true },
  { field: 'isUrgent', headerName: 'Urgent', flex: 1, filter: true,
    cellRenderer: (params: any) => params.value ? 'Yes' : 'No' },
  { field: 'publishDate', headerName: 'Publish Date', flex: 1, filter: true,
    valueFormatter: (params: any) => new Date(params.value).toLocaleString() },
  { field: 'expiryDate', headerName: 'Expiry Date', flex: 1, filter: true,
    valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '' },
  { field: 'fileUrl', headerName: 'File', flex: 1,
    cellRenderer: (params: any) => params.value ? `<a href="${params.value}" target="_blank">Download</a>` : '' 
  },

  // Actions Column
  {
    headerName: 'Actions',
    cellRenderer: (params: any) => {
      return `
        <button class="btn btn-sm btn-outline-primary me-2" data-action="view">
          <i class="bi bi-eye"></i> View
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
      const target = params.event.target as HTMLElement;
      const action = target.getAttribute('data-action') || target.parentElement?.getAttribute('data-action');

      if (!action) return;

      switch(action){
        case 'view':
          // this.viewNotice(params.data.id);
          break;
        case 'edit':
          // this.editNotice(params.data.id);
          break;
        case 'delete':
          // this.deleteNotice(params.data.id);
          break;
      }
    },
    flex: 2
  }
];

  constructor(private noticeService:ApiService){}

  ngOnInit(): void {
    this.getNotices();
    this.loadCategories()
  }

  loadCategories(){
    this.noticeService.getCategories().subscribe(res=>{
      this.categories=res
    })
  }

  addCategory(){

    if(!this.newCategoryName){
      alert("Enter category name")
      return
    }

    const category={
      name:this.newCategoryName,
      description:""
    }

    this.noticeService.addCategory(category).subscribe(()=>{

      alert("Category Added")

      this.newCategoryName=''
      this.showCategoryInput=false

      this.loadCategories()

    })

  }

  onFileChange(event:any){
    this.file=event.target.files[0]
  }

  getNotices(){
    this.noticeService.getNotices().subscribe(res=>{
      this.rowData=res;
    })
  }

  submitNotice(){

    const formData=new FormData()

    formData.append("title",this.title)
    formData.append("description",this.description)
    formData.append("categoryId",this.categoryId.toString())
    formData.append("isUrgent",this.isUrgent.toString())
    formData.append("expiryDate",this.expiryDate)

    if(this.file){
      formData.append("file",this.file)
    }

    this.noticeService.createNotice(formData).subscribe(()=>{

      alert("Notice Posted Successfully")

      this.resetForm()

      const modal=document.getElementById("noticeModal")
      const modalInstance=bootstrap.Modal.getInstance(modal)
      modalInstance.hide()

    })

  }

  resetForm(){
    this.title=''
    this.description=''
    this.categoryId=0
    this.isUrgent=false
    this.expiryDate=''
    this.file=null
    this.showCategoryInput=false
    this.newCategoryName=''
  }

}