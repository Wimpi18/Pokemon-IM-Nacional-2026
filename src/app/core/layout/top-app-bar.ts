import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-top-app-bar',
  template: `
    <header
      class="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20"
    >
      <div
        class="max-w-2xl mx-auto flex justify-between items-center px-5 py-3"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden"
          >
            <img
              src="/Pokeball.ico"
              class="w-6 h-6 object-contain"
              alt="Logo"
            />
          </div>
          <h1
            class="font-headline uppercase tracking-widest font-extrabold text-on-surface text-sm"
          >
            {{ title() }}
          </h1>
        </div>

        @if (authService.currentUser()) {
          <div class="flex items-center gap-3">
            <span
              class="text-xs font-semibold text-on-surface-variant hidden sm:block"
            >
              {{ authService.currentUser()?.email }}
            </span>
            <button
              (click)="onLogout()"
              class="w-9 h-9 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors duration-200 active:scale-95"
              title="Cerrar sesión"
            >
              <span class="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        }
      </div>
    </header>
  `,
})
export class TopAppBarComponent {
  title = input<string>('');
  icon = input<string>('capture');

  public authService = inject(AuthService);
  private router = inject(Router);

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
