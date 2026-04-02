import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ParticipantService } from '../participant.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { AutocompleteComponent } from '../../shared/ui/autocomplete/autocomplete';
import { Patrol } from '../../core/models/firebase.models';

@Component({
  selector: 'app-participant-registration',
  imports: [ReactiveFormsModule, ButtonComponent, AutocompleteComponent],
  templateUrl: './participant-registration.html',
})
export class ParticipantRegistrationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly participantService = inject(ParticipantService);
  private readonly router = inject(Router);

  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');
  public availablePatrols = signal<Patrol[]>([]);
  public patrolsLoaded = signal<boolean>(false);

  // Using standard reactive forms here to handle many fields easily
  public registrationForm = this.fb.nonNullable.group({
    realName: ['', [Validators.required, Validators.minLength(3)]],
    nickname: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    patrolId: ['', [Validators.required]],
  });

  // Convert array to options for the select input
  public patrolOptions = computed(() => {
    return this.availablePatrols().map((patrol) => ({
      value: patrol.id,
      label: patrol.name,
    }));
  });

  async ngOnInit() {
    // When the component loads, fetch the patrols for this dirigente's course
    const profile = this.authService.userProfile();
    if (profile && profile.course) {
      try {
        const patrols = await this.participantService.getCoursePatrols(
          profile.course,
        );
        this.availablePatrols.set(patrols);
      } catch {
        this.errorMessage.set('Error cargando las patrullas del curso.');
      } finally {
        this.patrolsLoaded.set(true);
      }
    } else {
      this.errorMessage.set('No se pudo identificar tu curso.');
      this.patrolsLoaded.set(true);
    }
  }

  async onSubmit() {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.registrationForm.getRawValue();
    const profile = this.authService.userProfile();

    if (!profile || !profile.course) {
      this.errorMessage.set('Falta el curso del dirigente.');
      this.isLoading.set(false);
      return;
    }

    try {
      await this.participantService.registerCursante(
        formValue.email,
        formValue.password,
        {
          realName: formValue.realName,
          nickname: formValue.nickname,
          phoneNumber: formValue.phoneNumber,
          selectedPokemon: null as unknown as string, // Se envía como null
          patrolId: formValue.patrolId,
          course: profile.course, // Inherit course strictly from the Dirigente
        },
      );

      this.successMessage.set('¡Cursante registrado exitosamente!');
      this.registrationForm.reset();
    } catch (err) {
      const error = err as Error;
      this.errorMessage.set(
        error?.message || 'Ocurrió un error al registrar el cursante.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
