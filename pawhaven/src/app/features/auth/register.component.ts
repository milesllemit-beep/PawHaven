import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/media';
import { Role } from '../../core/models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-4 py-12">
      <div class="rounded-xl bg-white p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-slate-800">Create your account</h1>
        <p class="mt-1 text-sm text-slate-500">Join PawHaven to adopt and report stray animals.</p>

        @if (error()) {
          <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
        }

        <form class="mt-6 space-y-4" (ngSubmit)="submit()">
          <div>
            <label class="block text-sm font-medium text-slate-700">Name</label>
            <input
              name="name"
              [(ngModel)]="model.name"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              [(ngModel)]="model.email"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <fieldset>
            <legend class="block text-sm font-medium text-slate-700">I am joining as</legend>
            <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-slate-300 p-3 transition hover:border-emerald-400 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  [(ngModel)]="model.role"
                  required
                  class="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span class="block text-sm font-semibold text-slate-800">General User / Adopter</span>
                  <span class="mt-0.5 block text-xs text-slate-500">
                    Browse animals and apply to give one a loving home.
                  </span>
                </span>
              </label>

              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-slate-300 p-3 transition hover:border-emerald-400 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="role"
                  value="rescuer"
                  [(ngModel)]="model.role"
                  required
                  class="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span class="block text-sm font-semibold text-slate-800">Rescuer</span>
                  <span class="mt-0.5 block text-xs text-slate-500">
                    Help strays and support animals that need a home.
                  </span>
                </span>
              </label>
            </div>
            @if (roleError()) {
              <p class="mt-2 text-sm text-red-600">{{ roleError() }}</p>
            }
          </fieldset>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700">Phone</label>
              <input
                name="phone"
                [(ngModel)]="model.phone"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Location</label>
              <input
                name="location"
                [(ngModel)]="model.location"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="model.password"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              name="password_confirmation"
              [(ngModel)]="model.password_confirmation"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Creating account...' : 'Register' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-slate-500">
          Already have an account?
          <a routerLink="/login" class="font-semibold text-emerald-700 hover:underline">Log in</a>
        </p>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly roleError = signal<string | null>(null);

  model: {
    name: string;
    email: string;
    phone: string;
    location: string;
    password: string;
    password_confirmation: string;
    role: Role | '';
  } = {
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    password_confirmation: '',
    role: '',
  };

  submit(): void {
    if (!this.model.role) {
      this.roleError.set('Please choose whether you are joining as an adopter or a rescuer.');
      return;
    }

    this.roleError.set(null);
    this.submitting.set(true);
    this.error.set(null);

    this.auth.register({ ...this.model, role: this.model.role }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
