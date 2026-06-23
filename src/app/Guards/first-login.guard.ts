import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/**
 * Blocks access to ward/citizen/admin routes when IsFirstLogin is still true.
 * Works alongside AuthGuardService — apply both on protected routes.
 */
export const firstLoginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const decoded = authService.decodeToken() as any;

    // JWT claim is stored as the string "True" (C# bool.ToString())
    if (decoded?.IsFirstLogin === 'True') {
      return router.createUrlTree(['/change-password']);
    }

    return true;
  } catch {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  }
};