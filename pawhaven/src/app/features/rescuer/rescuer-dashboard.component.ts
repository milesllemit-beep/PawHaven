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
      <p class="text-emerald-900/60">Loading your workspace...</p>
    } @else if (error()) {
      <p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
    } @else if (data(); as dashboard) {
      <!-- Welcome + profile -->
      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-emerald-950">
              Welcome back, {{ dashboard.profile.name }}
            </h2>
            <p class="mt-1 text-sm text-emerald-900/60">
              {{ dashboard.profile.email }}
              @if (dashboard.profile.location) {
                &middot; {{ dashboard.profile.location }}
              }
              @if (dashboard.profile.phone) {
                &middot; {{ dashboard.profile.phone }}
              }
            </p>
          </div>
          <a
            routerLink="/rescuer/cases/new"
            class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Report a Rescue
          </a>
        </div>
      </div>

      <!-- Stats -->
      <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        @for (card of statCards(dashboard); track card.label) {
          <div class="rounded-2xl bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-emerald-900/60">{{ card.label }}</p>
            <p class="mt-1 text-3xl font-bold text-emerald-950">{{ card.value }}</p>
          </div>
        }
      </div>

      @if (dashboard.stats.total_rescued === 0) {
        <div class="mt-6 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-10 text-center">
          <div class="text-4xl" aria-hidden="true">🐾</div>
          <h3 class="mt-3 text-lg font-semibold text-emerald-950">
            You have not documented any rescues yet
          </h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-emerald-900/60">
            When you rescue an animal, create a case to record its details, upload photos, and
            track its progress on the Paw Progress Passport.
          </p>
          <a
            routerLink="/rescuer/cases/new"
            class="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Report your first rescue
          </a>
        </div>
      } @else {
        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- My rescue cases -->
          <section class="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-emerald-950">My Rescue Cases</h3>
              <a routerLink="/rescuer/cases" class="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                View all
              </a>
            </div>

            @if (dashboard.recent_cases.length) {
              <ul class="mt-4 divide-y divide-slate-100">
                @for (case of dashboard.recent_cases; track case.id) {
                  <li>
                    <a
                      [routerLink]="['/rescuer/cases', case.id]"
                      class="flex items-center gap-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                      @if (case.primary_photo) {
                        <img
                          [src]="mediaUrl(case.primary_photo.url)"
                          [alt]="animalLabel(case.name)"
                          class="h-14 w-14 rounded-xl object-cover"
                        />
                      } @else {
                        <span
                          class="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-2xl"
                          aria-hidden="true"
                        >
                          {{ speciesIcon(case.species) }}
                        </span>
                      }
                      <span class="min-w-0 flex-1">
                        <span class="block font-semibold text-emerald-950">
                          {{ animalLabel(case.name) }}
                        </span>
                        <span class="block truncate text-sm text-emerald-900/60">
                          {{ case.species }} &middot; {{ case.rescue_location }} &middot;
                          {{ formatDate(case.rescued_at) }}
                        </span>
                      </span>
                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        [class]="statusClass(case.status)"
                      >
                        {{ statusLabel(case.status) }}
                      </span>
                    </a>
                  </li>
                }
              </ul>
            }
          </section>

          <!-- Recent activity -->
          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-emerald-950">Recent rescue activity</h3>
            @if (dashboard.recent_activity.length) {
              <ol class="mt-4 space-y-4">
                @for (item of dashboard.recent_activity; track item.id) {
                  <li class="flex gap-3">
                    <span class="text-lg" aria-hidden="true">{{ milestoneIcon(item.type) }}</span>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-emerald-950">{{ item.title }}</p>
                      <p class="text-xs text-emerald-900/60">
                        {{ typeLabel(item.type) }} &middot; {{ formatDate(item.occurred_at) }}
                      </p>
                      @if (item.case) {
                        <a
                          [routerLink]="['/rescuer/cases', item.case.id]"
                          class="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {{ animalLabel(item.case.name) }}
                        </a>
                      }
                    </div>
                  </li>
                }
              </ol>
            } @else {
              <p class="mt-4 text-sm text-emerald-900/60">No activity recorded yet.</p>
            }
          </section>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Recent photo updates -->
          <section class="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 class="text-lg font-semibold text-emerald-950">Recent photo updates</h3>
            @if (dashboard.recent_photos.length) {
              <div class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                @for (photo of dashboard.recent_photos; track photo.id) {
                  <a
                    [routerLink]="['/rescuer/cases', photo.case?.id ?? '']"
                    class="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    <img
                      [src]="mediaUrl(photo.url)"
                      [alt]="photo.caption || 'Rescue photo'"
                      class="h-24 w-full rounded-xl object-cover"
                    />
                    <span class="mt-1 block truncate text-xs text-emerald-900/60">
                      {{ photo.case ? animalLabel(photo.case.name) : 'Photo' }}
                    </span>
                  </a>
                }
              </div>
            } @else {
              <p class="mt-4 text-sm text-emerald-900/60">No photos uploaded yet.</p>
            }
          </section>

          <!-- Passport highlights -->
          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-emerald-950">Paw Progress Passport</h3>
            @if (dashboard.passport_highlights.length) {
              <ul class="mt-4 space-y-4">
                @for (item of dashboard.passport_highlights; track item.id) {
                  <li>
                    <a
                      [routerLink]="['/rescuer/cases', item.id, 'passport']"
                      class="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                      @if (item.primary_photo) {
                        <img
                          [src]="mediaUrl(item.primary_photo.url)"
                          [alt]="animalLabel(item.name)"
                          class="h-12 w-12 rounded-lg object-cover"
                        />
                      } @else {
                        <span
                          class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-xl"
                          aria-hidden="true"
                        >
                          {{ speciesIcon(item.species) }}
                        </span>
                      }
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold text-emerald-950">
                          {{ animalLabel(item.name) }}
                        </span>
                        <span class="block text-xs text-emerald-900/60">
                          {{ item.milestones_count }} milestone(s)
                        </span>
                      </span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-4 text-sm text-emerald-900/60">
                Add milestones to build a passport for each animal.
              </p>
            }
          </section>
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
  readonly statusLabel = (status: keyof typeof RESCUE_STATUS_LABELS) =>
    RESCUE_STATUS_LABELS[status];
  readonly typeLabel = (type: keyof typeof MILESTONE_TYPE_LABELS) => MILESTONE_TYPE_LABELS[type];

  ngOnInit(): void {
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
