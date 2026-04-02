import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
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
      <textarea
        [id]="id()"
        [(ngModel)]="value"
        [placeholder]="placeholder()"
        [rows]="rows()"
        [disabled]="disabled()"
        [class]="
          'w-full bg-surface-container-lowest border px-4 py-3.5 rounded-xl font-body text-sm leading-relaxed text-on-surface placeholder:text-on-surface-variant/50 transition-all duration-200 disabled:opacity-40 resize-y ' +
          (error()
            ? 'border-error ring-2 ring-error/15 focus:border-error focus:ring-error/25'
            : 'border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/15')
        "
      >
      </textarea>
    </div>
  `,
})
export class TextareaFieldComponent {
  id = input<string>(`textarea-${Math.random().toString(36).substring(2, 9)}`);
  label = input<string>('');
  placeholder = input<string>('');
  rows = input<number>(4);
  disabled = input<boolean>(false);
  error = input<boolean>(false);
  value = model<string>('');
}
