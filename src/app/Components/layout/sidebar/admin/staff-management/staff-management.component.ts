import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StaffCredentials, StaffMember, StaffRole } from '../../../../../Models/staff.model';
import { StaffService } from '../../../../../Services/staff.service';

@Component({
  selector: 'app-manage-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.css']
})
export class StaffManagementComponent implements OnInit {
  staffList: StaffMember[] = [];
  roles: StaffRole[] = ['Staff', 'Admin'];

  searchTerm = '';
  roleFilter = '';
  wardFilter = '';

  isFormOpen = false;
  isEditMode = false;
  editingId: string | null = null;
  staffForm: FormGroup;

  loading = false;
  errorMessage = '';
  newCredentials: StaffCredentials | null = null;
  confirmDeleteId: string | null = null;

  constructor(private staffService: StaffService, private fb: FormBuilder) {
    this.staffForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      fullNameEnglish: ['', [Validators.required, Validators.maxLength(100)]],
      fullNameNepali: [''],
      phoneNumber: ['', Validators.required],
      role: ['Staff', Validators.required],
      employeeId: [''],
      department: [''],
      designation: [''],
      wardNumber: ['', Validators.required],
      municipality: [''],
      district: [''],
      province: [''],
      accountStatus: ['Active']
    });
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;
    this.errorMessage = '';
    this.staffService
      .getAll({
        role: this.roleFilter || undefined,
        wardNumber: this.wardFilter || undefined,
        search: this.searchTerm || undefined
      })
      .subscribe({
        next: (data) => {
          this.staffList = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Could not load staff accounts. Try again.';
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.loadStaff();
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.newCredentials = null;
    this.errorMessage = '';
    this.staffForm.reset({ role: 'Staff', accountStatus: 'Active' });
    this.staffForm.get('username')?.enable();
    this.isFormOpen = true;
  }

  openEditForm(staff: StaffMember): void {
    this.isEditMode = true;
    this.editingId = staff.userId;
    this.newCredentials = null;
    this.errorMessage = '';
    this.staffForm.patchValue({
      username: staff.username,
      email: staff.email,
      fullNameEnglish: staff.fullNameEnglish,
      fullNameNepali: staff.fullNameNepali,
      phoneNumber: staff.phoneNumber,
      role: staff.role,
      employeeId: staff.employeeId,
      department: staff.department,
      designation: staff.designation,
      wardNumber: staff.wardNumber,
      municipality: staff.municipality,
      accountStatus: staff.accountStatus
    });
    // Username is fixed at creation time and not editable afterwards
    this.staffForm.get('username')?.disable();
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.staffForm.reset();
  }

  submitForm(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const value = this.staffForm.getRawValue();
    this.errorMessage = '';

    if (this.isEditMode && this.editingId !== null) {
      this.staffService
        .update(this.editingId, {
          fullNameEnglish: value.fullNameEnglish,
          fullNameNepali: value.fullNameNepali,
          email: value.email,
          phoneNumber: value.phoneNumber,
          role: value.role,
          employeeId: value.employeeId,
          department: value.department,
          designation: value.designation,
          wardNumber: value.wardNumber,
          municipality: value.municipality,
          district: value.district,
          province: value.province,
          accountStatus: value.accountStatus
        })
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadStaff();
          },
          error: (err) => {
            this.errorMessage = err?.error?.message || 'Could not update this account.';
          }
        });
    } else {
      this.staffService
        .create({
          username: value.username,
          email: value.email,
          fullNameEnglish: value.fullNameEnglish,
          fullNameNepali: value.fullNameNepali,
          phoneNumber: value.phoneNumber,
          role: value.role,
          employeeId: value.employeeId,
          department: value.department,
          designation: value.designation,
          wardNumber: value.wardNumber,
          municipality: value.municipality,
          district: value.district,
          province: value.province
        })
        .subscribe({
          next: (result) => {
            this.newCredentials = result.credentials;
            this.loadStaff();
          },
          error: (err) => {
            this.errorMessage = err?.error?.message || 'Could not create this account.';
          }
        });
    }
  }

  toggleStatus(staff: StaffMember): void {
    const nextStatus = staff.accountStatus === 'Active' ? 'Suspended' : 'Active';
    this.staffService.setStatus(staff.userId, nextStatus).subscribe({
      next: () => this.loadStaff(),
      error: () => (this.errorMessage = 'Could not change account status.')
    });
  }

  resetPassword(staff: StaffMember): void {
    this.staffService.resetPassword(staff.userId).subscribe({
      next: (credentials) => {
        this.newCredentials = credentials;
      },
      error: () => (this.errorMessage = 'Could not reset the password.')
    });
  }

  askDelete(userId: string): void {
    this.confirmDeleteId = userId;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId === null) return;
    this.staffService.delete(this.confirmDeleteId).subscribe({
      next: () => {
        this.confirmDeleteId = null;
        this.loadStaff();
      },
      error: () => {
        this.errorMessage = 'Could not remove this account.';
        this.confirmDeleteId = null;
      }
    });
  }

  dismissCredentials(): void {
    this.newCredentials = null;
    this.closeForm();
  }

  copyCredentials(): void {
    if (!this.newCredentials) return;
    const text = `Username: ${this.newCredentials.username}\nTemporary password: ${this.newCredentials.temporaryPassword}`;
    navigator.clipboard?.writeText(text);
  }
}