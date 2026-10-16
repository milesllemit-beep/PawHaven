import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../core/admin.service';
import { AdminStats } from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    @if (error()) {
      <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="text-slate-500">Loading statistics...</p>
    } @else if (stats(); as data) {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (card of cards(); track card.label) {
          <div class="rounded-xl bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
            <p class="mt-1 text-3xl font-bold text-slate-800">{{ card.value }}</p>
            @if (card.hint) {
              <p class="mt-1 text-xs text-slate-400">{{ card.hint }}</p>
            }
          </div>
        }
      </div>

      <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">Animals by status</h2>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li class="flex justify-between"><span>Available</span><span class="font-medium">{{ data.animals.available }}</span></li>
            <li class="flex justify-between"><span>Pending</span><span class="font-medium">{{ data.animals.pending }}</span></li>
            <li class="flex justify-between"><span>Adopted</span><span class="font-medium">{{ data.animals.adopted }}</span></li>
          </ul>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">Stray reports</h2>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li class="flex justify-between"><span>Lost</span><span class="font-medium">{{ data.stray_reports.lost }}</span></li>
            <li class="flex justify-between"><span>Found</span><span class="font-medium">{{ data.stray_reports.found }}</span></li>
            <li class="flex justify-between"><span>Injured</span><span class="font-medium">{{ data.stray_reports.injured }}</span></li>
            <li class="flex justify-between"><span>Open</span><span class="font-medium">{{ data.stray_reports.open }}</span></li>
          </ul>
        </div>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.adminService.stats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load statistics.');
        this.loading.set(false);
      },
    });
  }

  cards() {
    const data = this.stats();
    if (!data) {
      return [];
    }
    return [
      { label: 'Animals', value: data.animals.total, hint: `${data.animals.available} available` },
      { label: 'Stray reports', value: data.stray_reports.total, hint: `${data.stray_reports.open} open` },
      {
        label: 'Applications',
        value: data.adoption_applications.total,
        hint: `${data.adoption_applications.pending} pending`,
      },
      { label: 'Users', value: data.users.total, hint: `${data.users.admins} admins, ${data.users.rescuers} rescuers` },
    ];
  }
}
