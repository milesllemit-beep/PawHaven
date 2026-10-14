import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdoptionService } from '../../core/adoption.service';
import { errorMessage, mediaUrl } from '../../core/media';
import { AdoptionApplication } from '../../core/models';

@Component({
  selector: 'app-admin-applications',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mb-4 flex flex-wrap gap-2">
      @for (option of statusOptions; track option.value) {
        <button
          type="button"
          class="rounded-full border px-4 py-1.5 text-sm font-medium"
          [class]="status === option.value
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-400'"
          (click)="setStatus(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @if (error()) {
      <p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="text-slate-500">Loading applications...</p>
    } @else if (applications().length === 0) {
      <p class="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">No applications found.</p>
    } @else {
      <div class="space-y-4">
        @for (application of applications(); track application.id) {
          <div class="rounded-xl bg-white p-5 shadow-sm">
            <div class="flex items-start gap-4">
              <div class="h-20 w-20 flex-none overflow-hidden rounded-lg bg-slate-100">
                @if (application.animal?.primary_photo; as photo) {
                  <img [src]="mediaUrl(photo.url)" [alt]="application.animal?.name" class="h-full w-full object-cover" />
                }
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <a
                    [routerLink]="['/animals', application.animal?.id]"
                    class="text-lg font-semibold text-slate-800 hover:underline"
                  >
                    {{ application.animal?.name }}
                  </a>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="statusClass(application.status)">
                    {{ application.status }}
                  </span>
                </div>
                <p class="text-sm text-slate-500">
                  Applicant: {{ application.applicant?.name }} ({{ application.applicant?.email }})
                </p>
                @if (application.message) {
                  <p class="mt-2 text-sm text-slate-600">{{ application.message }}</p>
                }
                @if (application.review_notes) {
                  <p class="mt-1 text-xs text-slate-400">Review note: {{ application.review_notes }}</p>
                }

                @if (application.status === 'pending') {
                  <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      [name]="'notes-' + application.id"
                      [(ngModel)]="notes[application.id]"
                      placeholder="Review note (optional)"
                      class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      [disabled]="busyId() === application.id"
                      (click)="review(application.id, 'approved')"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      [disabled]="busyId() === application.id"
                      (click)="review(application.id, 'rejected')"
                    >
                      Reject
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AdminApplicationsComponent implements OnInit {
  private readonly adoptionService = inject(AdoptionService);
  readonly mediaUrl = mediaUrl;

  readonly applications = signal<AdoptionApplication[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'all', label: 'All' },
  ];

  status = 'pending';
  notes: Record<number, string> = {};

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: string): void {
    this.status = status;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adoptionService.adminIndex({ status: this.status, per_page: 20 }).subscribe({
      next: (response) => {
        this.applications.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load applications.');
        this.loading.set(false);
      },
    });
  }

  review(id: number, status: 'approved' | 'rejected'): void {
    this.busyId.set(id);
    this.adoptionService.review(id, { status, review_notes: this.notes[id] || undefined }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.error.set(errorMessage(err));
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'withdrawn':
        return 'bg-slate-200 text-slate-600';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }
}
