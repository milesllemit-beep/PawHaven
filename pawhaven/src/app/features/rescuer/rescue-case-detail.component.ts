import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage, mediaUrl, toFormData, validateImageFiles } from '../../core/media';
import { MilestoneType, RescueCase, RescueMilestone, RescueStatus } from '../../core/models';
import {
  animalLabel,
  formatDate,
  milestoneIcon,
  MILESTONE_TYPE_LABELS,
  rescueStatusClass,
  RESCUE_STATUS_LABELS,
  speciesIcon,
} from '../../core/rescue-status';
import { RescueService } from '../../core/rescue.service';

interface PreviewFile {
  file: File;
  url: string;
}

@Component({
  selector: 'app-rescue-case-detail',
  imports: [FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <p class="text-emerald-900/60">Loading rescue case...</p>
    } @else if (error() && !case()) {
      <p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      <a routerLink="/rescuer/cases" class="mt-4 inline-block text-sm text-emerald-700 hover:underline">
        &larr; Back to rescue cases
      </a>
    } @else if (case(); as rescueCase) {
      <a routerLink="/rescuer/cases" class="text-sm text-emerald-700 hover:underline">
        &larr; Back to rescue cases
      </a>

      @if (error()) {
        <p class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }
      @if (notice()) {
        <p class="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ notice() }}</p>
      }

      <!-- Before / after -->
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <figure class="overflow-hidden rounded-2xl bg-white shadow-sm">
          @if (rescueCase.before_photo) {
            <img
              [src]="mediaUrl(rescueCase.before_photo.url)"
              alt="Before - at rescue"
              class="h-56 w-full object-cover"
            />
          } @else {
            <div class="flex h-56 items-center justify-center text-5xl text-emerald-200" aria-hidden="true">
              {{ speciesIcon(rescueCase.species) }}
            </div>
          }
          <figcaption class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/60">
            Before &middot; {{ formatDate(rescueCase.rescued_at) }}
          </figcaption>
        </figure>
        <figure class="overflow-hidden rounded-2xl bg-white shadow-sm">
          @if (rescueCase.after_photo) {
            <img
              [src]="mediaUrl(rescueCase.after_photo.url)"
              alt="After - latest progress"
              class="h-56 w-full object-cover"
            />
          } @else {
            <div class="flex h-56 flex-col items-center justify-center text-emerald-900/40">
              <span class="text-3xl" aria-hidden="true">🐾</span>
              <span class="mt-1 text-sm">Add progress photos</span>
            </div>
          }
          <figcaption class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/60">
            After &middot; latest progress
          </figcaption>
        </figure>
      </div>

      <!-- Header -->
      <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold text-emerald-950">
                {{ animalLabel(rescueCase.name) }}
              </h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                [class]="statusClass(rescueCase.status)"
              >
                {{ statusLabel(rescueCase.status) }}
              </span>
            </div>
            <p class="mt-1 text-sm capitalize text-emerald-900/70">
              {{ rescueCase.species }}
              @if (rescueCase.breed) {
                &middot; {{ rescueCase.breed }}
              }
            </p>
            <p class="mt-1 text-sm text-emerald-900/60">
              Rescued {{ formatDate(rescueCase.rescued_at) }} &middot; {{ rescueCase.rescue_location }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a
              [routerLink]="['/rescuer/cases', rescueCase.id, 'passport']"
              class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              View Passport
            </a>
            <button
              type="button"
              class="rounded-xl border border-emerald-900/15 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              (click)="toggleEdit()"
            >
              {{ editing() ? 'Cancel edit' : 'Edit details' }}
            </button>
            <button
              type="button"
              class="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              (click)="deleteCase()"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Status workflow -->
      <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-emerald-950">Rescue status</h3>
        <p class="mt-1 text-sm text-emerald-900/60">
          Current status: <strong>{{ statusLabel(rescueCase.status) }}</strong>
        </p>
        @if (rescueCase.allowed_transitions.length) {
          <div class="mt-3 flex flex-wrap gap-2">
            @for (status of rescueCase.allowed_transitions; track status) {
              <button
                type="button"
                class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                [disabled]="updatingStatus()"
                (click)="changeStatus(status)"
              >
                Move to {{ statusLabel(status) }}
              </button>
            }
          </div>
        } @else {
          <p class="mt-3 text-sm text-emerald-900/60">
            No further status changes are available for this case.
          </p>
        }
        <p class="mt-3 text-xs text-emerald-900/50">
          An animal is only marked as <strong>Adopted</strong> when its adoption is completed
          through the adoption workflow or confirmed by an administrator.
        </p>
      </div>

      <!-- Edit form -->
      @if (editing()) {
        <form class="mt-6 rounded-2xl bg-white p-6 shadow-sm" (ngSubmit)="saveEdit()" novalidate>
          <h3 class="text-lg font-semibold text-emerald-950">Edit case details</h3>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Name</span>
              <input name="name" [(ngModel)]="editModel.name" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Species *</span>
              <input name="species" [(ngModel)]="editModel.species" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Breed</span>
              <input name="breed" [(ngModel)]="editModel.breed" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Estimated age (months)</span>
              <input type="number" name="estimated_age_months" [(ngModel)]="editModel.estimated_age_months" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Sex</span>
              <select name="sex" [(ngModel)]="editModel.sex" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Date rescued *</span>
              <input type="date" name="rescued_at" [(ngModel)]="editModel.rescued_at" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm sm:col-span-2">
              <span class="font-medium text-emerald-900">Rescue location *</span>
              <input name="rescue_location" [(ngModel)]="editModel.rescue_location" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
          </div>
          <label class="mt-4 block text-sm">
            <span class="font-medium text-emerald-900">Condition on rescue</span>
            <textarea name="condition_on_rescue" [(ngModel)]="editModel.condition_on_rescue" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"></textarea>
          </label>
          <label class="mt-4 block text-sm">
            <span class="font-medium text-emerald-900">Description</span>
            <textarea name="description" [(ngModel)]="editModel.description" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"></textarea>
          </label>
          <label class="mt-4 block text-sm">
            <span class="font-medium text-emerald-900">Care notes (private)</span>
            <textarea name="care_notes" [(ngModel)]="editModel.care_notes" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"></textarea>
          </label>
          <button type="submit" class="mt-4 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save changes' }}
          </button>
        </form>
      }

      <!-- Case info -->
      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <h3 class="text-lg font-semibold text-emerald-950">Case details</h3>
          <dl class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><dt class="text-xs font-semibold uppercase text-emerald-900/50">Sex</dt><dd class="capitalize text-emerald-950">{{ rescueCase.sex }}</dd></div>
            <div><dt class="text-xs font-semibold uppercase text-emerald-900/50">Estimated age</dt><dd class="text-emerald-950">{{ rescueCase.estimated_age_months !== null ? rescueCase.estimated_age_months + ' months' : 'Unknown' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-xs font-semibold uppercase text-emerald-900/50">Condition on rescue</dt><dd class="text-emerald-950">{{ rescueCase.condition_on_rescue || '—' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-xs font-semibold uppercase text-emerald-900/50">Description</dt><dd class="whitespace-pre-line text-emerald-950">{{ rescueCase.description || '—' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-xs font-semibold uppercase text-emerald-900/50">Care notes (private)</dt><dd class="whitespace-pre-line text-emerald-950">{{ rescueCase.care_notes || '—' }}</dd></div>
          </dl>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-emerald-950">Adoption</h3>
          @if (rescueCase.animal) {
            <p class="mt-2 text-sm text-emerald-900/70">
              This animal is linked to an adoption listing:
              <strong>{{ rescueCase.animal.name }}</strong> ({{ rescueCase.animal.status }}).
            </p>
            <a [routerLink]="['/animals', rescueCase.animal.id]" class="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              View public listing &rarr;
            </a>
          } @else {
            <p class="mt-2 text-sm text-emerald-900/70">
              This case is not yet published to the adoption listings. An administrator can
              publish it once the animal is ready.
            </p>
          }
        </div>
      </div>

      <!-- Photos -->
      <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-emerald-950">Photos</h3>
        @if (rescueCase.photos?.length) {
          <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            @for (photo of rescueCase.photos; track photo.id) {
              <li class="relative overflow-hidden rounded-xl bg-emerald-50">
                <img [src]="mediaUrl(photo.url)" [alt]="photo.caption || 'Rescue photo'" class="h-32 w-full object-cover" />
                <span class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                  {{ photo.kind }}
                </span>
                <button
                  type="button"
                  (click)="deletePhoto(photo.id)"
                  class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
                  aria-label="Delete photo"
                >
                  ×
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="mt-2 text-sm text-emerald-900/60">No photos yet.</p>
        }

        <div class="mt-4 border-t border-slate-100 pt-4">
          <label for="case-photos" class="block text-sm font-medium text-emerald-900">
            Add progress photos (JPEG, PNG, WebP, max 5 MB)
          </label>
          <input id="case-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="onCasePhotosSelected($event)" class="mt-1 w-full text-sm text-emerald-900/70" />
          @if (photoError()) {
            <p class="mt-1 text-xs text-red-600">{{ photoError() }}</p>
          }
          @if (photoPreviews().length) {
            <ul class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              @for (preview of photoPreviews(); track preview.url) {
                <li class="relative">
                  <img [src]="preview.url" [alt]="preview.file.name" class="h-20 w-full rounded-lg object-cover" />
                  <button type="button" (click)="removePhotoPreview(preview)" class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white" aria-label="Remove">×</button>
                </li>
              }
            </ul>
          }
          <button
            type="button"
            class="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            [disabled]="uploadingPhotos() || photoPreviews().length === 0"
            (click)="uploadCasePhotos()"
          >
            {{ uploadingPhotos() ? 'Uploading...' : 'Upload photos' }}
          </button>
        </div>
      </div>

      <!-- Milestones -->
      <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-emerald-950">Progress milestones</h3>
          <a [routerLink]="['/rescuer/cases', rescueCase.id, 'passport']" class="text-sm font-semibold text-emerald-700 hover:underline">
            View in Passport
          </a>
        </div>

        @if (milestones().length) {
          <ol class="mt-4 space-y-4 border-l-2 border-emerald-100 pl-5">
            @for (milestone of milestones(); track milestone.id) {
              <li class="relative">
                <span class="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px]">{{ milestoneIcon(milestone.type) }}</span>
                <div class="rounded-xl bg-emerald-50/60 p-4">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="font-semibold text-emerald-950">{{ milestone.title }}</p>
                      <p class="text-xs text-emerald-900/60">{{ typeLabel(milestone.type) }} &middot; {{ formatDate(milestone.occurred_at) }}</p>
                    </div>
                    <button type="button" (click)="deleteMilestone(milestone.id)" class="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                  </div>
                  @if (milestone.description) {
                    <p class="mt-2 whitespace-pre-line text-sm text-emerald-900/80">{{ milestone.description }}</p>
                  }
                  @if (milestone.photos?.length) {
                    <ul class="mt-3 flex flex-wrap gap-2">
                      @for (mp of milestone.photos; track mp.id) {
                        <li class="relative">
                          <img [src]="mediaUrl(mp.url)" [alt]="mp.caption || 'Milestone photo'" class="h-16 w-16 rounded-lg object-cover" />
                          <button type="button" (click)="deleteMilestonePhoto(milestone.id, mp.id)" class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white" aria-label="Delete">×</button>
                        </li>
                      }
                    </ul>
                  }
                </div>
              </li>
            }
          </ol>
        } @else {
          <p class="mt-2 text-sm text-emerald-900/60">No milestones yet. Add the first update below.</p>
        }

        <!-- Add milestone -->
        <form class="mt-5 rounded-xl border border-emerald-100 p-4" (ngSubmit)="addMilestone()" novalidate>
          <p class="text-sm font-semibold text-emerald-950">Add a milestone</p>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="block text-sm sm:col-span-2">
              <span class="font-medium text-emerald-900">Title *</span>
              <input name="title" [(ngModel)]="milestoneModel.title" required placeholder="e.g. Vaccination completed" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Type</span>
              <select name="type" [(ngModel)]="milestoneModel.type" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                @for (option of milestoneTypes; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>
            <label class="block text-sm">
              <span class="font-medium text-emerald-900">Date *</span>
              <input type="date" name="occurred_at" [(ngModel)]="milestoneModel.occurred_at" required [max]="today" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
            <label class="block text-sm sm:col-span-2">
              <span class="font-medium text-emerald-900">Description</span>
              <input name="description" [(ngModel)]="milestoneModel.description" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </label>
          </div>
          <label for="milestone-photos" class="mt-3 block text-sm">
            <span class="font-medium text-emerald-900">Photos (optional)</span>
            <input id="milestone-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="onMilestonePhotosSelected($event)" class="mt-1 w-full text-sm text-emerald-900/70" />
          </label>
          @if (milestonePhotoError()) {
            <p class="mt-1 text-xs text-red-600">{{ milestonePhotoError() }}</p>
          }
          @if (milestonePreviews().length) {
            <ul class="mt-2 flex flex-wrap gap-2">
              @for (preview of milestonePreviews(); track preview.url) {
                <li class="relative">
                  <img [src]="preview.url" [alt]="preview.file.name" class="h-16 w-16 rounded-lg object-cover" />
                  <button type="button" (click)="removeMilestonePreview(preview)" class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white" aria-label="Remove">×</button>
                </li>
              }
            </ul>
          }
          <button type="submit" class="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50" [disabled]="addingMilestone()">
            {{ addingMilestone() ? 'Saving...' : 'Add milestone' }}
          </button>
        </form>
      </div>
    }
  `,
})
export class RescueCaseDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rescue = inject(RescueService);

  readonly mediaUrl = mediaUrl;
  readonly animalLabel = animalLabel;
  readonly speciesIcon = speciesIcon;
  readonly formatDate = formatDate;
  readonly milestoneIcon = milestoneIcon;
  readonly statusClass = rescueStatusClass;
  readonly statusLabel = (status: RescueStatus) => RESCUE_STATUS_LABELS[status];
  readonly typeLabel = (type: MilestoneType) => MILESTONE_TYPE_LABELS[type];
  readonly today = new Date().toISOString().slice(0, 10);

  readonly case = signal<RescueCase | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly updatingStatus = signal(false);

  readonly photoError = signal<string | null>(null);
  readonly photoPreviews = signal<PreviewFile[]>([]);
  readonly uploadingPhotos = signal(false);

  readonly milestonePhotoError = signal<string | null>(null);
  readonly milestonePreviews = signal<PreviewFile[]>([]);
  readonly addingMilestone = signal(false);

  readonly milestoneTypes = (Object.keys(MILESTONE_TYPE_LABELS) as MilestoneType[]).map((value) => ({
    value,
    label: MILESTONE_TYPE_LABELS[value],
  }));

  private caseId = 0;

  editModel = {
    name: '',
    species: '',
    breed: '',
    estimated_age_months: null as number | null,
    sex: 'unknown' as RescueCase['sex'],
    rescued_at: '',
    rescue_location: '',
    condition_on_rescue: '',
    description: '',
    care_notes: '',
  };

  milestoneModel = {
    title: '',
    type: 'general' as MilestoneType,
    occurred_at: this.today,
    description: '',
  };

  ngOnInit(): void {
    this.caseId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  ngOnDestroy(): void {
    this.revokeAll(this.photoPreviews());
    this.revokeAll(this.milestonePreviews());
  }

  milestones(): RescueMilestone[] {
    const list = this.case()?.milestones ?? [];
    return [...list].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.rescue.getCase(this.caseId).subscribe({
      next: ({ data }) => {
        this.case.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load this rescue case.');
        this.loading.set(false);
      },
    });
  }

  private loadCase(): void {
    this.rescue.getCase(this.caseId).subscribe({
      next: ({ data }) => this.case.set(data),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  // --- Edit ---
  toggleEdit(): void {
    const current = this.case();
    if (!current) {
      return;
    }
    if (!this.editing()) {
      this.editModel = {
        name: current.name ?? '',
        species: current.species,
        breed: current.breed ?? '',
        estimated_age_months: current.estimated_age_months,
        sex: current.sex,
        rescued_at: current.rescued_at?.slice(0, 10) ?? this.today,
        rescue_location: current.rescue_location,
        condition_on_rescue: current.condition_on_rescue ?? '',
        description: current.description ?? '',
        care_notes: current.care_notes ?? '',
      };
    }
    this.editing.update((value) => !value);
  }

  saveEdit(): void {
    if (!this.editModel.species.trim() || !this.editModel.rescued_at || !this.editModel.rescue_location.trim()) {
      this.error.set('Please fill in species, date rescued, and rescue location.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const formData = toFormData(this.editModel as unknown as Record<string, unknown>, 'photos[]', []);
    this.rescue.updateCase(this.caseId, formData).subscribe({
      next: ({ data }) => {
        this.case.set(data);
        this.saving.set(false);
        this.editing.set(false);
        this.flash('Case details saved.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  // --- Status ---
  changeStatus(status: RescueStatus): void {
    this.updatingStatus.set(true);
    this.error.set(null);
    this.rescue.updateStatus(this.caseId, status).subscribe({
      next: ({ data }) => {
        this.case.set(data);
        this.updatingStatus.set(false);
        this.flash(`Status moved to ${RESCUE_STATUS_LABELS[status]}.`);
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  // --- Photos ---
  onCasePhotosSelected(event: Event): void {
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
    this.photoPreviews.update((list) => [
      ...list,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  removePhotoPreview(preview: PreviewFile): void {
    URL.revokeObjectURL(preview.url);
    this.photoPreviews.update((list) => list.filter((item) => item.url !== preview.url));
  }

  uploadCasePhotos(): void {
    const files = this.photoPreviews().map((preview) => preview.file);
    if (!files.length) {
      return;
    }
    this.uploadingPhotos.set(true);
    this.error.set(null);
    const formData = toFormData({ kind: 'progress' }, 'photos[]', files);
    this.rescue.addPhotos(this.caseId, formData).subscribe({
      next: ({ data }) => {
        this.revokeAll(this.photoPreviews());
        this.photoPreviews.set([]);
        this.case.set(data);
        this.uploadingPhotos.set(false);
        this.flash('Photos uploaded.');
      },
      error: (err) => {
        this.uploadingPhotos.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  deletePhoto(photoId: number): void {
    if (!window.confirm('Delete this photo?')) {
      return;
    }
    this.rescue.deletePhoto(this.caseId, photoId).subscribe({
      next: () => this.loadCase(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  // --- Milestones ---
  onMilestonePhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) {
      return;
    }
    const validationError = validateImageFiles(files, 10);
    if (validationError) {
      this.milestonePhotoError.set(validationError);
      return;
    }
    this.milestonePhotoError.set(null);
    this.milestonePreviews.update((list) => [
      ...list,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  removeMilestonePreview(preview: PreviewFile): void {
    URL.revokeObjectURL(preview.url);
    this.milestonePreviews.update((list) => list.filter((item) => item.url !== preview.url));
  }

  addMilestone(): void {
    if (!this.milestoneModel.title.trim() || !this.milestoneModel.occurred_at) {
      this.error.set('Please enter a milestone title and date.');
      return;
    }
    this.addingMilestone.set(true);
    this.error.set(null);
    const files = this.milestonePreviews().map((preview) => preview.file);
    const formData = toFormData(
      this.milestoneModel as unknown as Record<string, unknown>,
      'photos[]',
      files,
    );
    this.rescue.addMilestone(this.caseId, formData).subscribe({
      next: () => {
        this.revokeAll(this.milestonePreviews());
        this.milestonePreviews.set([]);
        this.milestoneModel = { title: '', type: 'general', occurred_at: this.today, description: '' };
        this.addingMilestone.set(false);
        this.loadCase();
        this.flash('Milestone added.');
      },
      error: (err) => {
        this.addingMilestone.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  deleteMilestone(milestoneId: number): void {
    if (!window.confirm('Delete this milestone?')) {
      return;
    }
    this.rescue.deleteMilestone(this.caseId, milestoneId).subscribe({
      next: () => this.loadCase(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  deleteMilestonePhoto(milestoneId: number, photoId: number): void {
    this.rescue.deleteMilestonePhoto(this.caseId, milestoneId, photoId).subscribe({
      next: () => this.loadCase(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  // --- Delete case ---
  deleteCase(): void {
    if (!window.confirm('Delete this rescue case? This can be undone by an administrator.')) {
      return;
    }
    this.rescue.deleteCase(this.caseId).subscribe({
      next: () => this.router.navigate(['/rescuer/cases']),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(null), 3000);
  }

  private revokeAll(previews: PreviewFile[]): void {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }
}
