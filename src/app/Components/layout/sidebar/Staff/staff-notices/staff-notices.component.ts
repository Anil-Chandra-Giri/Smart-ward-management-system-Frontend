import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Notice {
  id: number;
  title: string;
  content: string;
  publishedDate: Date;
  author: string;
}

@Component({
  selector: 'app-staff-notices',
  imports: [CommonModule,FormsModule],
  templateUrl: './staff-notices.component.html',
  styleUrl: './staff-notices.component.css'
})
export class StaffNoticesComponent implements OnInit {
   notices: Notice[] = [];
  isModalOpen = false;

  // Form Fields
  newNoticeTitle = '';
  newNoticeContent = '';
  newNoticeAuthor = 'Admin';

  ngOnInit(): void {
    this.loadNotices();
  }

  // Load initial data (mock data)
  loadNotices(): void {
    this.notices = [
      {
        id: 1,
        title: 'Welcome to the new system',
        content: 'Please update your passwords by Friday.',
        publishedDate: new Date(),
        author: 'IT Dept'
      }
    ];
  }

  // Open the modal
  openPublishModal(): void {
    this.isModalOpen = true;
    this.resetForm();
  }

  // Close the modal
  closePublishModal(): void {
    this.isModalOpen = false;
  }

  // Reset form fields
  resetForm(): void {
    this.newNoticeTitle = '';
    this.newNoticeContent = '';
    this.newNoticeAuthor = 'Admin';
  }

  // Handle form submission
  publishNotice(): void {
    if (!this.newNoticeTitle || !this.newNoticeContent) {
      alert('Please fill in all fields');
      return;
    }

    const newNotice: Notice = {
      id: Date.now(),
      title: this.newNoticeTitle,
      content: this.newNoticeContent,
      publishedDate: new Date(),
      author: this.newNoticeAuthor
    };

    this.notices.unshift(newNotice); // Add to top of list
    this.closePublishModal();
}
}
