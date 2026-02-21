import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }
 getGeolocation(): Promise<GeolocationCoordinates | null> {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Ensure coords is not null before accessing it
            if (position.coords) {
              resolve(position.coords); // Safe to access position.coords
            } else {
              reject('Coordinates not available');
            }
          },
          (error) => reject(error)
        );
      } else {
        reject('Geolocation is not supported by this browser.');
      }
    });
  }
}
