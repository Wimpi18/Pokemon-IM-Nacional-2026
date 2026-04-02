import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  AutocompleteComponent,
  NumberInputComponent,
  TextareaFieldComponent,
  type AutocompleteOption,
} from '../../shared/ui';
import { PointsService } from '../points.service';

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

  targetOptions: AutocompleteOption[] = [
    { value: 'escuadron_charizard', label: 'Escuadrón Charizard (Patrulla)' },
    { value: 'batallon_blastoise', label: 'Batallón Blastoise (Patrulla)' },
    { value: 'ash', label: 'Ash Ketchum (Cursante)' },
    { value: 'gary', label: 'Gary Oak (Cursante)' },
    { value: 'misty', label: 'Misty Williams (Cursante)' },
  ];

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
