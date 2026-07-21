import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const accessToken = localStorage.getItem('access_token');
  const authenticatedRequest = accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  if (isAuthenticationRequest(request.url) || !accessToken) {
    return next(authenticatedRequest);
  }

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !localStorage.getItem('refresh_token')) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap(({ access }) =>
          next(request.clone({ setHeaders: { Authorization: `Bearer ${access}` } }))
        ),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function isAuthenticationRequest(url: string): boolean {
  return url === `${environment.apiEndpoint}/login/` || url === `${environment.apiEndpoint}/token/refresh/`;
}
