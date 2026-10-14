import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-3xl font-bold text-slate-800">Admin</h1>
      <nav class="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        @for (tab of tabs; track tab.path) {
          <a
            [routerLink]="tab.path"
            routerLinkActive="bg-emerald-600 text-white"
            [routerLinkActiveOptions]="{ exact: tab.path === '/admin' }"
            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
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
export class AdminLayoutComponent {
  readonly tabs = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/animals', label: 'Animals' },
    { path: '/admin/applications', label: 'Applications' },
    { path: '/admin/users', label: 'Users' },
  ];
}
