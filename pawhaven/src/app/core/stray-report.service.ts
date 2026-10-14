import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paginated, StrayReport } from './models';

export interface StrayReportFilters {
  search?: string;
  type?: string;
  species?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

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
export class StrayReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/stray-reports`;

  list(filters: StrayReportFilters = {}): Observable<Paginated<StrayReport>> {
    return this.http.get<Paginated<StrayReport>>(this.base, {
      params: buildParams(filters),
    });
  }

  get(id: number): Observable<{ data: StrayReport }> {
    return this.http.get<{ data: StrayReport }>(`${this.base}/${id}`);
  }

  create(formData: FormData): Observable<{ data: StrayReport }> {
    return this.http.post<{ data: StrayReport }>(this.base, formData);
  }

  update(id: number, formData: FormData): Observable<{ data: StrayReport }> {
    return this.http.post<{ data: StrayReport }>(`${this.base}/${id}`, formData);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  deletePhoto(reportId: number, photoId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/${reportId}/photos/${photoId}`,
    );
  }
}
