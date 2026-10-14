import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage, toFormData } from '../../core/media';
import { StrayReportService } from '../../core/stray-report.service';

@Component({
  selector: 'app-report-form',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-2xl px-4 py-8">
      <a routerLink="/reports" class="text-sm text-emerald-700 hover:underline">&larr; Back to reports</a>
      <h1 class="mt-3 text-3xl font-bold text-slate-800">File a stray animal report</h1>
      <p class="mt-1 text-slate-500">
        Report a lost, found, or injured animal. Reports are separate from adoption listings.
      </p>

      @if (error()) {
        <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      <form class="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">Report type *</label>
          <select
            name="type"
            [(ngModel)]="model.type"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="injured">Injured</option>
          </select>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">Species *</label>
            <input
              name="species"
              [(ngModel)]="model.species"
              required
              placeholder="dog, cat..."
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Breed</label>
            <input
              name="breed"
              [(ngModel)]="model.breed"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Color</label>
            <input
              name="color"
              [(ngModel)]="model.color"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Date seen</label>
            <input
              type="date"
              name="occurred_at"
              [(ngModel)]="model.occurred_at"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Location *</label>
          <input
            name="location"
            [(ngModel)]="model.location"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Description *</label>
          <textarea
            name="description"
            [(ngModel)]="model.description"
            required
            rows="4"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">Contact name *</label>
            <input
              name="contact_name"
              [(ngModel)]="model.contact_name"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Contact phone *</label>
            <input
              name="contact_phone"
              [(ngModel)]="model.contact_phone"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Contact email</label>
          <input
            type="email"
            name="contact_email"
            [(ngModel)]="model.contact_email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            (change)="onFiles($event)"
            class="mt-1 w-full text-sm text-slate-600"
          />
        </div>

        <button
          type="submit"
          class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          [disabled]="submitting()"
        >
          {{ submitting() ? 'Submitting...' : 'Submit report' }}
        </button>
      </form>
    </section>
  `,
})
export class ReportFormComponent {
  private readonly reportService = inject(StrayReportService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  files: File[] = [];

  model = {
    type: 'lost',
    species: '',
    breed: '',
    color: '',
    occurred_at: '',
    location: '',
    description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  };

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.files = input.files ? Array.from(input.files) : [];
  }

  submit(): void {
    this.submitting.set(true);
    this.error.set(null);

    const formData = toFormData(this.model as unknown as Record<string, unknown>, 'photos[]', this.files);

    this.reportService.create(formData).subscribe({
      next: ({ data }) => {
        this.submitting.set(false);
        this.router.navigate(['/reports', data.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
