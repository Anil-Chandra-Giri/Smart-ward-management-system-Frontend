import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,  // 👈 add this
} from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';  // 👈 add this
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthInterceptor } from './interceptors/auth.interceptor';  // 👈 add this

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(), // 👈 required for class-based interceptors
    ),
    importProvidersFrom(GoogleMapsModule),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, // 👈 add this
  ],
};