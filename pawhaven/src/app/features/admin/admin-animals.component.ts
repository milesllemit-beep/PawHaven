import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimalService } from '../../core/animal.service';
import { errorMessage, mediaUrl } from '../../core/media';
import { Animal, Paginated } from '../../core/models';

@Component({
  selector: 'app-admin-animals',
  imports: [RouterLink],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-2">
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
      <a
        routerLink="/admin/animals/new"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Add animal
      </a>
    </div>

    @if (error()) {
      <p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="text-slate-500">Loading animals...</p>
    } @else if (animals().length === 0) {
      <p class="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">No animals found.</p>
    } @else {
      <div class="overflow-hidden rounded-xl bg-white shadow-sm">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">Animal</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Photos</th>
              <th class="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (animal of animals(); track animal.id) {
              <tr>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                      @if (animal.primary_photo ?? animal.photos[0]; as photo) {
                        <img [src]="mediaUrl(photo.url)" [alt]="animal.name" class="h-full w-full object-cover" />
                      }
                    </div>
                    <div>
                      <p class="font-medium text-slate-700">{{ animal.name }}</p>
                      <p class="text-xs capitalize text-slate-400">{{ animal.species }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusClass(animal.status)">
                    {{ animal.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-500">{{ animal.photos.length }}</td>
                <td class="px-4 py-3 text-right">
                  <a
                    [routerLink]="['/admin/animals', animal.id, 'edit']"
                    class="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Edit
                  </a>
                  <button
                    type="button"
                    class="ml-3 text-sm font-medium text-red-600 hover:underline"
                    (click)="remove(animal.id)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (meta(); as page) {
        <div class="mt-4 flex items-center justify-between text-sm text-slate-600">
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
  `,
})
export class AdminAnimalsComponent implements OnInit {
  private readonly animalService = inject(AnimalService);
  readonly mediaUrl = mediaUrl;

  readonly animals = signal<Animal[]>([]);
  readonly meta = signal<Paginated<Animal>['meta'] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'adopted', label: 'Adopted' },
  ];

  status = 'all';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: string): void {
    this.status = status;
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.animalService.list({ status: this.status, page: this.page, per_page: 15 }).subscribe({
      next: (response) => {
        this.animals.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load animals.');
        this.loading.set(false);
      },
    });
  }

  remove(id: number): void {
    this.animalService.remove(id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-200 text-slate-600';
    }
  }
}
