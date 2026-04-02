import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, required, submit, validate } from '@angular/forms/signals';
import {
  ButtonComponent,
  AutocompleteComponent,
  NumberInputComponent,
  TextareaFieldComponent,
  type AutocompleteOption,
} from '../../shared/ui';
import { PointsService } from '../points.service';
import { AuthService } from '../../core/services/auth.service';
import { ParticipantService } from '../../participants-management/participant.service';

@Component({
  selector: 'app-points-management',

  imports: [
    FormsModule,
    ButtonComponent,
    AutocompleteComponent,
    NumberInputComponent,
    TextareaFieldComponent,
  ],
  templateUrl: './points-management.html',
})
export class PointsManagement {
  private readonly pointsService = inject(PointsService);
  private readonly authService = inject(AuthService);
  private readonly participantService = inject(ParticipantService);

  readonly targetOptions = signal<AutocompleteOption[]>([]);
  readonly targetsLoaded = signal<boolean>(false);

  constructor() {
    effect(() => {
      const profile = this.authService.userProfile();
      if (profile?.course) {
        this.loadCourseTargets(profile.course);
      }
    });
  }

  async loadCourseTargets(course: string) {
    this.targetsLoaded.set(false);
    try {
      const patrols = await this.participantService.getCoursePatrols(course);
      const cursantes =
        await this.participantService.getCourseCursantes(course);

      const formattedPatrols = patrols.map((p) => ({
        value: `patrulla:${p.id}`,
        label: `Patrulla ${p.name} (${p.course})`,
      }));

      const formattedCursantes = cursantes.map((c) => ({
        value: `cursante:${c.uid}`,
        label: `Cursante ${c.realName} (${c.nickname || 'Sin Apodo'})`,
      }));

      this.targetOptions.set([...formattedPatrols, ...formattedCursantes]);
    } catch (e) {
      console.error('Error fetching targets:', e);
    } finally {
      this.targetsLoaded.set(true);
    }
  }

  // 1. Modelo fuente de verdad
  formModel = signal({
    selectedTarget: '',
    pointsAdjustment: 0,
    justification: '',
  });

  // 2. Definición del formulario con validaciones
  managementForm = form(this.formModel, (schemaPath) => {
    required(schemaPath.selectedTarget, {
      message: 'Debe seleccionar una patrulla o cursante',
    });

    validate(schemaPath.pointsAdjustment, ({ value }) => {
      if (value() === 0) {
        return {
          kind: 'zeroValue',
          message: 'El valor numérico debe ser distinto de 0',
        };
      }
      return null;
    });

    required(schemaPath.justification, {
      message: 'La justificación es obligatoria',
    });
  });

  isSaving = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  // 3. Getters y Setters para conectar cómodamente la vista
  get selectedTarget() {
    return this.managementForm.selectedTarget().value();
  }
  set selectedTarget(val: string) {
    this.managementForm.selectedTarget().value.set(val);
  }

  get pointsAdjustment() {
    return this.managementForm.pointsAdjustment().value();
  }
  set pointsAdjustment(val: number) {
    this.managementForm.pointsAdjustment().value.set(val);
  }

  get justification() {
    return this.managementForm.justification().value();
  }
  set justification(val: string) {
    this.managementForm.justification().value.set(val);
  }

  saveChanges() {
    if (this.isSaving()) return;

    submit(this.managementForm, async () => {
      this.isSaving.set(true);
      const data = this.formModel();

      this.pointsService
        .saveAdjustment({
          target: data.selectedTarget,
          points: data.pointsAdjustment,
          justification: data.justification,
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.showSuccess.set(true);
            setTimeout(() => this.showSuccess.set(false), 3000);
            this.cancel();
          },
          error: () => {
            this.isSaving.set(false);
          },
        });
    });
  }

  cancel() {
    this.managementForm().reset();
    this.formModel.set({
      selectedTarget: '',
      pointsAdjustment: 0,
      justification: '',
    });
  }
}
