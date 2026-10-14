import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminStats, Paginated, User } from './models';

function buildParams(source: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  users(filters: { search?: string; role?: string; per_page?: number; page?: number } = {}): Observable<
    Paginated<User>
  > {
    return this.http.get<Paginated<User>>(`${this.base}/users`, {
      params: buildParams(filters),
    });
  }

  updateRole(id: number, role: 'user' | 'admin'): Observable<{ data: User }> {
    return this.http.patch<{ data: User }>(`${this.base}/users/${id}`, { role });
  }

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }
}
