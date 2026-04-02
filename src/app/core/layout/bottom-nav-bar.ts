import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly navItems: NavItem[] = [
    { path: '/gestion-de-puntos', icon: 'settings_remote', label: 'Gestión' },
    { path: '/tablero', icon: 'leaderboard', label: 'Tablero' },
    { path: '/patrulla', icon: 'explore', label: 'Patrulla' },
    { path: '/perfil', icon: 'person', label: 'Perfil' },
  ];

  getFillStyle(isActive: boolean): string {
    return isActive ? "'FILL' 1" : "'FILL' 0";
  }
}
