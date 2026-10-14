import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnimalService } from '../../core/animal.service';
import { errorMessage, mediaUrl, toFormData } from '../../core/media';
import { Animal } from '../../core/models';

@Component({
  selector: 'app-animal-form',
  imports: [FormsModule, RouterLink],
  template: `
    <a routerLink="/admin/animals" class="text-sm text-emerald-700 hover:underline">&larr; Back to animals</a>
    <h2 class="mt-3 text-2xl font-bold text-slate-800">
      {{ isEdit() ? 'Edit animal' : 'Add animal' }}
    </h2>

    @if (error()) {
      <p class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }

    <form class="mt-5 space-y-4 rounded-xl bg-white p-6 shadow-sm" (ngSubmit)="submit()">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Name *</label>
          <input
            name="name"
            [(ngModel)]="model.name"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Species *</label>
          <input
            name="species"
            [(ngModel)]="model.species"
            required
            placeholder="dog, cat..."
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Breed</label>
          <input
            name="breed"
            [(ngModel)]="model.breed"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Age (months)</label>
          <input
            type="number"
            name="age_months"
            [(ngModel)]="model.age_months"
            min="0"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Sex *</label>
          <select
            name="sex"
            [(ngModel)]="model.sex"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Size</label>
          <select
            name="size"
            [(ngModel)]="model.size"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Unspecified</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            [(ngModel)]="model.status"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="adopted">Adopted</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          [(ngModel)]="model.description"
          rows="4"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        ></textarea>
      </div>

      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="vaccinated" [(ngModel)]="model.vaccinated" /> Vaccinated
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="sterilized" [(ngModel)]="model.sterilized" /> Sterilized
        </label>
      </div>

      @if (existingPhotos().length) {
        <div>
          <p class="mb-2 text-sm font-medium text-slate-700">Existing photos</p>
          <div class="flex flex-wrap gap-3">
            @for (photo of existingPhotos(); track photo.id) {
              <div class="relative">
                <img [src]="mediaUrl(photo.url)" class="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  class="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs text-white"
                  (click)="deletePhoto(photo.id)"
                >
                  ×
                </button>
              </div>
            }
          </div>
        </div>
      }

      <div>
        <label class="block text-sm font-medium text-slate-700">Add photos</label>
        <input type="file" accept="image/*" multiple (change)="onFiles($event)" class="mt-1 w-full text-sm text-slate-600" />
      </div>

      <button
        type="submit"
        class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        [disabled]="submitting()"
      >
        {{ submitting() ? 'Saving...' : 'Save animal' }}
      </button>
    </form>
  `,
})
export class AnimalFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly animalService = inject(AnimalService);
  readonly mediaUrl = mediaUrl;

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly existingPhotos = signal<Animal['photos']>([]);

  private animalId: number | null = null;
  files: File[] = [];

  model = {
    name: '',
    species: '',
    breed: '',
    age_months: null as number | null,
    sex: 'unknown',
    size: '',
    status: 'available',
    description: '',
    vaccinated: false,
    sterilized: false,
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.animalId = Number(idParam);
      this.isEdit.set(true);
      this.animalService.get(this.animalId).subscribe({
        next: ({ data }) => {
          this.model = {
            name: data.name,
            species: data.species,
            breed: data.breed ?? '',
            age_months: data.age_months,
            sex: data.sex,
            size: data.size ?? '',
            status: data.status,
            description: data.description ?? '',
            vaccinated: data.vaccinated,
            sterilized: data.sterilized,
          };
          this.existingPhotos.set(data.photos ?? []);
        },
        error: () => this.error.set('Unable to load this animal.'),
      });
    }
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.files = input.files ? Array.from(input.files) : [];
  }

  deletePhoto(photoId: number): void {
    if (!this.animalId) {
      return;
    }
    this.animalService.deletePhoto(this.animalId, photoId).subscribe({
      next: () => this.existingPhotos.update((list) => list.filter((photo) => photo.id !== photoId)),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  submit(): void {
    this.submitting.set(true);
    this.error.set(null);

    const formData = toFormData(this.model as unknown as Record<string, unknown>, 'photos[]', this.files);

    const request$ = this.animalId
      ? this.animalService.update(this.animalId, formData)
      : this.animalService.create(formData);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/admin/animals']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
