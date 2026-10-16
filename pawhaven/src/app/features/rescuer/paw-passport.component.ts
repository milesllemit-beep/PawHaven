import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { mediaUrl } from '../../core/media';
import { RescueCase, RescuerDashboard } from '../../core/models';
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

@Component({
  selector: 'app-paw-passport',
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <p class="text-emerald-900/60">Loading passport...</p>
    } @else if (error() && !case()) {
      <p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
      <a routerLink="/rescuer/cases" class="mt-4 inline-block text-sm text-emerald-700 hover:underline">
        &larr; Back to rescue cases
      </a>
    } @else if (case(); as rescueCase) {
      <div class="mx-auto max-w-4xl">
        <a [routerLink]="['/rescuer/cases', rescueCase.id]" class="text-sm text-emerald-700 hover:underline">
          &larr; Back to case
        </a>

        <!-- Passport cover -->
        <div class="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div class="relative h-64 w-full bg-emerald-50">
            @if (rescueCase.primary_photo) {
              <img [src]="mediaUrl(rescueCase.primary_photo.url)" [alt]="animalLabel(rescueCase.name)" class="h-full w-full object-cover" />
            } @else {
              <div class="flex h-full items-center justify-center text-7xl" aria-hidden="true">{{ speciesIcon(rescueCase.species) }}</div>
            }
            <span class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Paw Progress Passport
            </span>
          </div>
          <div class="p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 class="text-3xl font-bold text-emerald-950">{{ animalLabel(rescueCase.name) }}</h1>
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
              <span class="rounded-full px-3 py-1 text-sm font-semibold" [class]="statusClass(rescueCase.status)">
                {{ statusLabel(rescueCase.status) }}
              </span>
            </div>

            @if (rescueCase.status === 'adopted') {
              <p class="mt-4 rounded-xl bg-slate-800 p-3 text-sm font-semibold text-white">
                🎉 This animal has been adopted. Journey complete.
              </p>
            }

            <!-- Journey stats -->
            <dl class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="rounded-xl bg-emerald-50 p-3">
                <dt class="text-xs font-semibold uppercase text-emerald-900/50">Days in care</dt>
                <dd class="text-2xl font-bold text-emerald-950">{{ daysInCare(rescueCase) }}</dd>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3">
                <dt class="text-xs font-semibold uppercase text-emerald-900/50">Milestones</dt>
                <dd class="text-2xl font-bold text-emerald-950">{{ milestones(rescueCase).length }}</dd>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3">
                <dt class="text-xs font-semibold uppercase text-emerald-900/50">Photos</dt>
                <dd class="text-2xl font-bold text-emerald-950">{{ (rescueCase.photos?.length ?? 0) }}</dd>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3">
                <dt class="text-xs font-semibold uppercase text-emerald-900/50">Current stage</dt>
                <dd class="text-sm font-bold text-emerald-950">{{ statusLabel(rescueCase.status) }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Before / after -->
        @if (rescueCase.before_photo || rescueCase.after_photo) {
          <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <figure class="overflow-hidden rounded-2xl bg-white shadow-sm">
              @if (rescueCase.before_photo) {
                <img [src]="mediaUrl(rescueCase.before_photo.url)" alt="Before rescue" class="h-56 w-full object-cover" />
              } @else {
                <div class="flex h-56 items-center justify-center text-emerald-900/30">No before photo</div>
              }
              <figcaption class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/60">Before</figcaption>
            </figure>
            <figure class="overflow-hidden rounded-2xl bg-white shadow-sm">
              @if (rescueCase.after_photo) {
                <img [src]="mediaUrl(rescueCase.after_photo.url)" alt="After progress" class="h-56 w-full object-cover" />
              } @else {
                <div class="flex h-56 items-center justify-center text-emerald-900/30">No progress photo yet</div>
              }
              <figcaption class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/60">After</figcaption>
            </figure>
          </div>
        }

        <!-- Timeline -->
        <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-emerald-950">Rescue journey</h2>
          @if (milestones(rescueCase).length) {
            <ol class="mt-5 space-y-6 border-l-2 border-emerald-100 pl-6">
              @for (milestone of milestones(rescueCase); track milestone.id) {
                <li class="relative">
                  <span class="absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm">{{ milestoneIcon(milestone.type) }}</span>
                  <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700/70">
                    {{ typeLabel(milestone.type) }} &middot; {{ formatDate(milestone.occurred_at) }}
                  </p>
                  <p class="mt-1 text-lg font-semibold text-emerald-950">{{ milestone.title }}</p>
                  @if (milestone.description) {
                    <p class="mt-1 whitespace-pre-line text-sm text-emerald-900/80">{{ milestone.description }}</p>
                  }
                  @if (milestone.photos?.length) {
                    <ul class="mt-3 flex flex-wrap gap-3">
                      @for (mp of milestone.photos; track mp.id) {
                        <li>
                          <img [src]="mediaUrl(mp.url)" [alt]="mp.caption || 'Milestone photo'" class="h-24 w-24 rounded-xl object-cover" />
                        </li>
                      }
                    </ul>
                  }
                </li>
              }
            </ol>
          } @else {
            <p class="mt-3 text-sm text-emerald-900/60">No milestones recorded yet.</p>
          }
        </div>

        <!-- Adoption readiness -->
        <div class="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-emerald-950">Adoption</h2>
          @if (rescueCase.animal) {
            <p class="mt-2 text-sm text-emerald-900/70">
              This animal has a public adoption listing ({{ rescueCase.animal.status }}).
            </p>
            <a [routerLink]="['/animals', rescueCase.animal.id]" class="mt-3 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              View adoption listing &rarr;
            </a>
          } @else if (rescueCase.status === 'ready_for_adoption') {
            <p class="mt-2 text-sm text-emerald-900/70">
              This animal is marked ready for adoption and is awaiting publication to the
              public listings by an administrator.
            </p>
          } @else {
            <p class="mt-2 text-sm text-emerald-900/70">
              This animal is still on its recovery journey. It can be published to the adoption
              listings once it is ready.
            </p>
          }
        </div>

        <!-- Rescuer impact summary -->
        @if (impact(); as summary) {
          <div class="mt-6 rounded-2xl bg-emerald-900 p-6 text-white shadow-sm">
            <h2 class="text-xl font-bold">Rescue impact summary</h2>
            <p class="mt-1 text-sm text-emerald-100/80">
              A running record of {{ summary.profile.name }}'s rescue work.
            </p>
            <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div><dt class="text-xs uppercase text-emerald-100/70">Rescued</dt><dd class="text-2xl font-bold">{{ summary.stats.total_rescued }}</dd></div>
              <div><dt class="text-xs uppercase text-emerald-100/70">In care</dt><dd class="text-2xl font-bold">{{ summary.stats.in_care }}</dd></div>
              <div><dt class="text-xs uppercase text-emerald-100/70">Recovering</dt><dd class="text-2xl font-bold">{{ summary.stats.recovering }}</dd></div>
              <div><dt class="text-xs uppercase text-emerald-100/70">Ready</dt><dd class="text-2xl font-bold">{{ summary.stats.ready_for_adoption }}</dd></div>
              <div><dt class="text-xs uppercase text-emerald-100/70">Adopted</dt><dd class="text-2xl font-bold">{{ summary.stats.adopted }}</dd></div>
            </dl>
          </div>
        }
      </div>
    }
  `,
})
export class PawPassportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly rescue = inject(RescueService);

  readonly mediaUrl = mediaUrl;
  readonly animalLabel = animalLabel;
  readonly speciesIcon = speciesIcon;
  readonly formatDate = formatDate;
  readonly milestoneIcon = milestoneIcon;
  readonly statusClass = rescueStatusClass;
  readonly statusLabel = (status: keyof typeof RESCUE_STATUS_LABELS) => RESCUE_STATUS_LABELS[status];
  readonly typeLabel = (type: keyof typeof MILESTONE_TYPE_LABELS) => MILESTONE_TYPE_LABELS[type];

  readonly case = signal<RescueCase | null>(null);
  readonly impact = signal<RescuerDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.rescue.getCase(id).subscribe({
      next: ({ data }) => {
        this.case.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load this passport.');
        this.loading.set(false);
      },
    });

    this.rescue.dashboard().subscribe({
      next: (data) => this.impact.set(data),
      error: () => this.impact.set(null),
    });
  }

  milestones(rescueCase: RescueCase) {
    return [...(rescueCase.milestones ?? [])].sort((a, b) =>
      a.occurred_at.localeCompare(b.occurred_at),
    );
  }

  daysInCare(rescueCase: RescueCase): number {
    const start = new Date(rescueCase.rescued_at).getTime();
    if (Number.isNaN(start)) {
      return 0;
    }
    const end = rescueCase.adopted_at ? new Date(rescueCase.adopted_at).getTime() : Date.now();
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }
}
