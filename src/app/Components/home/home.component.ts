import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Notice {
  id: number;
  title: string;
  content: string;
  publishedDate: Date;
  author: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface ContactInfo {
  label: string;
  value: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
isModalOpen = false;
  isLoginMode = true;
  notices: Notice[] = [];
  services: Service[] = [];
  contactInfo: ContactInfo[] = [];

  // Form Fields
  loginEmail = '';
  loginPassword = '';
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerPhone = '';

  // User State
  isLoggedIn = false;
  currentUser: string = '';

  ngOnInit(): void {
    this.loadNotices();
    this.loadServices();
    this.loadContactInfo();
  }

  // Load Mock Data
  loadNotices(): void {
    this.notices = []  
  }

  loadServices(): void {
    this.services = [ ];
  }

  loadContactInfo(): void {
    this.contactInfo = [];
  }

  // Modal Functions
  openModal(mode: 'login' | 'register'): void {
    this.isLoginMode = mode === 'login';
    this.isModalOpen = true;
    this.resetForm();
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.loginEmail = '';
    this.loginPassword = '';
    this.registerName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerPhone = '';
  }

  // Authentication Functions
  login(): void {
    if (!this.loginEmail || !this.loginPassword) {
      alert('Please fill in all fields');
      return;
    }
    this.isLoggedIn = true;
    this.currentUser = this.loginEmail.split('@')[0];
    this.closeModal();
  }

  register(): void {
    if (!this.registerName || !this.registerEmail || !this.registerPassword || !this.registerPhone) {
      alert('Please fill in all fields');
      return;
    }
    this.isLoggedIn = true;
    this.currentUser = this.registerName;
    this.closeModal();
  }

  logout(): void {
    this.isLoggedIn = false;
    this.currentUser = '';
    this.resetForm();
  }

  // Quick Actions
  navigateToService(serviceId: number): void {
    alert(`Navigating to Service #${serviceId}`);
  }
}
