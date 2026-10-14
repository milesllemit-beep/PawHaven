import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mediaUrl } from '../../core/media';
import { Paginated, StrayReport } from '../../core/models';
import { StrayReportFilters, StrayReportService } from '../../core/stray-report.service';

@Component({
  selector: 'app-report-list',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Lost, found &amp; injured animals</h1>
          <p class="mt-1 text-slate-500">
            Community reports. These are standalone reports and are not adoption listings.
          </p>
        </div>
        @if (auth.isAuthenticated()) {
          <a
            routerLink="/reports/new"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            File a report
          </a>
        }
      </header>

      <div class="mb-6 flex flex-wrap gap-2">
        @for (option of typeOptions; track option.value) {
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm font-medium"
            [class]="filters.type === option.value
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-400'"
            (click)="setType(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="text-slate-500">Loading reports...</p>
      } @else if (reports().length === 0) {
        <p class="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">No reports found.</p>
      } @else {
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (report of reports(); track report.id) {
            <a
              [routerLink]="['/reports', report.id]"
              class="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div class="h-44 w-full overflow-hidden bg-slate-100">
                @if (report.photos.length) {
                  <img [src]="mediaUrl(report.photos[0].url)" [alt]="report.species" class="h-full w-full object-cover" />
                } @else {
                  <div class="flex h-full items-center justify-center text-slate-400">No photo</div>
                }
              </div>
              <div class="p-4">
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="typeClass(report.type)">
                  {{ report.type }}
                </span>
                <h2 class="mt-2 text-lg font-semibold capitalize text-slate-800">{{ report.species }}</h2>
                <p class="text-sm text-slate-500">{{ report.location }}</p>
                <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ report.description }}</p>
                @if (report.status === 'resolved') {
                  <span class="mt-2 inline-block text-xs font-medium text-emerald-600">Resolved</span>
                }
              </div>
            </a>
          }
        </div>

        @if (meta(); as page) {
          <div class="mt-6 flex items-center justify-between text-sm text-slate-600">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              [disabled]="page.current_page <= 1"
              (click)="goToPage(page.current_page - 1)"
            >
              Previous
            </button>
            <span>Page {{ page.current_page }} of {{ page.last_page }}</span>
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              [disabled]="page.current_page >= page.last_page"
              (click)="goToPage(page.current_page + 1)"
            >
              Next
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class ReportListComponent implements OnInit {
  private readonly reportService = inject(StrayReportService);
  readonly auth = inject(AuthService);
  readonly mediaUrl = mediaUrl;

  readonly reports = signal<StrayReport[]>([]);
  readonly meta = signal<Paginated<StrayReport>['meta'] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly typeOptions = [
    { value: '', label: 'All' },
    { value: 'lost', label: 'Lost' },
    { value: 'found', label: 'Found' },
    { value: 'injured', label: 'Injured' },
  ];

  readonly filters: StrayReportFilters = {
    type: '',
    status: 'all',
    page: 1,
    per_page: 12,
  };

  ngOnInit(): void {
    this.load();
  }

  setType(type: string): void {
    this.filters.type = type;
    this.filters.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.list(this.filters).subscribe({
      next: (response) => {
        this.reports.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load reports right now.');
        this.loading.set(false);
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
