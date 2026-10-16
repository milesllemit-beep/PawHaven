import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  errorMessage,
  formatBytes,
  toFormData,
  validateImageFiles,
} from '../../core/media';
import { RescueService } from '../../core/rescue.service';

interface PreviewFile {
  file: File;
  url: string;
}

const SPECIES_SUGGESTIONS = ['dog', 'cat', 'rabbit', 'bird', 'guinea pig', 'hamster'];

@Component({
  selector: 'app-rescue-report',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl">
      <a routerLink="/rescuer" class="text-sm text-emerald-700 hover:underline">
        &larr; Back to dashboard
      </a>
      <h2 class="mt-3 text-2xl font-bold text-emerald-950">Report a Rescue</h2>
      <p class="mt-1 text-sm text-emerald-900/60">
        Document the details of the animal you rescued. This creates a rescue case you can
        track on the Paw Progress Passport.
      </p>

      @if (error()) {
        <p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      <form
        class="mt-5 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
        (ngSubmit)="submit()"
        novalidate
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="name" class="block text-sm font-medium text-emerald-900">
              Name (optional)
            </label>
            <input
              id="name"
              name="name"
              [(ngModel)]="model.name"
              placeholder="Give the animal a name"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            />
          </div>
          <div>
            <label for="species" class="block text-sm font-medium text-emerald-900">
              Species *
            </label>
            <input
              id="species"
              name="species"
              [(ngModel)]="model.species"
              required
              list="species-suggestions"
              placeholder="dog, cat, rabbit..."
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <datalist id="species-suggestions">
              @for (option of speciesSuggestions; track option) {
                <option [value]="option"></option>
              }
            </datalist>
          </div>
          <div>
            <label for="breed" class="block text-sm font-medium text-emerald-900">Breed</label>
            <input
              id="breed"
              name="breed"
              [(ngModel)]="model.breed"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="estimated_age_months" class="block text-sm font-medium text-emerald-900">
              Estimated age (months)
            </label>
            <input
              id="estimated_age_months"
              type="number"
              name="estimated_age_months"
              [(ngModel)]="model.estimated_age_months"
              min="0"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="sex" class="block text-sm font-medium text-emerald-900">Sex</label>
            <select
              id="sex"
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
            <label for="rescued_at" class="block text-sm font-medium text-emerald-900">
              Date rescued *
            </label>
            <input
              id="rescued_at"
              type="date"
              name="rescued_at"
              [(ngModel)]="model.rescued_at"
              required
              [max]="today"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label for="rescue_location" class="block text-sm font-medium text-emerald-900">
            Rescue location *
          </label>
          <input
            id="rescue_location"
            name="rescue_location"
            [(ngModel)]="model.rescue_location"
            required
            placeholder="Where did you find the animal?"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="condition_on_rescue" class="block text-sm font-medium text-emerald-900">
            Condition on rescue
          </label>
          <textarea
            id="condition_on_rescue"
            name="condition_on_rescue"
            [(ngModel)]="model.condition_on_rescue"
            rows="2"
            placeholder="Describe the animal's condition when you found it (facts only)"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-emerald-900">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            [(ngModel)]="model.description"
            rows="3"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label for="care_notes" class="block text-sm font-medium text-emerald-900">
            Care notes (private)
          </label>
          <textarea
            id="care_notes"
            name="care_notes"
            [(ngModel)]="model.care_notes"
            rows="3"
            placeholder="Internal notes for your team. These are not published publicly."
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          ></textarea>
          <p class="mt-1 text-xs text-emerald-900/50">
            Private notes are only visible to you and administrators.
          </p>
        </div>

        <!-- Photos -->
        <div>
          <label for="photos" class="block text-sm font-medium text-emerald-900">
            Photos (JPEG, PNG, or WebP, up to 5 MB each)
          </label>
          <input
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            (change)="onFilesSelected($event)"
            class="mt-1 w-full text-sm text-emerald-900/70"
          />
          @if (photoError()) {
            <p class="mt-1 text-xs text-red-600">{{ photoError() }}</p>
          }

          @if (previews().length) {
            <ul class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              @for (preview of previews(); track preview.url) {
                <li class="relative">
                  <img
                    [src]="preview.url"
                    [alt]="preview.file.name"
                    class="h-24 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    (click)="removePreview(preview)"
                    [attr.aria-label]="'Remove ' + preview.file.name"
                    class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
                  >
                    ×
                  </button>
                  <p class="mt-1 truncate text-xs text-emerald-900/50">
                    {{ formatBytes(preview.file.size) }}
                  </p>
                </li>
              }
            </ul>
          }
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Saving rescue case...' : 'Save rescue case' }}
          </button>
          @if (submitting()) {
            <span class="text-sm text-emerald-900/60" role="status">Uploading...</span>
          }
        </div>
      </form>
    </div>
  `,
})
export class RescueReportComponent implements OnDestroy {
  private readonly rescue = inject(RescueService);
  private readonly router = inject(Router);

  readonly speciesSuggestions = SPECIES_SUGGESTIONS;
  readonly formatBytes = formatBytes;
  readonly today = new Date().toISOString().slice(0, 10);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly photoError = signal<string | null>(null);
  readonly previews = signal<PreviewFile[]>([]);

  model = {
    name: '',
    species: '',
    breed: '',
    estimated_age_months: null as number | null,
    sex: 'unknown',
    rescued_at: this.today,
    rescue_location: '',
    condition_on_rescue: '',
    description: '',
    care_notes: '',
  };

  ngOnDestroy(): void {
    this.revokeAll();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) {
      return;
    }

    const validationError = validateImageFiles(files, 10);
    if (validationError) {
      this.photoError.set(validationError);
      return;
    }

    this.photoError.set(null);
    const additions = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    this.previews.update((list) => [...list, ...additions]);
  }

  removePreview(preview: PreviewFile): void {
    URL.revokeObjectURL(preview.url);
    this.previews.update((list) => list.filter((item) => item.url !== preview.url));
  }

  submit(): void {
    this.error.set(null);

    if (!this.model.species.trim() || !this.model.rescued_at || !this.model.rescue_location.trim()) {
      this.error.set('Please fill in species, date rescued, and rescue location.');
      return;
    }

    this.submitting.set(true);
    const files = this.previews().map((preview) => preview.file);
    const formData = toFormData(
      this.model as unknown as Record<string, unknown>,
      'photos[]',
      files,
    );

    this.rescue.createCase(formData).subscribe({
      next: ({ data }) => {
        this.submitting.set(false);
        this.revokeAll();
        this.router.navigate(['/rescuer/cases', data.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  private revokeAll(): void {
    this.previews().forEach((preview) => URL.revokeObjectURL(preview.url));
    this.previews.set([]);
  }
}
