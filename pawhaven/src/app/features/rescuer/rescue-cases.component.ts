import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/media';
import { Paginated, RescueCase, RescueStatus } from '../../core/models';
import {
  animalLabel,
  formatDate,
  rescueStatusClass,
  RESCUE_STATUS_LABELS,
  RESCUE_STATUS_ORDER,
  speciesIcon,
} from '../../core/rescue-status';
import { RescueService } from '../../core/rescue.service';

@Component({
  selector: 'app-rescue-cases',
  imports: [FormsModule, RouterLink],
  template: `
    <div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-emerald-950">My Rescue Cases</h2>
        <a
          routerLink="/rescuer/cases/new"
          class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          + Report a Rescue
        </a>
      </div>

      <!-- Filters -->
      <div class="mt-5 space-y-3">
        <div class="flex flex-wrap gap-2">
          @for (option of statusOptions; track option.value) {
            <button
              type="button"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition"
              [class]="
                filters.status === option.value
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-emerald-900/15 bg-white text-emerald-900/70 hover:border-emerald-500'
              "
              (click)="setStatus(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            name="search"
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()"
            placeholder="Search by name, breed, or location..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <input
            name="species"
            [(ngModel)]="filters.species"
            (ngModelChange)="onFilterChange()"
            list="species-filter"
            placeholder="Species"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none sm:w-48"
          />
          <datalist id="species-filter">
            <option value="dog"></option>
            <option value="cat"></option>
            <option value="rabbit"></option>
            <option value="bird"></option>
          </datalist>
        </div>
      </div>

      @if (error()) {
        <p class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="mt-5 text-emerald-900/60">Loading rescue cases...</p>
      } @else if (cases().length === 0) {
        <div class="mt-5 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-10 text-center">
          <div class="text-4xl" aria-hidden="true">🐾</div>
          <p class="mt-3 font-semibold text-emerald-950">No rescue cases found</p>
          <p class="mt-1 text-sm text-emerald-900/60">
            @if (filters.search || filters.species || filters.status) {
              Try adjusting your filters.
            } @else {
              Create your first rescue case to get started.
            }
          </p>
        </div>
      } @else {
        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (case of cases(); track case.id) {
            <a
              [routerLink]="['/rescuer/cases', case.id]"
              class="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <div class="h-44 w-full overflow-hidden bg-emerald-50">
                @if (case.primary_photo) {
                  <img
                    [src]="mediaUrl(case.primary_photo.url)"
                    [alt]="animalLabel(case.name)"
                    class="h-full w-full object-cover transition group-hover:scale-105"
                  />
                } @else {
                  <div class="flex h-full items-center justify-center text-5xl" aria-hidden="true">
                    {{ speciesIcon(case.species) }}
                  </div>
                }
              </div>
              <div class="p-4">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-lg font-semibold text-emerald-950">
                    {{ animalLabel(case.name) }}
                  </h3>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    [class]="statusClass(case.status)"
                  >
                    {{ statusLabel(case.status) }}
                  </span>
                </div>
                <p class="mt-1 text-sm capitalize text-emerald-900/70">
                  {{ case.species }}
                  @if (case.breed) {
                    &middot; {{ case.breed }}
                  }
                </p>
                <p class="mt-1 truncate text-sm text-emerald-900/60">
                  {{ case.rescue_location }}
                </p>
                <p class="mt-2 text-xs text-emerald-900/50">
                  Rescued {{ formatDate(case.rescued_at) }}
                </p>
              </div>
            </a>
          }
        </div>

        @if (meta(); as page) {
          <div class="mt-6 flex items-center justify-between text-sm text-emerald-900/70">
            <button
              type="button"
              class="rounded-lg border border-emerald-900/15 bg-white px-3 py-1.5 disabled:opacity-40"
              [disabled]="page.current_page <= 1"
              (click)="goToPage(page.current_page - 1)"
            >
              Previous
            </button>
            <span>Page {{ page.current_page }} of {{ page.last_page }} &middot; {{ page.total }} case(s)</span>
            <button
              type="button"
              class="rounded-lg border border-emerald-900/15 bg-white px-3 py-1.5 disabled:opacity-40"
              [disabled]="page.current_page >= page.last_page"
              (click)="goToPage(page.current_page + 1)"
            >
              Next
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class RescueCasesComponent implements OnInit {
  private readonly rescue = inject(RescueService);

  readonly cases = signal<RescueCase[]>([]);
  readonly meta = signal<Paginated<RescueCase>['meta'] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly mediaUrl = mediaUrl;
  readonly animalLabel = animalLabel;
  readonly speciesIcon = speciesIcon;
  readonly formatDate = formatDate;
  readonly statusClass = rescueStatusClass;
  readonly statusLabel = (status: RescueStatus) => RESCUE_STATUS_LABELS[status];

  readonly statusOptions: { value: RescueStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    ...RESCUE_STATUS_ORDER.map((status) => ({
      value: status as RescueStatus | '',
      label: RESCUE_STATUS_LABELS[status],
    })),
  ];

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
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your rescue cases right now.');
        this.loading.set(false);
      },
    });
  }
}
