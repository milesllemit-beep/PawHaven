import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/media';
import { Paginated, Role, User } from '../../core/models';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  template: `
    <div class="mb-4 flex flex-wrap gap-3">
      <input
        name="search"
        [(ngModel)]="search"
        placeholder="Search name or email"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      />
      <select
        name="role"
        [(ngModel)]="role"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      >
        <option value="">All roles</option>
        <option value="user">Users</option>
        <option value="admin">Admins</option>
      </select>
      <button
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        (click)="applyFilters()"
      >
        Filter
      </button>
    </div>

    @if (error()) {
      <p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="text-slate-500">Loading users...</p>
    } @else if (users().length === 0) {
      <p class="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">No users found.</p>
    } @else {
      <div class="overflow-hidden rounded-xl bg-white shadow-sm">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Email</th>
              <th class="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (user of users(); track user.id) {
              <tr>
                <td class="px-4 py-3 text-slate-700">{{ user.name }}</td>
                <td class="px-4 py-3 text-slate-500">{{ user.email }}</td>
                <td class="px-4 py-3">
                  @if (user.id === auth.user()?.id) {
                    <span class="text-xs text-slate-400">{{ user.role }} (you)</span>
                  } @else {
                    <select
                      [ngModel]="user.role"
                      (ngModelChange)="changeRole(user, $event)"
                      class="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (meta(); as page) {
        <div class="mt-4 flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            [disabled]="page.current_page <= 1"
            (click)="goToPage(page.current_page - 1)"
          >
            Previous
          </button>
          <span>Page {{ page.current_page }} of {{ page.last_page }}</span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            [disabled]="page.current_page >= page.last_page"
            (click)="goToPage(page.current_page + 1)"
          >
            Next
          </button>
        </div>
      }
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly auth = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly meta = signal<Paginated<User>['meta'] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search = '';
  role = '';
  page = 1;

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService
      .users({ search: this.search, role: this.role, page: this.page, per_page: 15 })
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load users.');
          this.loading.set(false);
        },
      });
  }

  changeRole(user: User, role: Role): void {
    this.adminService.updateRole(user.id, role).subscribe({
      next: ({ data }) => {
        this.users.update((list) => list.map((item) => (item.id === data.id ? data : item)));
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.load();
      },
    });
  }
}
