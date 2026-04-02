import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/ui/button/button';

@Component({
  selector: 'app-profile',
  imports: [ButtonComponent],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
