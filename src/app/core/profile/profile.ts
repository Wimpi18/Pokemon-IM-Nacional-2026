import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import {
  form,
  FormField,
  required,
  validate,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PokemonService } from '../services/pokemon.service';
import { FirebaseService } from '../services/firebase.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { AutocompleteComponent } from '../../shared/ui/autocomplete/autocomplete';

@Component({
  selector: 'app-profile',
  imports: [ButtonComponent, AutocompleteComponent, FormField],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  public readonly authService = inject(AuthService);
  private readonly pokemonService = inject(PokemonService);
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  // UI State
  pokemonOptions = signal<{ value: string; label: string }[]>([]);
  randomProposal = signal<string>('');
  patrolName = signal<string>('Cargando...');
  isLoading = signal(false);
  isEditing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Form model
  profileModel = signal({
    realName: '',
    nickname: '',
    phoneNumber: '',
    selectedPokemon: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Signal Form instance
  profileForm = form(this.profileModel, (schemaPath) => {
    required(schemaPath.realName, { message: 'El nombre es obligatorio' });
    required(schemaPath.nickname, { message: 'El apodo es obligatorio' });
    required(schemaPath.phoneNumber, { message: 'El teléfono es obligatorio' });
    required(schemaPath.selectedPokemon, {
      message: 'Debes elegir un Pokémon',
    });

    // Optional password validation
    validate(schemaPath.newPassword, ({ value }) => {
      if (value() && value().length < 6) {
        return { kind: 'minLen', message: 'Mínimo 6 caracteres' };
      }
      return null;
    });

    // Confirmation validation
    validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
      if (
        valueOf(schemaPath.newPassword) &&
        value() !== valueOf(schemaPath.newPassword)
      ) {
        return { kind: 'mismatch', message: 'Las contraseñas no coinciden' };
      }
      return null;
    });
  });

  // Computed for UI previews - Use form values for immediate updates
  selectedPokemonArtwork = computed(() => {
    const name = this.profileForm.selectedPokemon().value();
    return name ? this.pokemonService.getArtworkUrl(name) : null;
  });

  proposalArtwork = computed(() => {
    const name = this.randomProposal();
    return name ? this.pokemonService.getArtworkUrl(name) : null;
  });

  constructor() {
    this.initData();

    // Initial sync from auth to form
    effect(() => {
      const profile = this.authService.userProfile();
      if (profile) {
        // Update both model and form signals to ensure total sync
        const nextData = {
          realName: profile.realName || '',
          nickname: profile.nickname || '',
          phoneNumber: profile.phoneNumber || '',
          selectedPokemon: profile.selectedPokemon || '',
          newPassword: '',
          confirmPassword: '',
        };

        this.profileModel.set(nextData);

        // Explicitly set form field signals to avoid empty initial states
        this.profileForm.realName().value.set(nextData.realName);
        this.profileForm.nickname().value.set(nextData.nickname);
        this.profileForm.phoneNumber().value.set(nextData.phoneNumber);
        this.profileForm.selectedPokemon().value.set(nextData.selectedPokemon);

        // Dynamically load patrol name if participant
        if (profile.role === 'cursante' && profile.patrolId) {
          this.loadPatrolName(profile.patrolId);
        } else {
          this.patrolName.set('Gimnasio Dirigente (Equipo IM)');
        }
      }
    });
  }

  private async loadPatrolName(id: string) {
    try {
      const patrol = await firstValueFrom(
        this.firebaseService.getPatrol(id).pipe(take(1)),
      );
      this.patrolName.set(patrol?.name || 'Equipo no encontrado');
    } catch (err) {
      console.error('[Profile] Error loading patrol:', err);
      this.patrolName.set('Error en sincronización');
    }
  }

  async initData() {
    const names = await this.pokemonService.getPokemonNames();
    this.pokemonOptions.set(
      names.map((n) => ({
        value: n,
        label: n.charAt(0).toUpperCase() + n.slice(1),
      })),
    );
    this.refreshProposal();
  }

  async refreshProposal() {
    const name = await this.pokemonService.getRandomPokemonName();
    this.randomProposal.set(name);
  }

  useProposal() {
    if (!this.isEditing()) return;
    this.profileForm.selectedPokemon().value.set(this.randomProposal());
  }

  toggleEdit() {
    this.isEditing.update((v) => !v);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  async onSubmit() {
    this.successMessage.set('');
    this.errorMessage.set('');

    submit(this.profileForm, async () => {
      this.isLoading.set(true);
      try {
        const user = this.authService.currentUser();
        if (!user) throw new Error('Usuario no identificado');

        // VALORES DIRECTOS DE LOS SIGNALS DEL FORMULARIO
        const profileData = {
          realName: this.profileForm.realName().value(),
          nickname: this.profileForm.nickname().value(),
          phoneNumber: this.profileForm.phoneNumber().value(),
          selectedPokemon: this.profileForm.selectedPokemon().value(),
        };

        const newPass = this.profileForm.newPassword().value();
        const confPass = this.profileForm.confirmPassword().value();

        // 1. Guardar Perfil en Firestore
        await this.authService.updateProfile(user.uid, profileData);

        // 2. Actualizar Password si corresponde
        if (newPass && newPass === confPass) {
          await this.authService.updateAuthPassword(newPass);
        }

        this.successMessage.set('¡Tu perfil ha sido pokemonizado con éxito!');
        this.isEditing.set(false); // Salir de modo edición

        // Reset inputs de clave
        this.profileForm.newPassword().value.set('');
        this.profileForm.confirmPassword().value.set('');
      } catch (err: unknown) {
        console.error('[Profile] Error during update:', err);
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        this.errorMessage.set('Hubo un problema al guardar: ' + msg);
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
