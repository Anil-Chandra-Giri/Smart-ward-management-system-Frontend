import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor(private route:Router) {}
  setItem(key: string, value: any): void {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving to local storage', error);
    }
  }
 getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      // Value is a plain string (not JSON-serialised) — return as-is
      return value as unknown as T;
    }
  } catch (error) {
    console.error('Error reading from local storage', error);
    return null;
  }
}
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
    this.route.navigateByUrl('login')
  }
}
