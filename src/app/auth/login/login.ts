import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { form, required, email, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Model
  loginModel = signal({
    email: '',
    password: '',
  });

  // Schema
  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El correo es obligatorio' });
    email(schemaPath.email, {
      message: 'Debe ser un formato de correo válido',
    });
    required(schemaPath.password, { message: 'La contraseña es obligatoria' });
  });

  isLoading = signal(false);
  errorMessage = signal('');

  // Accessors para [(value)] (aunque usaremos la directiva formField nativa)
  get emailField() {
    return this.loginForm.email().value();
  }
  set emailField(val: string) {
    this.loginForm.email().value.set(val);
  }

  get passwordField() {
    return this.loginForm.password().value();
  }
  set passwordField(val: string) {
    this.loginForm.password().value.set(val);
  }

  async onSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    submit(this.loginForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { email, password } = this.loginModel();

      try {
        await this.authService.loginEmail(email, password);
        this.router.navigate(['/']); // Redirigir al gestor principal
      } catch {
        this.isLoading.set(false);
        this.errorMessage.set('Credenciales incorrectas.');
      }
    });
  }
}
