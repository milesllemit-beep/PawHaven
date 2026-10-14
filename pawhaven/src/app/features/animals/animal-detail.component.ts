import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdoptionService } from '../../core/adoption.service';
import { AuthService } from '../../core/auth.service';
import { AnimalService } from '../../core/animal.service';
import { errorMessage, mediaUrl } from '../../core/media';
import { Animal } from '../../core/models';

@Component({
  selector: 'app-animal-detail',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-5xl px-4 py-8">
      <a routerLink="/animals" class="text-sm text-emerald-700 hover:underline">&larr; Back to animals</a>

      @if (loading()) {
        <p class="mt-6 text-slate-500">Loading...</p>
      } @else if (error()) {
        <p class="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      } @else if (animal(); as pet) {
        <div class="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div class="h-80 w-full overflow-hidden rounded-xl bg-slate-100">
              @if (activePhoto()) {
                <img [src]="mediaUrl(activePhoto()!)" [alt]="pet.name" class="h-full w-full object-cover" />
              } @else {
                <div class="flex h-full items-center justify-center text-slate-400">No photo</div>
              }
            </div>
            @if (pet.photos.length > 1) {
              <div class="mt-3 flex gap-2 overflow-x-auto">
                @for (photo of pet.photos; track photo.id) {
                  <button
                    type="button"
                    class="h-16 w-16 flex-none overflow-hidden rounded-lg border-2"
                    [class]="activePhotoId() === photo.id ? 'border-emerald-500' : 'border-transparent'"
                    (click)="activePhotoId.set(photo.id)"
                  >
                    <img [src]="mediaUrl(photo.url)" [alt]="pet.name" class="h-full w-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <div>
            <div class="flex items-start justify-between">
              <h1 class="text-3xl font-bold text-slate-800">{{ pet.name }}</h1>
              <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="statusClass(pet.status)">
                {{ pet.status }}
              </span>
            </div>
            <p class="mt-1 text-slate-500 capitalize">
              {{ pet.species }}
              @if (pet.breed) {
                &middot; {{ pet.breed }}
              }
            </p>

            <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt class="text-slate-400">Sex</dt><dd class="capitalize text-slate-700">{{ pet.sex }}</dd></div>
              <div><dt class="text-slate-400">Size</dt><dd class="capitalize text-slate-700">{{ pet.size || 'Unknown' }}</dd></div>
              <div><dt class="text-slate-400">Age</dt><dd class="text-slate-700">{{ ageLabel(pet.age_months) }}</dd></div>
              <div><dt class="text-slate-400">Vaccinated</dt><dd class="text-slate-700">{{ pet.vaccinated ? 'Yes' : 'No' }}</dd></div>
              <div><dt class="text-slate-400">Sterilized</dt><dd class="text-slate-700">{{ pet.sterilized ? 'Yes' : 'No' }}</dd></div>
            </dl>

            @if (pet.description) {
              <p class="mt-4 whitespace-pre-line text-slate-600">{{ pet.description }}</p>
            }

            <div class="mt-6 rounded-xl bg-white p-5 shadow-sm">
              @if (applied()) {
                <p class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  Your application was submitted. You can track it under "My Applications".
                </p>
              } @else if (applyError()) {
                <p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ applyError() }}</p>
              }

              @if (pet.status !== 'available') {
                <p class="text-sm text-slate-500">This animal is not currently accepting applications.</p>
              } @else if (!auth.isAuthenticated()) {
                <p class="text-sm text-slate-600">
                  <a routerLink="/login" class="font-semibold text-emerald-700 hover:underline">Log in</a>
                  to apply for adoption.
                </p>
              } @else if (!applied()) {
                <h2 class="text-lg font-semibold text-slate-800">Apply to adopt</h2>
                <textarea
                  name="message"
                  [(ngModel)]="applicationMessage"
                  rows="4"
                  placeholder="Tell us why you would be a great match..."
                  class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                ></textarea>
                <button
                  type="button"
                  class="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  [disabled]="submitting()"
                  (click)="apply(pet.id)"
                >
                  {{ submitting() ? 'Submitting...' : 'Submit application' }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class AnimalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly animalService = inject(AnimalService);
  private readonly adoptionService = inject(AdoptionService);
  readonly auth = inject(AuthService);
  readonly mediaUrl = mediaUrl;

  readonly animal = signal<Animal | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activePhotoId = signal<number | null>(null);
  readonly submitting = signal(false);
  readonly applied = signal(false);
  readonly applyError = signal<string | null>(null);

  applicationMessage = '';

  private animalId = 0;

  ngOnInit(): void {
    this.animalId = Number(this.route.snapshot.paramMap.get('id'));
    this.animalService.get(this.animalId).subscribe({
      next: ({ data }) => {
        this.animal.set(data);
        this.activePhotoId.set(data.photos?.[0]?.id ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This animal could not be found.');
        this.loading.set(false);
      },
    });
  }

  activePhoto(): string | null {
    const pet = this.animal();
    if (!pet) {
      return null;
    }
    const photo = pet.photos.find((item) => item.id === this.activePhotoId()) ?? pet.photos[0];
    return photo ? photo.url : null;
  }

  apply(animalId: number): void {
    this.submitting.set(true);
    this.applyError.set(null);

    this.adoptionService.apply({ animal_id: animalId, message: this.applicationMessage }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.applied.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.applyError.set(errorMessage(err));
      },
    });
  }

  ageLabel(months: number | null): string {
    if (months === null || months === undefined) {
      return 'Unknown';
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
      default:
        return 'bg-slate-200 text-slate-600';
    }
  }
}
