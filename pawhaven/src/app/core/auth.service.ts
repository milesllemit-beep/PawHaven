import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, Role, User } from './models';

const TOKEN_KEY = 'pawhaven_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  );

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: Role;
    phone?: string;
    location?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  me(): Observable<User> {
    return this.http.get<{ data: User }>(`${environment.apiUrl}/auth/me`).pipe(
      map((response) => response.data),
      tap((user) => this._user.set(user)),
    );
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this._user.set(null);
    this._token.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private setSession(response: AuthResponse): void {
    this._user.set(response.user);
    this._token.set(response.token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, response.token);
    }
  }
}
