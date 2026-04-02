import {
  Component,
  DoCheck,
  ElementRef,
  HostListener,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AutocompleteOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-autocomplete',
  imports: [FormsModule],
  host: { class: 'block' },
  templateUrl: './autocomplete.html',
})
export class AutocompleteComponent implements DoCheck {
  id = input<string>(`ac-${Math.random().toString(36).substring(2, 9)}`);
  label = input<string>('');
  placeholder = input<string>('');
  options = input<AutocompleteOption[]>([]);
  disabled = input<boolean>(false);
  error = input<boolean>(false);

  /** The selected value (the option's `value` field) */
  value = model<string>('');

  /** Internal search text shown in the input */
  searchText = signal('');
  isOpen = signal(false);
  highlightedIndex = signal(-1);

  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('inputEl');

  /** Filter options based on search text */
  filteredOptions = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return this.options();
    return this.options().filter((opt) =>
      opt.label.toLowerCase().includes(query),
    );
  });

  /** Resolve a value to its display label */
  private resolveLabel(val: string): string {
    const match = this.options().find((o) => o.value === val);
    return match ? match.label : '';
  }

  private lastValue = '';
  private skipNextCheck = false;

  onFocus() {
    this.isOpen.set(true);
    this.highlightedIndex.set(-1);
    // If there's a selected value, show all options on focus by clearing search text temporarily
    if (this.value()) {
      this.searchText.set('');
    }
  }

  onInput(text: string) {
    this.searchText.set(text);
    this.isOpen.set(true);
    this.highlightedIndex.set(-1);
    // Clear the selected value when user starts typing
    if (this.value()) {
      this.skipNextCheck = true;
      this.value.set(''); // This will trigger ngDoCheck externally
    }
  }

  selectOption(option: AutocompleteOption) {
    this.skipNextCheck = true;
    this.value.set(option.value);
    this.searchText.set(option.label);
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  onKeydown(event: KeyboardEvent) {
    const opts = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update((i) => (i < opts.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update((i) => (i > 0 ? i - 1 : opts.length - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex() >= 0 && opts[this.highlightedIndex()]) {
          this.selectOption(opts[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        this.isOpen.set(false);
        // Restore the label if there's already a selected value
        if (this.value()) {
          this.searchText.set(this.resolveLabel(this.value()));
        }
        break;
    }
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const el = this.inputRef()?.nativeElement;
    if (
      el &&
      !el.closest('.autocomplete-wrapper')?.contains(event.target as Node)
    ) {
      this.isOpen.set(false);
      // Restore the label if there was already a selected value
      if (this.value()) {
        this.searchText.set(this.resolveLabel(this.value()));
      } else {
        this.searchText.set('');
      }
    }
  }

  /** Sync searchText when value changes externally (e.g. form reset) */
  ngDoCheck() {
    const currentVal = this.value();
    if (currentVal !== this.lastValue) {
      if (this.skipNextCheck) {
        this.skipNextCheck = false;
        this.lastValue = currentVal;
        return;
      }
      this.lastValue = currentVal;

      if (currentVal) {
        this.searchText.set(this.resolveLabel(currentVal));
      } else {
        this.searchText.set('');
      }
    }
  }
}
