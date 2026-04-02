import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-bottom-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav-bar.html',
})
export class BottomNavBarComponent {
  private readonly authService = inject(AuthService);

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.authService.userProfile()?.role;

    if (role === 'dirigente') {
      return [
        {
          path: '/gestion-de-puntos',
          icon: 'stars',
          label: 'Gestión',
        },
        { path: '/tablero', icon: 'leaderboard', label: 'Tablero' },
        { path: '/registrar-cursante', icon: 'person_add', label: 'Inscribir' },
        { path: '/patrulla', icon: 'explore', label: 'Patrulla' },
        { path: '/perfil', icon: 'account_circle', label: 'Perfil' },
      ];
    } else if (role === 'cursante') {
      return [{ path: '/perfil', icon: 'account_circle', label: 'Perfil' }];
    }

    return [];
  });

  getFillStyle(isActive: boolean): string {
    return isActive ? "'FILL' 1" : "'FILL' 0";
  }
}
