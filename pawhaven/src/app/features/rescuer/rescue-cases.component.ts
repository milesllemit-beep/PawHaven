import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/media';
import { RescueCase, RescueCaseSummary, RescueStatus } from '../../core/models';
import {
  animalLabel,
  formatDate,
  rescueStatusClass,
  RESCUE_STATUS_LABELS,
  RESCUE_STATUS_ORDER,
  speciesIcon,
} from '../../core/rescue-status';
import { RescueCasePage, RescueService } from '../../core/rescue.service';

@Component({
  selector: 'app-rescue-cases',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">My Rescue Cases</h2>
        <p class="mt-1 text-slate-500">
          Every animal you have documented and is currently being tracked through its journey.
        </p>
      </div>
      <a
        routerLink="/rescuer/cases/new"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        + Report a Rescue
      </a>
    </div>

    <!-- Summary counts (from the API, scoped to this rescuer) -->
    @if (summary(); as totals) {
      <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        @for (card of summaryCards(totals); track card.status) {
          <button
            type="button"
            class="rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            [class]="filters.status === card.status ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'"
            [attr.aria-pressed]="filters.status === card.status"
            (click)="setStatus(filters.status === card.status ? '' : card.status)"
          >
            <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</dt>
            <dd class="mt-1 text-2xl font-bold text-slate-800">{{ card.value }}</dd>
          </button>
        }
      </dl>
    }

    <!-- Filters -->
    <div class="mt-5 space-y-3">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          [class]="filters.status === ''
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-400'"
          [attr.aria-pressed]="filters.status === ''"
          (click)="setStatus('')"
        >
          All ({{ totalCount() }})
        </button>
        @for (option of statusOptions; track option.value) {
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            [class]="filters.status === option.value
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-400'"
            [attr.aria-pressed]="filters.status === option.value"
            (click)="setStatus(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      <form class="flex flex-col gap-3 sm:flex-row" (ngSubmit)="load()">
        <div class="flex-1">
          <label for="case-search" class="sr-only">Search rescue cases</label>
          <div class="relative">
            <input
              id="case-search"
              name="search"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange()"
              type="search"
              placeholder="Search by name, breed, location or description..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm focus:border-emerald-500 focus:outline-none"
            />
            @if (filters.search) {
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                (click)="clearSearch()"
              >
                Clear
              </button>
            }
          </div>
        </div>
        <div>
          <label for="case-species" class="sr-only">Filter by species</label>
          <select
            id="case-species"
            name="species"
            [(ngModel)]="filters.species"
            (ngModelChange)="onFilterChange()"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none sm:w-48"
          >
            <option value="">All species</option>
            @for (species of speciesOptions(); track species) {
              <option [value]="species">{{ species }}</option>
            }
          </select>
        </div>
        @if (hasActiveFilters()) {
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            (click)="clearFilters()"
          >
            Clear filters
          </button>
        }
      </form>
    </div>

    <!-- Results -->
    <div class="mt-5" aria-live="polite">
      @if (loading()) {
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (n of skeletons; track n) {
            <div class="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div class="h-44 w-full bg-slate-200"></div>
              <div class="space-y-3 p-4">
                <div class="h-4 w-2/3 rounded bg-slate-200"></div>
                <div class="h-3 w-1/2 rounded bg-slate-200"></div>
                <div class="h-3 w-3/4 rounded bg-slate-200"></div>
              </div>
            </div>
          }
        </div>
        <span class="sr-only">Loading rescue cases...</span>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-700">{{ error() }}</p>
          <button
            type="button"
            class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            (click)="load()"
          >
            Retry
          </button>
        </div>
      } @else if (noCasesAtAll()) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div class="text-4xl" aria-hidden="true">🐾</div>
          <h3 class="mt-3 text-lg font-semibold text-slate-800">No rescue cases yet</h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">
            When you rescue an animal, create a case to record its details, upload photos and
            track its progress on the Paw Progress Passport.
          </p>
          <a
            routerLink="/rescuer/cases/new"
            class="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Report your first rescue
          </a>
        </div>
      } @else if (cases().length === 0) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div class="text-4xl" aria-hidden="true">🔍</div>
          <h3 class="mt-3 text-lg font-semibold text-slate-800">No matching rescue cases</h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">
            No cases match your current search or filters.
          </p>
          <button
            type="button"
            class="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            (click)="clearFilters()"
          >
            Clear filters
          </button>
        </div>
      } @else {
        <p class="mb-3 text-sm text-slate-500">
          Showing {{ cases().length }} of {{ totalCount() }} case(s)
        </p>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (case of cases(); track case.id) {
            <a
              [routerLink]="['/rescuer/cases', case.id]"
              class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              [attr.aria-label]="'View rescue case for ' + animalLabel(case.name)"
            >
              <div class="h-44 w-full overflow-hidden bg-slate-100">
                @if (case.primary_photo) {
                  <img
                    [src]="mediaUrl(case.primary_photo.url)"
                    [alt]="animalLabel(case.name)"
                    class="h-full w-full object-cover transition group-hover:scale-105"
                  />
                } @else {
                  <div class="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
                    <span class="text-4xl" aria-hidden="true">{{ speciesIcon(case.species) }}</span>
                    <span class="text-xs">No photo yet</span>
                  </div>
                }
              </div>
              <div class="flex flex-1 flex-col p-4">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-lg font-semibold text-slate-800">
                    {{ animalLabel(case.name) }}
                  </h3>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    [class]="statusClass(case.status)"
                  >
                    {{ statusLabel(case.status) }}
                  </span>
                </div>
                <p class="mt-1 text-sm capitalize text-slate-500">
                  {{ case.species }}
                  @if (case.breed) {
                    &middot; {{ case.breed }}
                  }
                </p>
                <p class="mt-1 truncate text-sm text-slate-500" [title]="case.rescue_location">
                  {{ case.rescue_location }}
                </p>
                <div class="mt-auto flex items-center justify-between pt-3 text-xs text-slate-400">
                  <span>Rescued {{ formatDate(case.rescued_at) }}</span>
                  <span class="font-medium text-emerald-700 group-hover:underline">View case &rarr;</span>
                </div>
              </div>
            </a>
          }
        </div>

        @if (meta(); as page) {
          @if (page.last_page > 1) {
            <nav class="mt-6 flex items-center justify-between text-sm text-slate-600" aria-label="Pagination">
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
            </nav>
          }
        }
      }
    </div>
  `,
})
export class RescueCasesComponent implements OnInit {
  private readonly rescue = inject(RescueService);

  readonly cases = signal<RescueCase[]>([]);
  readonly meta = signal<RescueCasePage['meta'] | null>(null);
  readonly summary = signal<RescueCaseSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  readonly mediaUrl = mediaUrl;
  readonly animalLabel = animalLabel;
  readonly speciesIcon = speciesIcon;
  readonly formatDate = formatDate;
  readonly statusClass = rescueStatusClass;
  readonly statusLabel = (status: RescueStatus) => RESCUE_STATUS_LABELS[status];

  readonly statusOptions = RESCUE_STATUS_ORDER.map((status) => ({
    value: status,
    label: RESCUE_STATUS_LABELS[status],
  }));

  filters = {
    search: '',
    status: '' as RescueStatus | '',
    species: '',
    page: 1,
    per_page: 12,
  };

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  speciesOptions(): string[] {
    return this.summary()?.species ?? [];
  }

  totalCount(): number {
    return this.summary()?.total ?? this.meta()?.total ?? 0;
  }

  noCasesAtAll(): boolean {
    return this.totalCount() === 0 && !this.hasActiveFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.search.trim() !== '' ||
      this.filters.status !== '' ||
      this.filters.species !== ''
    );
  }

  summaryCards(totals: RescueCaseSummary) {
    return [
      { status: '' as RescueStatus | '', label: 'Total', value: totals.total },
      ...RESCUE_STATUS_ORDER.map((status) => ({
        status: status as RescueStatus | '',
        label: RESCUE_STATUS_LABELS[status],
        value: totals.by_status[status] ?? 0,
      })),
    ];
  }

  setStatus(status: RescueStatus | ''): void {
    this.filters.status = status;
    this.filters.page = 1;
    this.load();
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.filters.page = 1;
      this.load();
    }, 300);
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.load();
  }

  clearSearch(): void {
    this.filters.search = '';
    this.filters.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.status = '';
    this.filters.species = '';
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

    this.rescue.listCases(this.filters).subscribe({
      next: (response) => {
        this.cases.set(response.data);
        this.meta.set(response.meta);
        this.summary.set(response.summary ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your rescue cases right now.');
        this.loading.set(false);
      },
    });
  }
}
