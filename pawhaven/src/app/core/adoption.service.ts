import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdoptionApplication, Paginated } from './models';

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
export class AdoptionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/adoption-applications`;

  mine(filters: { status?: string; per_page?: number; page?: number } = {}): Observable<
    Paginated<AdoptionApplication>
  > {
    return this.http.get<Paginated<AdoptionApplication>>(this.base, {
      params: buildParams(filters),
    });
  }

  apply(payload: { animal_id: number; message?: string }): Observable<{ data: AdoptionApplication }> {
    return this.http.post<{ data: AdoptionApplication }>(this.base, payload);
  }

  get(id: number): Observable<{ data: AdoptionApplication }> {
    return this.http.get<{ data: AdoptionApplication }>(`${this.base}/${id}`);
  }

  withdraw(id: number): Observable<{ data: AdoptionApplication }> {
    return this.http.post<{ data: AdoptionApplication }>(`${this.base}/${id}/withdraw`, {});
  }

  adminIndex(filters: { status?: string; animal_id?: number; per_page?: number; page?: number } = {}): Observable<
    Paginated<AdoptionApplication>
  > {
    return this.http.get<Paginated<AdoptionApplication>>(
      `${environment.apiUrl}/admin/adoption-applications`,
      { params: buildParams(filters) },
    );
  }

  review(
    id: number,
    payload: { status: 'approved' | 'rejected'; review_notes?: string },
  ): Observable<{ data: AdoptionApplication }> {
    return this.http.patch<{ data: AdoptionApplication }>(`${this.base}/${id}/review`, payload);
  }
}
