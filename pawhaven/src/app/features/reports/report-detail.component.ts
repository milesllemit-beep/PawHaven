import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage, mediaUrl } from '../../core/media';
import { StrayReport } from '../../core/models';
import { StrayReportService } from '../../core/stray-report.service';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <a routerLink="/reports" class="text-sm text-emerald-700 hover:underline">&larr; Back to reports</a>

      @if (loading()) {
        <p class="mt-6 text-slate-500">Loading...</p>
      } @else if (error()) {
        <p class="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      } @else if (report(); as item) {
        @if (actionError()) {
          <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError() }}</p>
        }

        <div class="mt-4 rounded-xl bg-white p-6 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="typeClass(item.type)">
                {{ item.type }}
              </span>
              <h1 class="mt-2 text-3xl font-bold capitalize text-slate-800">{{ item.species }}</h1>
              <p class="text-slate-500">{{ item.location }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              [class]="item.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ item.status }}
            </span>
          </div>

          @if (item.photos.length) {
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              @for (photo of item.photos; track photo.id) {
                <img [src]="mediaUrl(photo.url)" [alt]="item.species" class="h-32 w-full rounded-lg object-cover" />
              }
            </div>
          }

          <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
            @if (item.breed) {
              <div><dt class="text-slate-400">Breed</dt><dd class="text-slate-700">{{ item.breed }}</dd></div>
            }
            @if (item.color) {
              <div><dt class="text-slate-400">Color</dt><dd class="text-slate-700">{{ item.color }}</dd></div>
            }
            @if (item.occurred_at) {
              <div><dt class="text-slate-400">Date seen</dt><dd class="text-slate-700">{{ item.occurred_at }}</dd></div>
            }
            <div><dt class="text-slate-400">Reported by</dt><dd class="text-slate-700">{{ item.reporter?.name || 'Community' }}</dd></div>
          </dl>

          <p class="mt-4 whitespace-pre-line text-slate-600">{{ item.description }}</p>

          <div class="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
            <p class="font-semibold text-slate-700">Contact</p>
            <p class="text-slate-600">{{ item.contact_name }} &middot; {{ item.contact_phone }}</p>
            @if (item.contact_email) {
              <p class="text-slate-600">{{ item.contact_email }}</p>
            }
          </div>

          @if (canManage()) {
            <div class="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                [disabled]="busy()"
                (click)="toggleStatus(item)"
              >
                {{ item.status === 'open' ? 'Mark as resolved' : 'Reopen report' }}
              </button>
              @if (auth.isAdmin()) {
                <button
                  type="button"
                  class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  [disabled]="busy()"
                  (click)="remove(item.id)"
                >
                  Delete report
                </button>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class ReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(StrayReportService);
  readonly auth = inject(AuthService);
  readonly mediaUrl = mediaUrl;

  readonly report = signal<StrayReport | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busy = signal(false);

  private reportId = 0;

  ngOnInit(): void {
    this.reportId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.reportService.get(this.reportId).subscribe({
      next: ({ data }) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This report could not be found.');
        this.loading.set(false);
      },
    });
  }

  canManage(): boolean {
    const item = this.report();
    const user = this.auth.user();
    if (!item || !user) {
      return false;
    }
    return user.role === 'admin' || item.reporter?.id === user.id;
  }

  toggleStatus(item: StrayReport): void {
    this.busy.set(true);
    this.actionError.set(null);

    const formData = new FormData();
    formData.append('status', item.status === 'open' ? 'resolved' : 'open');

    this.reportService.update(item.id, formData).subscribe({
      next: ({ data }) => {
        this.report.set(data);
        this.busy.set(false);
      },
      error: (err) => {
        this.actionError.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }

  remove(id: number): void {
    this.busy.set(true);
    this.reportService.remove(id).subscribe({
      next: () => this.router.navigate(['/reports']),
      error: (err) => {
        this.actionError.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }

  typeClass(type: string): string {
    switch (type) {
      case 'lost':
        return 'bg-red-100 text-red-700';
      case 'found':
        return 'bg-sky-100 text-sky-700';
      case 'injured':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-200 text-slate-600';
    }
  }
}
