// src/app/components/weekly-schedule/weekly-schedule.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WeeklySchedule, Schedule } from '../../../../../Models/WasteCollectionRoute';
import { ApiService } from '../../../../../Services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weekly-schedule',
  templateUrl: './weekly-schedule.component.html',
  styleUrls: ['./weekly-schedule.component.css'],
  imports: [CommonModule, RouterModule]
})
export class WeeklyScheduleComponent implements OnInit {
  weeklySchedule: WeeklySchedule | null = null;
  currentWeekStart: Date = this.getStartOfWeek(new Date());
  weekDays: Date[] = [];

  loading = false;
  errorMessage = '';
  actionInProgressId: string | null = null;

  constructor(private wasteCollectionService: ApiService) {}

  ngOnInit(): void {
    this.loadWeeklySchedule();
  }

  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(start.setDate(diff));
  }

  loadWeeklySchedule(): void {
    this.loading = true;
    this.errorMessage = '';

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(this.currentWeekStart);
      day.setDate(this.currentWeekStart.getDate() + i);
      this.weekDays.push(day);
    }

    this.wasteCollectionService.getWeeklySchedule(this.currentWeekStart)
      .subscribe({
        next: (schedule) => {
          this.weeklySchedule = schedule;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading weekly schedule:', err);
          this.loading = false;
          this.errorMessage = `Error loading schedule (HTTP ${err.status}).`;
        },
      });
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadWeeklySchedule();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadWeeklySchedule();
  }

  getRoutesForDay(date: Date): Schedule[] {
    if (!this.weeklySchedule) return [];

    const dailySchedule = this.weeklySchedule.dailySchedules.find(
      d => new Date(d.date).toDateString() === date.toDateString()
    );
    return dailySchedule?.routes || [];
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Planned': return 'badge bg-secondary';
      case 'InProgress': return 'badge bg-primary';
      case 'Completed': return 'badge bg-success';
      case 'Delayed': return 'badge bg-warning';
      case 'Cancelled': return 'badge bg-danger';
      default: return 'badge bg-info';
    }
  }

  // ── Status actions ──────────────────────────────────────────────────────
  // Reuse the same wrapper methods driver-route.component already calls
  // (startRoute/completeRoute/reportDelay), which carry the confirmed
  // RouteStatus numeric codes (2/3/4) — avoids guessing at the enum here.
  // NOTE: assumes Schedule has an `id` field matching ScheduleDto.Id from
  // the backend (GetWeeklySchedule already returns it) — if the TS model
  // doesn't declare it yet, add `id: string;` to the Schedule interface.

  startRoute(route: Schedule): void {
    const id = (route as any).id;
    if (!id) return;

    this.actionInProgressId = id;
    this.wasteCollectionService.startRoute(id).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.loadWeeklySchedule();
      },
      error: (err) => {
        console.error('Error starting route:', err);
        this.actionInProgressId = null;
        alert(err.error?.message || 'Failed to start route.');
      },
    });
  }

  completeRoute(route: Schedule): void {
    const id = (route as any).id;
    if (!id) return;

    if (!confirm(`Mark "${route.routeName}" as completed?`)) return;

    this.actionInProgressId = id;
    this.wasteCollectionService.completeRoute(id).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.loadWeeklySchedule();
      },
      error: (err) => {
        console.error('Error completing route:', err);
        this.actionInProgressId = null;
        alert(err.error?.message || 'Failed to complete route.');
      },
    });
  }

  reportDelay(route: Schedule): void {
    const id = (route as any).id;
    if (!id) return;

    const reason = prompt(`Delay reason for "${route.routeName}":`);
    if (!reason) return;

    const minutesStr = prompt('Delay in minutes:', '15');
    const minutes = Number(minutesStr);
    if (!minutesStr || isNaN(minutes) || minutes <= 0) {
      alert('Enter a valid number of minutes.');
      return;
    }

    this.actionInProgressId = id;
    this.wasteCollectionService.reportDelay(id, reason, minutes).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.loadWeeklySchedule();
      },
      error: (err) => {
        console.error('Error reporting delay:', err);
        this.actionInProgressId = null;
        alert(err.error?.message || 'Failed to report delay.');
      },
    });
  }

  isActioning(route: Schedule): boolean {
    return this.actionInProgressId === (route as any).id;
  }
}