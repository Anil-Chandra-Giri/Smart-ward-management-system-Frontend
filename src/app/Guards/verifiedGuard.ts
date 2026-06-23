import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/**
 * Blocks citizen action routes if IsVerified is not True in the JWT.
 * Redirects to /citizen/pending-verification.
 * Staff/Admin/Officer pass through.
 */
export const verifiedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const decoded = authService.decodeToken() as any;

    // Non-citizens always pass through
    if (decoded?.Role?.toLowerCase() !== 'citizen') {
      return true;
    }

    // Citizens need IsVerified = "True" (C# bool.ToString())
    if (decoded?.IsVerified === 'True') {
      return true;
    }

    return router.createUrlTree(['/citizen/pending-verification']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};