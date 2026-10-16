import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'animals',
    loadComponent: () =>
      import('./features/animals/animal-list.component').then((m) => m.AnimalListComponent),
  },
  {
    path: 'animals/:id',
    loadComponent: () =>
      import('./features/animals/animal-detail.component').then((m) => m.AnimalDetailComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/report-list.component').then((m) => m.ReportListComponent),
  },
  {
    path: 'reports/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/report-form.component').then((m) => m.ReportFormComponent),
  },
  {
    path: 'reports/:id',
    loadComponent: () =>
      import('./features/reports/report-detail.component').then((m) => m.ReportDetailComponent),
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/applications/my-applications.component').then(
        (m) => m.MyApplicationsComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'animals',
        loadComponent: () =>
          import('./features/admin/admin-animals.component').then((m) => m.AdminAnimalsComponent),
      },
      {
        path: 'animals/new',
        loadComponent: () =>
          import('./features/admin/animal-form.component').then((m) => m.AnimalFormComponent),
      },
      {
        path: 'animals/:id/edit',
        loadComponent: () =>
          import('./features/admin/animal-form.component').then((m) => m.AnimalFormComponent),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/admin/admin-applications.component').then(
            (m) => m.AdminApplicationsComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
