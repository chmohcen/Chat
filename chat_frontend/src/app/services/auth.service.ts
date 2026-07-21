import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  getCurrentUser(): User {
    return JSON.parse(localStorage.getItem('user') || 'null') as User;
  }

  updateCurrentUser(payload: Partial<User> | FormData): Observable<User> {
    const currentUser = this.getCurrentUser();

    return this.http
      .patch<User>(`${environment.apiEndpoint}/users/${currentUser?.id}/`, payload)
      .pipe(
        tap((user) => {
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  refreshAccessToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${environment.apiEndpoint}/token/refresh/`, {
        refresh: localStorage.getItem('refresh_token')
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access);
        })
      );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  signup(payload: {
    name: string;
    email: string;
    password: string;
    picture?: File;
  }) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('password', payload.password);

    if (payload.picture) {
      formData.append('picture', payload.picture);
    }

    return this.http
      .post<User>(`${environment.apiEndpoint}/users/`, formData)
      .pipe(
        tap((user) => {
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  login(payload: {
    email: string;
    password: string;
  }) {
    const formData = new FormData();
    formData.append('email', payload.email);
    formData.append('password', payload.password);

    return this.http
      .post<{
        access: string;
        refresh: string;
        message: string;
        user: {
          name: string;
          email: string;
          picture: string | null;
          status: 'online' | 'away' | 'offline';
        };
      }>(`${environment.apiEndpoint}/login/`, formData)
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
      );
  }
}
