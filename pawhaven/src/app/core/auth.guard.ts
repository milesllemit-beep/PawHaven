import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.user()) {
    return true;
  }

  return auth.me().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};

export const rescuerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const ensureRescuer = () => {
    if (auth.isRescuer()) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };

  if (auth.user()) {
    return ensureRescuer();
  }

  return auth.me().pipe(
    map(() => ensureRescuer()),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const ensureAdmin = () => {
    if (auth.isAdmin()) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };

  if (auth.user()) {
    return ensureAdmin();
  }

  return auth.me().pipe(
    map(() => ensureAdmin()),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
