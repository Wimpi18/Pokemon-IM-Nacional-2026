import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopAppBarComponent } from './top-app-bar';
import { BottomNavBarComponent } from './bottom-nav-bar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopAppBarComponent, BottomNavBarComponent],
  template: `
    <app-top-app-bar title="IM Nacional 2026" icon="capture"></app-top-app-bar>
    <router-outlet></router-outlet>
    <app-bottom-nav-bar></app-bottom-nav-bar>
  `,
})
export class AppShellComponent {}
