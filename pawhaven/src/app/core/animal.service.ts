import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Animal, Paginated } from './models';

export interface AnimalFilters {
  search?: string;
  species?: string;
  sex?: string;
  size?: string;
  status?: string;
  min_age?: number | null;
  max_age?: number | null;
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
export class AnimalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/animals`;

  list(filters: AnimalFilters = {}): Observable<Paginated<Animal>> {
    return this.http.get<Paginated<Animal>>(this.base, {
      params: buildParams(filters),
    });
  }

  get(id: number): Observable<{ data: Animal }> {
    return this.http.get<{ data: Animal }>(`${this.base}/${id}`);
  }

  create(formData: FormData): Observable<{ data: Animal }> {
    return this.http.post<{ data: Animal }>(this.base, formData);
  }

  update(id: number, formData: FormData): Observable<{ data: Animal }> {
    return this.http.post<{ data: Animal }>(`${this.base}/${id}`, formData);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  deletePhoto(animalId: number, photoId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${animalId}/photos/${photoId}`);
  }
}
