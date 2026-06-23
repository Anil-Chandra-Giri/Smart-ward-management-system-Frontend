import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../Services/api.service';

interface CitizenDocument {
  documentId: string;
  documentType: string;
  filePath: string;
  isVerified: boolean;
  documentNumber: string;
}

interface Citizen {
  userId: string;
  fullNameEnglish: string;
  fullNameNepali: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  citizenshipNumber: string;
  citizenshipIssuedDistrict: string;
  citizenshipIssuedDate: string;
  nationalIdNumber: string;
  permanentAddress: string;
  temporaryAddress: string;
  wardNumber: string;
  municipality: string;
  district: string;
  province: string;
  profilePicturePath: string;
  verificationStatus: string;
  isVerified: boolean;
  createdAt: string;
  documents: CitizenDocument[];
}

@Component({
  selector: 'app-verify-citizen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-citizen.component.html',
  styleUrl: './verify-citizen.component.css'
})
export class VerifyCitizenComponent implements OnInit {
  citizens: Citizen[] = [];
  selectedCitizen: Citizen | null = null;
  isLoading = false;
  isActioning = false;
  errorMessage = '';
  successMessage = '';

  // Rejection modal
  showRejectModal = false;
  rejectionReason = '';

  // Document preview modal
  showDocModal = false;
  docModalUrl = '';
  docModalTitle = '';

  private baseUrl = 'https://localhost:7069';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPendingCitizens();
  }

  loadPendingCitizens() {
    this.isLoading = true;
    this.errorMessage = '';
    this.apiService.getPendingCitizens().subscribe({
      next: (data) => {
        this.citizens = data;
        this.isLoading = false;
        // Re-select if a citizen was already selected
        if (this.selectedCitizen) {
          this.selectedCitizen = this.citizens.find(c => c.userId === this.selectedCitizen!.userId) || null;
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load pending citizens.';
        this.isLoading = false;
      }
    });
  }

  selectCitizen(citizen: Citizen) {
    this.selectedCitizen = citizen;
    this.successMessage = '';
    this.errorMessage = '';
  }

  getImageUrl(path: string): string {
    if (!path) return 'https://i.pravatar.cc/80';
    const clean = path.startsWith('/') ? path.substring(1) : path;
    return `${this.baseUrl}/${clean}`;
  }

  getDocLabel(type: string): string {
    const labels: Record<string, string> = {
      CitizenshipFront: 'Citizenship (Front)',
      CitizenshipBack: 'Citizenship (Back)',
      LivePhoto: 'Live Photo'
    };
    return labels[type] ?? type;
  }

  openDocModal(doc: CitizenDocument) {
    this.docModalUrl = this.getImageUrl(doc.filePath);
    this.docModalTitle = this.getDocLabel(doc.documentType);
    this.showDocModal = true;
  }

  closeDocModal() {
    this.showDocModal = false;
    this.docModalUrl = '';
  }

  verifyCitizen() {
    if (!this.selectedCitizen) return;
    this.isActioning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.verifyCitizen(this.selectedCitizen.userId).subscribe({
      next: () => {
        this.isActioning = false;
        this.successMessage = `${this.selectedCitizen!.fullNameEnglish} has been verified successfully. Email notification sent.`;
        this.selectedCitizen = null;
        this.loadPendingCitizens();
      },
      error: (err) => {
        this.isActioning = false;
        this.errorMessage = err?.error?.message || 'Failed to verify citizen.';
      }
    });
  }

  openRejectModal() {
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectionReason = '';
  }

  submitRejection() {
    if (!this.selectedCitizen || !this.rejectionReason.trim()) return;
    this.isActioning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.rejectCitizen(this.selectedCitizen.userId, this.rejectionReason).subscribe({
      next: () => {
        this.isActioning = false;
        this.successMessage = `${this.selectedCitizen!.fullNameEnglish}'s verification has been rejected. Email notification sent.`;
        this.closeRejectModal();
        this.selectedCitizen = null;
        this.loadPendingCitizens();
      },
      error: (err) => {
        this.isActioning = false;
        this.errorMessage = err?.error?.message || 'Failed to reject citizen.';
        this.closeRejectModal();
      }
    });
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }
}