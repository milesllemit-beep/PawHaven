import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-rescuer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Rescuer workspace</h1>
          <p class="mt-1 text-slate-500">
            Document rescues, track each animal's care journey, and build its Paw Progress
            Passport.
          </p>
        </div>
        <a
          routerLink="/rescuer/cases/new"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          + Report a Rescue
        </a>
      </div>

      <nav class="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Rescuer sections">
        @for (tab of tabs; track tab.path) {
          <a
            [routerLink]="tab.path"
            routerLinkActive="bg-emerald-600 text-white"
            [routerLinkActiveOptions]="{ exact: tab.path === '/rescuer' }"
            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {{ tab.label }}
          </a>
        }
      </nav>

      <div class="mt-6">
        <router-outlet />
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
