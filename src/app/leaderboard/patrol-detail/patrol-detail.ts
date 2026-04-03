import { Component, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { of, switchMap, tap, filter, catchError, map } from 'rxjs';
import { PatrolDetailService } from './patrol-detail.service';
import { Patrol, PointTransaction } from '../../core/models/firebase.models';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-patrol-detail',
  imports: [RouterLink],
  templateUrl: './patrol-detail.html',
})
export class PatrolDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly detailService = inject(PatrolDetailService);

  /** Loading state */
  readonly isLoading = signal(true);

  /** Filters */
  readonly searchText = signal('');
  readonly selectedDate = signal('');

  /** Route param → patrol ID */
  private readonly patrolId$ = this.route.paramMap.pipe(
    map((params) => params.get('patrolId')),
    filter((id): id is string => id !== null),
  );

  /** Stream patrol info */
  private readonly patrol$ = this.patrolId$.pipe(
    switchMap((id) => this.detailService.getPatrol(id)),
  );

  /** Stream transactions */
  private readonly transactions$ = this.patrolId$.pipe(
    switchMap((id) => {
      this.isLoading.set(true);
      return this.detailService.getPatrolTransactions(id);
    }),
    tap(() => this.isLoading.set(false)),
    catchError((err) => {
      console.error('[PatrolDetail] Error cargando transacciones:', err);
      this.isLoading.set(false);
      return of([]);
    }),
  );

  readonly patrol = toSignal(this.patrol$, {
    initialValue: null as Patrol | null,
  });
  readonly allTransactions = toSignal(this.transactions$, {
    initialValue: [] as PointTransaction[],
  });

  /** Computed total score from all transactions */
  readonly totalScore = computed(() =>
    this.allTransactions().reduce((sum, tx) => sum + tx.points, 0),
  );

  /** Filtered transactions based on search text and selected date */
  readonly filteredTransactions = computed(() => {
    let txs = this.allTransactions();
    const search = this.searchText().toLowerCase().trim();
    const dateStr = this.selectedDate();

    // Filter by date
    if (dateStr) {
      const filterDate = new Date(dateStr + 'T00:00:00');
      txs = txs.filter((tx) => {
        const txDate = tx.timestamp.toDate();
        return (
          txDate.getFullYear() === filterDate.getFullYear() &&
          txDate.getMonth() === filterDate.getMonth() &&
          txDate.getDate() === filterDate.getDate()
        );
      });
    }

    // Filter by search text
    if (search) {
      txs = txs.filter(
        (tx) =>
          tx.justification.toLowerCase().includes(search) ||
          tx.authorName.toLowerCase().includes(search),
      );
    }

    return txs;
  });

  /** Count of active filters */
  readonly activeFilters = computed(() => {
    let count = 0;
    if (this.searchText().trim()) count++;
    if (this.selectedDate()) count++;
    return count;
  });

  /** Format a Firestore Timestamp to a readable date string */
  formatDate(timestamp: Timestamp): string {
    const d = timestamp.toDate();
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Format timestamp to time only */
  formatTime(timestamp: Timestamp): string {
    const d = timestamp.toDate();
    return d.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Clear all filters */
  clearFilters(): void {
    this.searchText.set('');
    this.selectedDate.set('');
  }

  onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  /** Programmatically open the native date picker */
  openDatePicker(input: HTMLInputElement): void {
    const el = input as HTMLInputElement & { showPicker?: () => void };
    try {
      if (el.showPicker) {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch (e) {
      console.warn(
        '[PatrolDetail] showPicker failed, falling back to focus',
        e,
      );
      el.focus();
      el.click();
    }
  }

  /** Format a YYYY-MM-DD input string for friendly display */
  formatDateStr(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
