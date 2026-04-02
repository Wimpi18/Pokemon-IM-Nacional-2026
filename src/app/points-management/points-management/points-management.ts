import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
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

  selectedTarget = signal<string>('');
  pointsAdjustment = signal<number>(0);
  justification = signal<string>('');
  isSaving = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  /** Validation — true when form can be submitted */
  isValid = computed(
    () =>
      this.selectedTarget() !== '' &&
      this.pointsAdjustment() !== 0 &&
      this.justification().trim().length > 0,
  );

  saveChanges() {
    if (!this.isValid() || this.isSaving()) return;

    this.isSaving.set(true);
    this.pointsService
      .saveAdjustment({
        target: this.selectedTarget(),
        points: this.pointsAdjustment(),
        justification: this.justification(),
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showSuccess.set(true);
          setTimeout(() => this.showSuccess.set(false), 3000);
          this.resetForm();
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
  }

  cancel() {
    this.resetForm();
  }

  private resetForm() {
    this.selectedTarget.set('');
    this.pointsAdjustment.set(0);
    this.justification.set('');
  }
}
