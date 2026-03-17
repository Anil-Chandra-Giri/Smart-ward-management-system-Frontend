// src/app/components/volunteer-list/volunteer-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../Services/api.service';
import { Volunteer } from '../../Models/volunteer.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-volunteer-list',
  templateUrl: './volunteer-list.component.html',
  styleUrls: ['./volunteer-list.component.css'],
  imports:[CommonModule,RouterLink]
})
export class VolunteerListComponent implements OnInit {
  volunteers: Volunteer[] = [];
  loading = false;
  error = '';

  constructor(private volunteerService: ApiService) { }

  ngOnInit(): void {
    this.loadVolunteers();
  }

  loadVolunteers(): void {
    this.loading = true;
    this.volunteerService.getVolunteers().subscribe({
      next: (data) => {
        this.volunteers = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading volunteers';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  deleteVolunteer(id: string): void {
    if (confirm('Are you sure you want to delete this volunteer?')) {
      this.volunteerService.deleteVolunteer(id).subscribe({
        next: () => {
          this.volunteers = this.volunteers.filter(v => v.id !== id);
        },
        error: (error) => {
          console.error('Error deleting volunteer:', error);
        }
      });
    }
  }

   getFormattedSkills(skills: string | null | undefined): string {
    if (!skills) {
      return 'No skills listed';
    }
    return skills.length > 50 ? skills.substring(0, 50) + '...' : skills;
  }
}