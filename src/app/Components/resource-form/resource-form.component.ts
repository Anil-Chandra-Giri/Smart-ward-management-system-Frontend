// src/app/components/resource-form/resource-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { UpdateResource, CreateResource } from '../../Models/resource.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resource-form',
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ResourceFormComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() resourceId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  resourceForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';
  today: string = '';

  resourceTypes = [
    'Food', 'Medical', 'Equipment', 'Clothing', 
    'Shelter', 'Water', 'Sanitation', 'Communication',
    'Transportation', 'Tools', 'Other'
  ];

  categories = [
    'Non-Perishable Food', 'Perishable Food', 'Medications', 'Medical Supplies',
    'First Aid Kit', 'PPE', 'Tools', 'Machinery', 'Vehicles',
    'Blankets', 'Tents', 'Clothing', 'Hygiene Kits'
  ];

  units = [
    'kg', 'g', 'lb', 'liters', 'ml', 'pieces', 'boxes', 
    'pallets', 'units', 'pairs', 'sets', 'bottles', 'cans'
  ];

  constructor(
    private fb: FormBuilder,
    private resourceService: ApiService
  ) {
    this.resourceForm = this.createForm();
    this.today = this.formatDateForInput(new Date());
  }

  ngOnInit(): void {
    if (this.isEditMode && this.resourceId) {
      this.loadResource(this.resourceId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      type: ['', Validators.required],
      category: [''],
      description: ['', Validators.maxLength(500)],
      quantity: [0, [Validators.required, Validators.min(0)]],
      minimumThreshold: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      expiryDate: [''],
      storageLocation: [''],
      supplier: [''],
      unitPrice: [null, [Validators.min(0)]]
    });
  }

  loadResource(id: string): void {
    this.loading = true;
    this.resourceService.getResource(id).subscribe({
      next: (resource) => {
        this.resourceForm.patchValue({
          name: resource.name,
          type: resource.type,
          category: resource.category,
          description: resource.description,
          quantity: resource.quantity,
          minimumThreshold: resource.minimumThreshold,
          unit: resource.unit,
          expiryDate: resource.expiryDate ? this.formatDateForInput(resource.expiryDate) : '',
          storageLocation: resource.storageLocation,
          supplier: resource.supplier,
          unitPrice: resource.unitPrice
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading resource details';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.resourceForm.invalid) {
      this.markFormGroupTouched(this.resourceForm);
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const formData = this.resourceForm.value;

    if (this.isEditMode && this.resourceId) {
      const updateData: UpdateResource = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        minimumThreshold: formData.minimumThreshold,
        unit: formData.unit,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        storageLocation: formData.storageLocation,
        supplier: formData.supplier,
        unitPrice: formData.unitPrice
      };

      this.resourceService.updateResource(this.resourceId, updateData).subscribe({
        next: () => {
          this.successMessage = 'Resource updated successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.saved.emit();
          }, 1500);
        },
        error: (error) => {
          this.error = 'Error updating resource';
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    } else {
      const createData: CreateResource = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        minimumThreshold: formData.minimumThreshold,
        unit: formData.unit,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        storageLocation: formData.storageLocation,
        supplier: formData.supplier,
        unitPrice: formData.unitPrice
      };

      this.resourceService.createResource(createData).subscribe({
        next: () => {
          this.successMessage = 'Resource added successfully!';
          this.submitting = false;
          setTimeout(() => {
            this.saved.emit();
          }, 1500);
        },
        error: (error) => {
          this.error = 'Error adding resource';
          this.submitting = false;
          console.error('Error:', error);
        }
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.resourceForm.get(field);
    return control ? control.hasError(error) && control.touched : false;
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  // Helper to check if resource type is Food or Medical (for expiry date)
  shouldShowExpiryDate(): boolean {
    const type = this.resourceForm.get('type')?.value;
    return type === 'Food' || type === 'Medical';
  }
}