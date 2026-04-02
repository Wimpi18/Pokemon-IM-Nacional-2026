import { Component, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'app-button',

  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClasses()',
    '[attr.aria-disabled]': 'isDisabled()',
    '[tabindex]': 'isDisabled() ? -1 : 0',
    role: 'button',
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('default');
  customClass = input<string>('');
  isDisabled = input<boolean>(false);

  computedClasses = computed(() => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-headline font-bold text-sm tracking-wide cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]';

    let variantClasses: string;
    switch (this.variant()) {
      case 'destructive':
        variantClasses =
          'bg-primary text-on-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110';
        break;
      case 'secondary':
        variantClasses =
          'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest shadow-sm';
        break;
      case 'outline':
        variantClasses =
          'border border-outline-variant bg-transparent hover:bg-surface-container text-on-surface';
        break;
      case 'ghost':
        variantClasses =
          'hover:bg-surface-container text-on-surface-variant shadow-none';
        break;
      default: // primary
        variantClasses =
          'bg-primary text-on-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110';
        break;
    }

    let sizeClasses: string;
    switch (this.size()) {
      case 'sm':
        sizeClasses = 'h-9 px-3.5 text-xs';
        break;
      case 'lg':
        sizeClasses = 'h-12 px-8 text-base';
        break;
      case 'icon':
        sizeClasses = 'h-10 w-10 rounded-xl p-0';
        break;
      default:
        sizeClasses = 'h-11 px-6 flex-1';
        break;
    }

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${this.customClass()}`;
  });
}
