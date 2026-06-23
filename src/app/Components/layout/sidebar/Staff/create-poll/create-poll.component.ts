import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../Services/api.service';
import { PollCategory } from '../../../../../Models/poll-category';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

declare var bootstrap: any;

@Component({
  selector: 'app-create-poll',
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.css'],
  imports: [FormsModule, CommonModule, AgGridAngular],
})
export class CreatePollComponent implements OnInit {

  // ── Create-poll form state ─────────────────────────────────────────────
  title = '';
  description = '';
  categoryId = 0;
  categories: PollCategory[] = [];

  showCategoryInput = false;
  newCategoryName = '';

  options: string[] = ['', ''];

  // ── Grid / list state ───────────────────────────────────────────────────
  rowData: any[] = [];
  loading = false;
  errorMessage = '';

  columnDefs: ColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2, filter: true },
    { field: 'description', headerName: 'Description', flex: 3, filter: true },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1,
      filter: true,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '',
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      filter: true,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : 'No end date',
    },
    {
      headerName: 'Options',
      flex: 1,
      sortable: false,
      filter: false,
      valueGetter: (p: any) => p.data.options?.length ?? 0,
    },
    {
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => `
        <button class="btn btn-sm btn-outline-primary" data-action="results" data-id="${p.data.id}">
          📊 Results
        </button>
      `,
      onCellClicked: (p: any) => {
        const target = p.event.target as HTMLElement;
        const actionEl = target.closest('[data-action]') as HTMLElement | null;
        if (!actionEl) return;

        const id = actionEl.getAttribute('data-id');
        if (actionEl.getAttribute('data-action') === 'results' && id) {
          this.viewResults(id);
        }
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  constructor(
    private pollService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPolls();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadCategories(): void {
    this.pollService.getPollCategories().subscribe({
      next: (res) => { this.categories = res; },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  loadPolls(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pollService.getActivePolls().subscribe({
      next: (res: any) => {
        this.rowData = res ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading polls:', err);
        this.loading = false;
        this.rowData = [];

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

  // ── Options list ──────────────────────────────────────────────────────────

  addOption(): void {
    this.options.push('');
  }

  removeOption(index: number): void {
    // Keep at least 2 options — a poll needs a minimum to make sense.
    if (this.options.length <= 2) return;
    this.options.splice(index, 1);
  }

  // Without this, *ngFor's default tracking treats a changed string value
  // as a removed item + a new item, destroying and recreating that <input>
  // DOM node on every keystroke — losing focus after one character typed.
  trackByIndex(index: number): number {
    return index;
  }

  // ── Category creation ───────────────────────────────────────────────────

  createCategory(): void {
    if (!this.newCategoryName) {
      alert('Enter a category name');
      return;
    }

    this.pollService.createPollCategory(this.newCategoryName).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.showCategoryInput = false;
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error creating category:', err);
        alert('Failed to create category');
      },
    });
  }

  // ── Poll creation ───────────────────────────────────────────────────────

  createPoll(): void {
    const cleanedOptions = this.options.map(o => o.trim()).filter(o => o.length > 0);

    if (!this.title || !this.description || !this.categoryId) {
      alert('Title, description, and category are required.');
      return;
    }

    if (cleanedOptions.length < 2) {
      alert('Add at least 2 options.');
      return;
    }

    const data = {
      title: this.title,
      description: this.description,
      categoryId: this.categoryId,
      startDate: new Date(),
      options: cleanedOptions,
    };

    this.pollService.createPoll(data).subscribe({
      next: () => {
        alert('Poll created successfully');
        this.resetForm();
        this.closeModal();
        this.loadPolls();
      },
      error: (err) => {
        console.error('Error creating poll:', err);
        alert(err.error?.message || 'Failed to create poll. Please try again.');
      },
    });
  }

  resetForm(): void {
    this.title = '';
    this.description = '';
    this.categoryId = 0;
    this.options = ['', ''];
    this.showCategoryInput = false;
    this.newCategoryName = '';
  }

  // ── Modal handling (same Bootstrap pattern as staff-notices) ───────────

  openNewPollModal(): void {
    this.resetForm();
    const modalElement = document.getElementById('pollModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('pollModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  viewResults(pollId: string): void {
    this.router.navigate(['/ward/polls/results', pollId]);
  }
}