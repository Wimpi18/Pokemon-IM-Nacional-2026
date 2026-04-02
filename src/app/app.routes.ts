import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
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
];
