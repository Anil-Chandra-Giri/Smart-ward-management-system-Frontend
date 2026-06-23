import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ApiService } from '../../../../../Services/api.service';
import { FormsModule } from '@angular/forms';
import { Vote } from '../../../../../Models/vote.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-citizen-poll',
  templateUrl: './poll-list.component.html',
  styleUrls: ['./poll-list.component.css'],
  imports: [FormsModule, CommonModule, RouterLink],
})
export class PollListComponent implements OnInit {

  polls: any[] = [];
  showModal = false;
  selectedPoll: any;
  selectedOption!: string;
  errorMessage = '';
  loading = false;

  constructor(
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Delay slightly to ensure Angular hydration is complete
    setTimeout(() => this.loadPolls(), 0);
  }

  loadPolls(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getActivePolls().subscribe({
      next: (res: any) => {
        this.polls = res ?? [];
        this.loading = false;
        if (this.polls.length === 0) {
          this.errorMessage = 'No active polls were returned by the server.';
        }
      },
      error: (err) => {
        console.error('Error loading polls:', err);
        this.loading = false;
        this.polls = [];

        if (err.status === 401) {
          this.errorMessage = 'Unauthorised — please log in again.';
        } else if (err.status === 403) {
          this.errorMessage = 'You do not have permission to view polls.';
        } else if (err.status === 0) {
          this.errorMessage = 'Could not reach the server. Is the API running?';
        } else {
          this.errorMessage = `Error loading polls (HTTP ${err.status}).`;
        }
      },
    });
  }

  openVoteModal(poll: any): void {
    this.selectedPoll = poll;
    this.selectedOption = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitVote(): void {
    const vote: Vote = {
      pollId: this.selectedPoll.id,
      optionId: this.selectedOption,
      citizenId: 'CIT001',
    };

    this.api.vote(vote).subscribe({
      next: () => { alert('Vote submitted successfully'); this.closeModal(); },
      error: (err) => { alert(err.error?.message); },
    });
  }

  trackByOptionId(_index: number, option: any): number { return option.id; }
}