import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Paginated,
  RescuerDashboard,
  RescueCase,
  RescueMilestone,
  RescueStatus,
} from './models';

export interface RescueCaseFilters {
  search?: string;
  status?: RescueStatus | '';
  species?: string;
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
export class RescueService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/rescuer`;

  dashboard(): Observable<RescuerDashboard> {
    return this.http.get<RescuerDashboard>(`${this.base}/dashboard`);
  }

  listCases(filters: RescueCaseFilters = {}): Observable<Paginated<RescueCase>> {
    return this.http.get<Paginated<RescueCase>>(`${this.base}/cases`, {
      params: buildParams(filters),
    });
  }

  getCase(id: number): Observable<{ data: RescueCase }> {
    return this.http.get<{ data: RescueCase }>(`${this.base}/cases/${id}`);
  }

  createCase(formData: FormData): Observable<{ data: RescueCase }> {
    return this.http.post<{ data: RescueCase }>(`${this.base}/cases`, formData);
  }

  updateCase(id: number, formData: FormData): Observable<{ data: RescueCase }> {
    return this.http.post<{ data: RescueCase }>(`${this.base}/cases/${id}`, formData);
  }

  updateStatus(id: number, status: RescueStatus): Observable<{ data: RescueCase }> {
    return this.http.patch<{ data: RescueCase }>(`${this.base}/cases/${id}/status`, { status });
  }

  deleteCase(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/cases/${id}`);
  }

  addPhotos(id: number, formData: FormData): Observable<{ data: RescueCase }> {
    return this.http.post<{ data: RescueCase }>(`${this.base}/cases/${id}/photos`, formData);
  }

  deletePhoto(caseId: number, photoId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/cases/${caseId}/photos/${photoId}`);
  }

  addMilestone(caseId: number, formData: FormData): Observable<{ data: RescueMilestone }> {
    return this.http.post<{ data: RescueMilestone }>(
      `${this.base}/cases/${caseId}/milestones`,
      formData,
    );
  }

  updateMilestone(
    caseId: number,
    milestoneId: number,
    body: Partial<Pick<RescueMilestone, 'title' | 'description' | 'type' | 'occurred_at'>>,
  ): Observable<{ data: RescueMilestone }> {
    return this.http.patch<{ data: RescueMilestone }>(
      `${this.base}/cases/${caseId}/milestones/${milestoneId}`,
      body,
    );
  }

  deleteMilestone(caseId: number, milestoneId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/cases/${caseId}/milestones/${milestoneId}`,
    );
  }

  deleteMilestonePhoto(
    caseId: number,
    milestoneId: number,
    photoId: number,
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/cases/${caseId}/milestones/${milestoneId}/photos/${photoId}`,
    );
  }
}
