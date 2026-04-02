import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-input',

  imports: [FormsModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-2 w-full">
      @if (label()) {
        <label
          [for]="id()"
          class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1"
        >
          {{ label() }}
        </label>
      }
      <div
        class="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden h-14"
      >
        <button
          type="button"
          (click)="decrement()"
          [disabled]="disabled()"
          class="w-14 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-colors duration-200 active:scale-90 disabled:opacity-40 border-r border-outline-variant/20"
          aria-label="Decrementar"
        >
          <span class="material-symbols-outlined text-xl font-bold"
            >remove</span
          >
        </button>
        <input
          [id]="id()"
          [(ngModel)]="value"
          [disabled]="disabled()"
          class="flex-1 text-center bg-transparent border-none focus:ring-0 text-2xl font-headline font-extrabold text-accent py-2 disabled:opacity-40"
          type="number"
        />
        <button
          type="button"
          (click)="increment()"
          [disabled]="disabled()"
          class="w-14 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-colors duration-200 active:scale-90 disabled:opacity-40 border-l border-outline-variant/20"
          aria-label="Incrementar"
        >
          <span class="material-symbols-outlined text-xl font-bold">add</span>
        </button>
      </div>
    </div>
  `,
})
export class NumberInputComponent {
  id = input<string>(`number-${Math.random().toString(36).substring(2, 9)}`);
  label = input<string>('');
  disabled = input<boolean>(false);
  value = model<number>(0);

  increment() {
    if (!this.disabled()) {
      this.value.update((v) => (v || 0) + 1);
    }
  }

  decrement() {
    if (!this.disabled()) {
      this.value.update((v) => (v || 0) - 1);
    }
  }
}
