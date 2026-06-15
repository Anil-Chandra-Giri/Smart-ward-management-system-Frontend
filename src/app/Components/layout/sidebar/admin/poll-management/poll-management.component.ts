import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PollCategory } from '../../../../../Models/poll-category';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-poll-management',
  imports: [FormsModule, CommonModule],
  templateUrl: './poll-management.component.html',
  styleUrl: './poll-management.component.css'
})
export class PollManagementComponent implements OnInit {

  title = '';
  description = '';
  categoryId!: number;

  categories: PollCategory[] = [];

  showCategoryInput = false;
  newCategoryName = '';

  options: string[] = ['', ''];

  private isBrowser: boolean;

  constructor(
    private pollService: ApiService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;  // ← skip on SSR server
    this.loadCategories();
  }

  loadCategories(): void {
    this.pollService.getPollCategories().subscribe({
      next: (res) => { this.categories = res; },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  addOption(): void {
    this.options.push('');
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.splice(index, 1);
    }
  }

  createCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.pollService.createPollCategory(name).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.showCategoryInput = false;
        this.loadCategories();
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }

  createPoll(): void {
    if (!this.title.trim()) {
      alert('Please enter a poll title');
      return;
    }

    const validOptions = this.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const data = {
      title: this.title.trim(),
      description: this.description.trim(),
      categoryId: this.categoryId,
      startDate: new Date(),
      options: validOptions
    };

    this.pollService.createPoll(data).subscribe({
      next: () => {
        alert('Poll created successfully');
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating poll:', err);
        alert('Failed to create poll');
      }
    });
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.categoryId = undefined!;
    this.options = ['', ''];
  }
}