import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdoptionService } from '../../core/adoption.service';
import { errorMessage, mediaUrl } from '../../core/media';
import { AdoptionApplication } from '../../core/models';

@Component({
  selector: 'app-my-applications',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-8">
      <h1 class="text-3xl font-bold text-slate-800">My adoption applications</h1>
      <p class="mt-1 text-slate-500">Track the status of the animals you have applied for.</p>

      @if (error()) {
        <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="mt-6 text-slate-500">Loading...</p>
      } @else if (applications().length === 0) {
        <p class="mt-6 rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
          You have not submitted any applications yet.
          <a routerLink="/animals" class="font-semibold text-emerald-700 hover:underline">Browse animals</a>
        </p>
      } @else {
        <div class="mt-6 space-y-4">
          @for (application of applications(); track application.id) {
            <div class="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <div class="h-20 w-20 flex-none overflow-hidden rounded-lg bg-slate-100">
                @if (application.animal?.primary_photo; as photo) {
                  <img [src]="mediaUrl(photo.url)" [alt]="application.animal?.name" class="h-full w-full object-cover" />
                } @else {
                  <div class="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                }
              </div>
              <div class="flex-1">
                <a
                  [routerLink]="['/animals', application.animal?.id]"
                  class="text-lg font-semibold text-slate-800 hover:underline"
                >
                  {{ application.animal?.name }}
                </a>
                <p class="text-sm text-slate-500">Applied {{ shortDate(application.created_at) }}</p>
                @if (application.review_notes) {
                  <p class="mt-1 text-sm text-slate-500">Note: {{ application.review_notes }}</p>
                }
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="statusClass(application.status)">
                  {{ application.status }}
                </span>
                @if (application.status === 'pending') {
                  <button
                    type="button"
                    class="text-xs font-medium text-red-600 hover:underline"
                    (click)="withdraw(application.id)"
                  >
                    Withdraw
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class MyApplicationsComponent implements OnInit {
  private readonly adoptionService = inject(AdoptionService);
  readonly mediaUrl = mediaUrl;

  readonly applications = signal<AdoptionApplication[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adoptionService.mine().subscribe({
      next: (response) => {
        this.applications.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your applications.');
        this.loading.set(false);
      },
    });
  }

  withdraw(id: number): void {
    this.adoptionService.withdraw(id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  shortDate(value: string | undefined): string {
    return value ? value.substring(0, 10) : '';
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
