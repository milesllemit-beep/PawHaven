import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/media';
import { RescuerDashboard } from '../../core/models';
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
  selector: 'app-rescuer-dashboard',
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <p class="text-slate-500">Loading your workspace...</p>
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
    } @else if (data(); as dashboard) {
      <!-- Welcome + quick actions -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Welcome back, {{ dashboard.profile.name }}</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ dashboard.profile.email }}
              @if (dashboard.profile.location) {
                &middot; {{ dashboard.profile.location }}
              }
              @if (dashboard.profile.phone) {
                &middot; {{ dashboard.profile.phone }}
              }
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a
              routerLink="/rescuer/cases/new"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Report a Rescue
            </a>
            <a
              routerLink="/rescuer/cases"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              View all cases
            </a>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        @for (card of statCards(dashboard); track card.label) {
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</dt>
            <dd class="mt-1 text-2xl font-bold text-slate-800">{{ card.value }}</dd>
          </div>
        }
      </dl>

      @if (dashboard.stats.total_rescued === 0) {
        <div class="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div class="text-4xl" aria-hidden="true">🐾</div>
          <h3 class="mt-3 text-lg font-semibold text-slate-800">You have not documented any rescues yet</h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">
            When you rescue an animal, create a case to record its details, upload photos, and
            track its progress on the Paw Progress Passport.
          </p>
          <a
            routerLink="/rescuer/cases/new"
            class="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Report your first rescue
          </a>
        </div>
      } @else {
        <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <!-- My rescue cases -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-800">Recent rescue cases</h3>
              <a routerLink="/rescuer/cases" class="text-sm font-semibold text-emerald-700 hover:underline">
                View all
              </a>
            </div>

            @if (dashboard.recent_cases.length) {
              <ul class="mt-3 divide-y divide-slate-100">
                @for (case of dashboard.recent_cases; track case.id) {
                  <li>
                    <a
                      [routerLink]="['/rescuer/cases', case.id]"
                      class="flex items-center gap-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                      @if (case.primary_photo) {
                        <img [src]="mediaUrl(case.primary_photo.url)" [alt]="animalLabel(case.name)" class="h-14 w-14 rounded-lg object-cover" />
                      } @else {
                        <span class="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-2xl" aria-hidden="true">
                          {{ speciesIcon(case.species) }}
                        </span>
                      }
                      <span class="min-w-0 flex-1">
                        <span class="block font-semibold text-slate-800">{{ animalLabel(case.name) }}</span>
                        <span class="block truncate text-sm text-slate-500">
                          {{ case.species }} &middot; {{ case.rescue_location }} &middot; {{ formatDate(case.rescued_at) }}
                        </span>
                      </span>
                      <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="statusClass(case.status)">
                        {{ statusLabel(case.status) }}
                      </span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-3 text-sm text-slate-500">No cases to show.</p>
            }

            <div class="mt-5 border-t border-slate-100 pt-4">
              <h4 class="text-sm font-semibold text-slate-700">Recent photo updates</h4>
              @if (dashboard.recent_photos.length) {
                <div class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  @for (photo of dashboard.recent_photos; track photo.id) {
                    <a
                      [routerLink]="['/rescuer/cases', photo.case?.id ?? '']"
                      class="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                      <img [src]="mediaUrl(photo.url)" [alt]="photo.caption || 'Rescue photo'" class="h-20 w-full rounded-lg object-cover" />
                      <span class="mt-1 block truncate text-xs text-slate-500">
                        {{ photo.case ? animalLabel(photo.case.name) : 'Photo' }}
                      </span>
                    </a>
                  }
                </div>
              } @else {
                <p class="mt-2 text-sm text-slate-500">No photos uploaded yet.</p>
              }
            </div>
          </section>

          <div class="space-y-5">
            <!-- Recent activity -->
            <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-800">Recent activity</h3>
              @if (dashboard.recent_activity.length) {
                <ol class="mt-3 space-y-4">
                  @for (item of dashboard.recent_activity; track item.id) {
                    <li class="flex gap-3">
                      <span class="text-lg" aria-hidden="true">{{ milestoneIcon(item.type) }}</span>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
                        <p class="text-xs text-slate-500">
                          {{ typeLabel(item.type) }} &middot; {{ formatDate(item.occurred_at) }}
                        </p>
                        @if (item.case) {
                          <a [routerLink]="['/rescuer/cases', item.case.id]" class="text-xs font-medium text-emerald-700 hover:underline">
                            {{ animalLabel(item.case.name) }}
                          </a>
                        }
                      </div>
                    </li>
                  }
                </ol>
              } @else {
                <p class="mt-3 text-sm text-slate-500">No activity recorded yet.</p>
              }
            </section>

            <!-- Passport highlights -->
            <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-800">Paw Progress Passport</h3>
              @if (dashboard.passport_highlights.length) {
                <ul class="mt-3 space-y-4">
                  @for (item of dashboard.passport_highlights; track item.id) {
                    <li>
                      <a
                        [routerLink]="['/rescuer/cases', item.id, 'passport']"
                        class="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        @if (item.primary_photo) {
                          <img [src]="mediaUrl(item.primary_photo.url)" [alt]="animalLabel(item.name)" class="h-12 w-12 rounded-lg object-cover" />
                        } @else {
                          <span class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl" aria-hidden="true">
                            {{ speciesIcon(item.species) }}
                          </span>
                        }
                        <span class="min-w-0">
                          <span class="block text-sm font-semibold text-slate-800">{{ animalLabel(item.name) }}</span>
                          <span class="block text-xs text-slate-500">{{ item.milestones_count }} milestone(s)</span>
                        </span>
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-3 text-sm text-slate-500">Add milestones to build a passport for each animal.</p>
              }
            </section>
          </div>
        </div>
      }
    }
  `,
})
export class RescuerDashboardComponent implements OnInit {
  private readonly rescue = inject(RescueService);

  readonly data = signal<RescuerDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly mediaUrl = mediaUrl;
  readonly animalLabel = animalLabel;
  readonly speciesIcon = speciesIcon;
  readonly formatDate = formatDate;
  readonly milestoneIcon = milestoneIcon;
  readonly statusClass = rescueStatusClass;
  readonly statusLabel = (status: keyof typeof RESCUE_STATUS_LABELS) => RESCUE_STATUS_LABELS[status];
  readonly typeLabel = (type: keyof typeof MILESTONE_TYPE_LABELS) => MILESTONE_TYPE_LABELS[type];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.rescue.dashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your rescuer dashboard.');
        this.loading.set(false);
      },
    });
  }

  statCards(dashboard: RescuerDashboard) {
    return [
      { label: 'Total rescued', value: dashboard.stats.total_rescued },
      { label: 'In care', value: dashboard.stats.in_care },
      { label: 'Recovering', value: dashboard.stats.recovering },
      { label: 'Ready for adoption', value: dashboard.stats.ready_for_adoption },
      { label: 'Adopted', value: dashboard.stats.adopted },
    ];
  }
}
