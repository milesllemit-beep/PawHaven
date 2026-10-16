import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-rescuer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="min-h-screen bg-[#faf6ee]">
      <div class="mx-auto max-w-6xl px-4 py-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Rescuer workspace
            </p>
            <h1 class="mt-1 text-3xl font-bold text-emerald-950">PawHaven Rescue</h1>
          </div>
          <a
            routerLink="/rescuer/cases/new"
            class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            + Report a Rescue
          </a>
        </div>

        <nav
          class="mt-5 flex flex-wrap gap-1 border-b border-emerald-900/10 pb-1"
          aria-label="Rescuer sections"
        >
          @for (tab of tabs; track tab.path) {
            <a
              [routerLink]="tab.path"
              routerLinkActive="bg-emerald-700 text-white"
              [routerLinkActiveOptions]="{ exact: tab.path === '/rescuer' }"
              class="rounded-lg px-4 py-2 text-sm font-medium text-emerald-900/70 hover:bg-emerald-900/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {{ tab.label }}
            </a>
          }
        </nav>

        <div class="mt-6">
          <router-outlet />
        </div>
      </div>
    </section>
  `,
})
export class RescuerLayoutComponent {
  readonly tabs = [
    { path: '/rescuer', label: 'Dashboard' },
    { path: '/rescuer/cases', label: 'My Rescue Cases' },
  ];
}
