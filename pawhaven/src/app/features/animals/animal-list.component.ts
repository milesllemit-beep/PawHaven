import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnimalService, AnimalFilters } from '../../core/animal.service';
import { mediaUrl } from '../../core/media';
import { Animal, Paginated } from '../../core/models';

@Component({
  selector: 'app-animal-list',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-slate-800">Find your new companion</h1>
        <p class="mt-1 text-slate-500">Browse animals currently available for adoption.</p>
      </header>

      <form
        class="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        (ngSubmit)="applyFilters()"
      >
        <input
          name="search"
          [(ngModel)]="filters.search"
          placeholder="Search name, breed..."
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <select
          name="species"
          [(ngModel)]="filters.species"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All species</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="rabbit">Rabbit</option>
          <option value="bird">Bird</option>
        </select>
        <select
          name="sex"
          [(ngModel)]="filters.sex"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Any sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          name="size"
          [(ngModel)]="filters.size"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Any size</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
        <button
          type="submit"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="text-slate-500">Loading animals...</p>
      } @else if (animals().length === 0) {
        <p class="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
          No animals match your search.
        </p>
      } @else {
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (animal of animals(); track animal.id) {
            <a
              [routerLink]="['/animals', animal.id]"
              class="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div class="h-48 w-full overflow-hidden bg-slate-100">
                @if (imageFor(animal); as image) {
                  <img
                    [src]="image"
                    [alt]="animal.name"
                    class="h-full w-full object-cover transition group-hover:scale-105"
                  />
                } @else {
                  <div class="flex h-full items-center justify-center text-slate-400">No photo</div>
                }
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-slate-800">{{ animal.name }}</h2>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="statusClass(animal.status)"
                  >
                    {{ animal.status }}
                  </span>
                </div>
                <p class="mt-1 text-sm capitalize text-slate-500">
                  {{ animal.species }}
                  @if (animal.breed) {
                    &middot; {{ animal.breed }}
                  }
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  {{ ageLabel(animal.age_months) }} &middot; {{ animal.sex }}
                </p>
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
            <span>Page {{ page.current_page }} of {{ page.last_page }} ({{ page.total }} animals)</span>
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
export class AnimalListComponent implements OnInit {
  private readonly animalService = inject(AnimalService);
  readonly mediaUrl = mediaUrl;

  readonly animals = signal<Animal[]>([]);
  readonly meta = signal<Paginated<Animal>['meta'] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters: AnimalFilters = {
    search: '',
    species: '',
    sex: '',
    size: '',
    page: 1,
    per_page: 12,
  };

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
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

    this.animalService.list(this.filters).subscribe({
      next: (response) => {
        this.animals.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load animals right now.');
        this.loading.set(false);
      },
    });
  }

  imageFor(animal: Animal): string {
    const photo = animal.primary_photo ?? animal.photos?.[0];
    return photo ? mediaUrl(photo.url) : '';
  }

  ageLabel(months: number | null): string {
    if (months === null || months === undefined) {
      return 'Age unknown';
    }
    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'}`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'adopted':
        return 'bg-slate-200 text-slate-600';
      default:
        return 'bg-slate-200 text-slate-600';
    }
  }
}
