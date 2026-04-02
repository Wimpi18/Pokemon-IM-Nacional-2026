import { Component, inject, computed, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { LeaderboardService, RankedPatrol } from '../leaderboard.service';
import { Cursante } from '../../core/models/firebase.models';
import {
  of,
  switchMap,
  tap,
  filter,
  distinctUntilChanged,
  map,
  catchError,
} from 'rxjs';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
})
export class TableroComponent {
  private readonly authService = inject(AuthService);
  private readonly leaderboardService = inject(LeaderboardService);

  /** Reactive profile access */
  readonly profile = this.authService.userProfile;

  /** Determine current user's patrol (only cursantes have one) */
  private readonly currentPatrolId = computed(() => {
    const p = this.profile();
    if (p && p.role === 'cursante') {
      return (p as Cursante).patrolId || null;
    }
    return null;
  });

  /** Loading state */
  readonly isLoading = signal(true);

  /**
   * Reactively subscribe to ranked patrols when profile changes.
   * Filters out null profiles to avoid premature empty emissions on page refresh.
   * Only re-subscribes when the course actually changes.
   */
  private readonly rankedPatrols$ = toObservable(this.profile).pipe(
    filter((p): p is NonNullable<typeof p> => p !== null),
    map((p) => ({ course: p.course, patrolId: this.currentPatrolId() })),
    distinctUntilChanged((a, b) => a.course === b.course),
    switchMap(({ course, patrolId }) => {
      if (course) {
        this.isLoading.set(true);
        return this.leaderboardService.getRankedPatrols(course, patrolId);
      }
      this.isLoading.set(false);
      return of([]);
    }),
    tap(() => this.isLoading.set(false)),
    catchError((err) => {
      console.error('[Tablero] Error cargando ranking:', err);
      this.isLoading.set(false);
      return of([]);
    }),
  );

  readonly rankedPatrols = toSignal(this.rankedPatrols$, {
    initialValue: [] as RankedPatrol[],
  });

  /** The current user's own patrol (if cursante) */
  readonly myPatrol = computed(
    () => this.rankedPatrols().find((p) => p.isCurrentUserPatrol) ?? null,
  );

  /** Total number of distinct positions */
  readonly totalPositions = computed(() => {
    const patrols = this.rankedPatrols();
    if (patrols.length === 0) return 0;
    return patrols[patrols.length - 1].rank;
  });

  /** Group patrols by rank for the UI */
  readonly groupedByRank = computed(() => {
    const patrols = this.rankedPatrols();
    const groups: { rank: number; patrols: RankedPatrol[] }[] = [];
    let currentGroup: { rank: number; patrols: RankedPatrol[] } | null = null;

    for (const patrol of patrols) {
      if (!currentGroup || currentGroup.rank !== patrol.rank) {
        currentGroup = { rank: patrol.rank, patrols: [] };
        groups.push(currentGroup);
      }
      currentGroup.patrols.push(patrol);
    }

    return groups;
  });

  /** Rank-specific styling helpers */
  getRankBorderColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'border-l-secondary';
      case 2:
        return 'border-l-tertiary';
      case 3:
        return 'border-l-outline';
      default:
        return 'border-l-outline-variant/40';
    }
  }

  getRankIconBg(rank: number): string {
    switch (rank) {
      case 1:
        return 'bg-secondary/10';
      case 2:
        return 'bg-tertiary/10';
      case 3:
        return 'bg-outline/10';
      default:
        return 'bg-surface-container-low';
    }
  }

  getRankIconColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'text-secondary';
      case 2:
        return 'text-tertiary';
      case 3:
        return 'text-outline';
      default:
        return 'text-on-surface-variant';
    }
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1:
        return 'military_tech';
      case 2:
        return 'workspace_premium';
      case 3:
        return 'star';
      default:
        return 'shield';
    }
  }

  getRankLabel(rank: number): string {
    return `${rank}º`;
  }

  getScoreColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'text-secondary';
      case 2:
        return 'text-tertiary';
      default:
        return 'text-on-surface';
    }
  }
}
