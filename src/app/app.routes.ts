import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'gestion-de-puntos',
        loadComponent: () =>
          import('./points-management/points-management/points-management').then(
            (m) => m.PointsManagement,
          ),
      },
      { path: '', redirectTo: 'gestion-de-puntos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'gestion-de-puntos' },
];
