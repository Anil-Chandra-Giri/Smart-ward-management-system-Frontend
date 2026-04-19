import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { NoticeCategory } from '../../../../../Models/Category';
import { ApiService } from '../../../../../Services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';

declare var bootstrap: any;

@Component({
  selector: 'app-notice-management',
  imports: [FormsModule, CommonModule, AgGridAngular],
  templateUrl: './notice-management.component.html',
  styleUrl: './notice-management.component.css'
})
export class NoticeManagementComponent implements OnInit {

  title = ''
  description = ''
  categoryId = 0
  isUrgent = false
  expiryDate = ''
  file: any
  rowData: any[] = []
  categories: NoticeCategory[] = []

  showCategoryInput = false
  newCategoryName = ''

  // For editing
  isEditMode = false
  currentNoticeId: string | null = null
  existingFileName: string = ''

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1, filter: true },
    { field: 'title', headerName: 'Title', flex: 2, filter: true },
    { field: 'description', headerName: 'Description', flex: 3, filter: true },
    { 
      field: 'category', 
      headerName: 'Category', 
      flex: 1, 
      filter: true,
      valueGetter: (params) => params.data.category?.name || 'N/A'
    },
    { 
      field: 'isUrgent', 
      headerName: 'Urgent', 
      flex: 1, 
      filter: true,
      cellRenderer: (params: any) => params.value ? 
        '<span class="badge bg-danger">Yes</span>' : 
        '<span class="badge bg-secondary">No</span>' 
    },
    { 
      field: 'publishDate', 
      headerName: 'Publish Date', 
      flex: 1, 
      filter: true,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : ''
    },
    { 
      field: 'expiryDate', 
      headerName: 'Expiry Date', 
      flex: 1, 
      filter: true,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '' 
    },
    { 
      field: 'fileUrl', 
      headerName: 'File', 
      flex: 1,
      cellRenderer: (params: any) => {
        if (params.value) {
          return `<a href="${params.value}" target="_blank" class="btn btn-sm btn-outline-info">Download</a>`;
        }
        return '';
      }
    },

    // Actions Column
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        return `
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

        switch (action) {
          case 'edit':
            this.editNotice(params.data);
            break;
          case 'delete':
            this.confirmDelete(params.data.id);
            break;
        }
      },
      flex: 2,
      sortable: false,
      filter: false
    }
  ];

  constructor(private noticeService: ApiService) { }

  ngOnInit(): void {
    this.getNotices();
    this.loadCategories();
  }

  loadCategories() {
    this.noticeService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        alert('Failed to load categories');
      }
    });
  }

  addCategory() {
    if (!this.newCategoryName) {
      alert("Enter category name");
      return;
    }

    const category = {
      name: this.newCategoryName,
      description: ""
    };

    this.noticeService.addCategory(category).subscribe({
      next: () => {
        alert("Category Added Successfully");
        this.newCategoryName = '';
        this.showCategoryInput = false;
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error adding category:', err);
        alert('Failed to add category');
      }
    });
  }

  onFileChange(event: any) {
    this.file = event.target.files[0];
  }

  getNotices() {
    this.noticeService.getNotices().subscribe({
      next: (res) => {
        this.rowData = res;
      },
      error: (err) => {
        console.error('Error loading notices:', err);
        alert('Failed to load notices');
      }
    });
  }

  // Edit Notice
  editNotice(notice: any) {
    this.isEditMode = true;
    this.currentNoticeId = notice.id;
    
    // Populate form fields
    this.title = notice.title;
    this.description = notice.description;
    this.categoryId = notice.category?.id || 0;
    this.isUrgent = notice.isUrgent;
    
    // Format date for input (YYYY-MM-DD)
    if (notice.expiryDate) {
      const date = new Date(notice.expiryDate);
      this.expiryDate = date.toISOString().split('T')[0];
    }
    
    this.existingFileName = notice.fileUrl ? notice.fileUrl.split('/').pop() : '';

    // Open modal
    const modalElement = document.getElementById('noticeModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Delete Notice with confirmation
  confirmDelete(id: string) {
    if (confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      this.deleteNotice(id);
    }
  }

  deleteNotice(id: string) {
    this.noticeService.deleteNotice(id).subscribe({
      next: () => {
        alert('Notice deleted successfully');
        this.getNotices(); // Refresh the list
      },
      error: (err) => {
        console.error('Error deleting notice:', err);
        alert('Failed to delete notice. Please try again.');
      }
    });
  }

  submitNotice() {
    const formData = new FormData();

    formData.append("title", this.title);
    formData.append("description", this.description);
    formData.append("categoryId", this.categoryId.toString());
    formData.append("isUrgent", this.isUrgent.toString());
    formData.append("expiryDate", this.expiryDate);

    if (this.file) {
      formData.append("file", this.file);
    }

    // If in edit mode, append the notice ID
    if (this.isEditMode && this.currentNoticeId) {
      formData.append("id", this.currentNoticeId.toString());
      
      this.noticeService.updateNotice(this.currentNoticeId, formData).subscribe({
        next: () => {
          alert("Notice Updated Successfully");
          this.resetForm();
          this.closeModal();
          this.getNotices(); // Refresh the list
        },
        error: (err) => {
          console.error('Error updating notice:', err);
          alert('Failed to update notice. Please try again.');
        }
      });
    } else {
      // Create new notice
      this.noticeService.createNotice(formData).subscribe({
        next: () => {
          alert("Notice Posted Successfully");
          this.resetForm();
          this.closeModal();
          this.getNotices(); // Refresh the list
        },
        error: (err) => {
          console.error('Error creating notice:', err);
          alert('Failed to create notice. Please try again.');
        }
      });
    }
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.categoryId = 0;
    this.isUrgent = false;
    this.expiryDate = '';
    this.file = null;
    this.showCategoryInput = false;
    this.newCategoryName = '';
    this.isEditMode = false;
    this.currentNoticeId = null;
    this.existingFileName = '';
  }

  closeModal() {
    const modalElement = document.getElementById('noticeModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    this.resetForm();
  }

  // Open modal for new notice
  openNewNoticeModal() {
    this.resetForm();
    const modalElement = document.getElementById('noticeModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
}
