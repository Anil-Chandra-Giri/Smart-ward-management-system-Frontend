// src/app/components/weekly-schedule/weekly-schedule.component.ts

import { Component, OnInit } from '@angular/core';
import { WeeklySchedule, Schedule } from '../../Models/WasteCollectionRoute';
import { ApiService } from '../../Services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weekly-schedule',
  templateUrl: './weekly-schedule.component.html',
  styleUrls: ['./weekly-schedule.component.css'],
  imports:[CommonModule]
})
export class WeeklyScheduleComponent implements OnInit {
  weeklySchedule: WeeklySchedule | null = null;
  currentWeekStart: Date = this.getStartOfWeek(new Date());
  weekDays: Date[] = [];

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
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(this.currentWeekStart);
      day.setDate(this.currentWeekStart.getDate() + i);
      this.weekDays.push(day);
    }

    this.wasteCollectionService.getWeeklySchedule(this.currentWeekStart)
      .subscribe(schedule => {
        this.weeklySchedule = schedule;
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
}