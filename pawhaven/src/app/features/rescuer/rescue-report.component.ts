import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage, formatBytes, toFormData, validateImageFiles } from '../../core/media';
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
      <h2 class="mt-3 text-2xl font-bold text-slate-800">Report a Rescue</h2>
      <p class="mt-1 text-slate-500">
        Document the animal you rescued. This creates a rescue case you can track on the Paw
        Progress Passport. Fields marked * are required.
      </p>

      @if (error()) {
        <p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }

      <form class="mt-5 space-y-6" (ngSubmit)="submit()" novalidate>
        <!-- Animal details -->
        <fieldset class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-800">Animal details</legend>
          <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="name" class="block text-sm font-medium text-slate-700">Name (optional)</label>
              <input
                id="name"
                name="name"
                [(ngModel)]="model.name"
                placeholder="Give the animal a name"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label for="species" class="block text-sm font-medium text-slate-700">Species *</label>
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
              <label for="breed" class="block text-sm font-medium text-slate-700">Breed (optional)</label>
              <input
                id="breed"
                name="breed"
                [(ngModel)]="model.breed"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label for="estimated_age_months" class="block text-sm font-medium text-slate-700">
                Estimated age in months (optional)
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
              <label for="sex" class="block text-sm font-medium text-slate-700">Sex</label>
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
          </div>
        </fieldset>

        <!-- Rescue details -->
        <fieldset class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-800">Rescue details</legend>
          <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="rescued_at" class="block text-sm font-medium text-slate-700">Date rescued *</label>
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
            <div>
              <label for="rescue_location" class="block text-sm font-medium text-slate-700">Rescue location *</label>
              <input
                id="rescue_location"
                name="rescue_location"
                [(ngModel)]="model.rescue_location"
                required
                placeholder="Where did you find the animal?"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <p class="mt-1 text-xs text-slate-400">
                Kept private. Only you and administrators can see this; it is never shown publicly.
              </p>
            </div>
          </div>
          <div class="mt-4">
            <label for="condition_on_rescue" class="block text-sm font-medium text-slate-700">
              Condition on rescue (optional)
            </label>
            <textarea
              id="condition_on_rescue"
              name="condition_on_rescue"
              [(ngModel)]="model.condition_on_rescue"
              rows="2"
              placeholder="Describe what you observed when you found the animal"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            ></textarea>
            <p class="mt-1 text-xs text-slate-400">
              Record only what you observed. Do not state medical conditions or treatments as
              confirmed unless a veterinarian has verified them.
            </p>
          </div>
        </fieldset>

        <!-- Description and notes -->
        <fieldset class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-800">Notes</legend>
          <div class="mt-3 space-y-4">
            <div>
              <label for="description" class="block text-sm font-medium text-slate-700">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                [(ngModel)]="model.description"
                rows="3"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              ></textarea>
            </div>
            <div>
              <label for="care_notes" class="block text-sm font-medium text-slate-700">Care notes (optional, private)</label>
              <textarea
                id="care_notes"
                name="care_notes"
                [(ngModel)]="model.care_notes"
                rows="3"
                placeholder="Internal notes for your team. These are not published publicly."
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              ></textarea>
              <p class="mt-1 text-xs text-slate-400">Only visible to you and administrators.</p>
            </div>
          </div>
        </fieldset>

        <!-- Photos -->
        <fieldset class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-800">Initial photos (optional)</legend>
          <label for="photos" class="mt-3 block text-sm font-medium text-slate-700">
            Add photos of the animal on rescue
          </label>
          <p class="text-xs text-slate-400">JPEG, PNG or WebP, up to 5 MB each, maximum 10 photos.</p>
          <input
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            (change)="onFilesSelected($event)"
            class="mt-1 w-full text-sm text-slate-600"
          />
          @if (photoError()) {
            <p class="mt-1 text-xs text-red-600" role="alert">{{ photoError() }}</p>
          }

          @if (previews().length) {
            <ul class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              @for (preview of previews(); track preview.url) {
                <li class="relative">
                  <img [src]="preview.url" [alt]="preview.file.name" class="h-24 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    (click)="removePreview(preview)"
                    [attr.aria-label]="'Remove ' + preview.file.name"
                    class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
                  >
                    ×
                  </button>
                  <p class="mt-1 truncate text-xs text-slate-400">{{ formatBytes(preview.file.size) }}</p>
                </li>
              }
            </ul>
          }
        </fieldset>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Saving rescue case...' : 'Save rescue case' }}
          </button>
          @if (submitting()) {
            <span class="text-sm text-slate-500" role="status">Uploading...</span>
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
