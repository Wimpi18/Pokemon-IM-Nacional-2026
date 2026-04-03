import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopAppBarComponent } from './top-app-bar';
import { BottomNavBarComponent } from './bottom-nav-bar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopAppBarComponent, BottomNavBarComponent],
  template: `
    <div class="flex flex-col h-dvh overflow-hidden bg-surface-lowest">
      <app-top-app-bar
        title="IM Nacional 2026"
        icon="capture"
        class="shrink-0"
      ></app-top-app-bar>
      <main class="flex-1 overflow-y-auto w-full relative">
        <router-outlet></router-outlet>
      </main>
      <!-- Bottom nav is fixed in its component but we can also place it here if we want it to occupy space -->
      <app-bottom-nav-bar></app-bottom-nav-bar>
    </div>
  `,
})
export class AppShellComponent {}
