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
    this.api.getActivePolls().subscribe({
      next: (res: any) => { this.polls = res; },
      error: (err) => { console.error('Error loading polls:', err); },
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