// src/app/services/leaflet.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LeafletService {
  private L: any = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async loadLeaflet(): Promise<any> {
    if (!this.isBrowser) {
      return null;
    }

    if (!this.L) {
      // Dynamically import Leaflet only when in browser
      const leaflet = await import('leaflet');
      this.L = leaflet;
      
      // Fix marker icon issue in Leaflet
      delete (this.L.Icon.Default.prototype as any)._getIconUrl;
      this.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/marker-icon-2x.png',
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
      });
    }
    
    return this.L;
  }

  async loadRoutingMachine(): Promise<any> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const L = await this.loadLeaflet();
      const routingMachine = await import('leaflet-routing-machine');
      return routingMachine;
    } catch (error) {
      console.error('Error loading routing machine:', error);
      return null;
    }
  }
}