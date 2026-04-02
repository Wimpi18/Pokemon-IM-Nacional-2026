import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { FirebaseService } from '../../core/services/firebase.service';

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
  private readonly firebaseService = inject(FirebaseService);

  // 1. Nos suscribimos a Firebase y lo convertimos a una Signal nativa de Angular
  private patrols = toSignal(this.firebaseService.listPatrols(), {
    initialValue: [],
  });

  // 2. Mapeamos las patrullas reales
  targetOptions = computed<AutocompleteOption[]>(() => {
    const firestorePatrols = this.patrols().map((p) => ({
      value: `patrulla:${p.id}`, // Prefijo identificador
      label: `Patrulla ${p.name} (${p.course})`,
    }));

    return firestorePatrols;
  });

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
