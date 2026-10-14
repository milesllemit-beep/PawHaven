import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginOrRegister =
        request.url.includes('/auth/login') || request.url.includes('/auth/register');
      const isBootstrap = request.url.includes('/auth/me');

      if (error.status === 401 && !isLoginOrRegister) {
        auth.clearSession();
        if (!isBootstrap) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};
