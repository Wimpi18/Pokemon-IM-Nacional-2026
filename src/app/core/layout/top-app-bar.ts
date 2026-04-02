import { Component, input } from '@angular/core';

@Component({
  selector: 'app-top-app-bar',

  template: `
    <header
      class="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20"
    >
      <div
        class="max-w-2xl mx-auto flex justify-between items-center px-5 py-3"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"
          >
            <span
              class="material-symbols-outlined text-primary text-xl"
              style="font-variation-settings: 'FILL' 1"
              >{{ icon() }}</span
            >
          </div>
          <h1
            class="font-headline uppercase tracking-widest font-extrabold text-on-surface text-sm"
          >
            {{ title() }}
          </h1>
        </div>
        <button
          class="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors duration-200 active:scale-95"
        >
          <span class="material-symbols-outlined text-xl">help_outline</span>
        </button>
      </div>
    </header>
  `,
})
export class TopAppBarComponent {
  title = input<string>('');
  icon = input<string>('capture');
}
