// src/app/components/resource-list/resource-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../Services/api.service';
import { Resource } from '../../Models/resource.model';
import { CommonModule } from '@angular/common';
import { ResourceFormComponent } from '../resource-form/resource-form.component';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.css'],
  imports: [CommonModule, ResourceFormComponent]
})
export class ResourceListComponent implements OnInit {
  resources: Resource[] = [];
  loading = false;
  error = '';
  showLowStockOnly = false;
  showModal = false;
  selectedResourceId: string | null = null;
  isEditMode = false;

  constructor(private resourceService: ApiService) { }

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.loading = true;
    
    if (this.showLowStockOnly) {
      this.resourceService.getLowStockResources().subscribe({
        next: (data) => {
          this.resources = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error loading resources';
          this.loading = false;
          console.error('Error:', error);
        }
      });
    } else {
      this.resourceService.getResources().subscribe({
        next: (data) => {
          this.resources = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error loading resources';
          this.loading = false;
          console.error('Error:', error);
        }
      });
    }
  }

  toggleLowStock(): void {
    this.showLowStockOnly = !this.showLowStockOnly;
    this.loadResources();
  }

  openAddModal(): void {
    this.selectedResourceId = null;
    this.isEditMode = false;
    this.showModal = true;
  }

  openEditModal(id: string): void {
    this.selectedResourceId = id;
    this.isEditMode = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedResourceId = null;
    this.isEditMode = false;
  }

  onResourceSaved(): void {
    this.closeModal();
    this.loadResources(); // Refresh the list
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Available': return 'badge bg-success';
      case 'Low Stock': return 'badge bg-warning';
      case 'Out of Stock': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  deleteResource(id: string): void {
    if (confirm('Are you sure you want to delete this resource?')) {
      this.resourceService.deleteResource(id).subscribe({
        next: () => {
          this.resources = this.resources.filter(r => r.id !== id);
        },
        error: (error) => {
          console.error('Error deleting resource:', error);
        }
      });
    }
  }
}