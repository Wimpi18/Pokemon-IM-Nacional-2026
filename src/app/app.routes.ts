import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
        canActivate: [roleGuard],
        data: { roles: ['dirigente'] },
        loadComponent: () =>
          import('./points-management/points-management/points-management').then(
            (m) => m.PointsManagement,
          ),
      },
      {
        path: 'tablero',
        loadComponent: () =>
          import('./leaderboard/tablero/tablero').then(
            (m) => m.TableroComponent,
          ),
      },
      {
        path: 'tablero/:patrolId',
        loadComponent: () =>
          import('./leaderboard/patrol-detail/patrol-detail').then(
            (m) => m.PatrolDetailComponent,
          ),
      },
      {
        path: 'registrar-cursante',
        canActivate: [roleGuard],
        data: { roles: ['dirigente'] },
        loadComponent: () =>
          import('./participants-management/participant-registration/participant-registration').then(
            (m) => m.ParticipantRegistrationComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./core/profile/profile').then((m) => m.ProfileComponent),
      },
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'perfil' },
];
