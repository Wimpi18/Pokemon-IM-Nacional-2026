import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Patrol } from '../core/models/firebase.models';

export interface RankedPatrol extends Patrol {
  totalScore: number;
  rank: number;
  isCurrentUserPatrol: boolean;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly firestore = inject(Firestore);

  /**
   * Streams ranked patrols for a course.
   * Score is computed by summing all point_transactions per patrolId.
   * Uses real-time listeners on both collections so the board updates live.
   */
  getRankedPatrols(
    course: string,
    currentPatrolId: string | null,
  ): Observable<RankedPatrol[]> {
    return new Observable((subscriber) => {
      // Listen to patrols for this course
      const patrolsQ = query(
        collection(this.firestore, 'patrols'),
        where('course', '==', course),
      );

      // We track both unsubscriptions
      let patrolsData: Patrol[] = [];
      let scoresMap = new Map<string, number>();
      let patrolsReady = false;
      let scoresReady = false;

      const emit = () => {
        if (!patrolsReady || !scoresReady) return;

        // Merge patrols with their computed scores
        const withScores = patrolsData.map((p) => ({
          ...p,
          totalScore: scoresMap.get(p.id) || 0,
        }));

        // Sort by totalScore descending
        withScores.sort((a, b) => b.totalScore - a.totalScore);

        // Dense ranking
        const ranked: RankedPatrol[] = [];
        let currentRank = 0;
        let previousScore: number | null = null;

        for (const patrol of withScores) {
          if (patrol.totalScore !== previousScore) {
            currentRank++;
            previousScore = patrol.totalScore;
          }
          ranked.push({
            ...patrol,
            rank: currentRank,
            isCurrentUserPatrol: patrol.id === currentPatrolId,
          });
        }

        subscriber.next(ranked);
      };

      // Listener 1: Patrols
      const unsubPatrols = onSnapshot(
        patrolsQ,
        (snapshot) => {
          patrolsData = snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as Patrol,
          );
          patrolsReady = true;

          // Once we know the patrol IDs, set up the transactions listener
          if (patrolsData.length > 0) {
            refreshScores();
          } else {
            scoresReady = true;
            emit();
          }
        },
        (error) => subscriber.error(error),
      );

      // Listener 2: Transactions — listens to all transactions for this course's patrols
      let unsubTransactions: (() => void) | null = null;

      const refreshScores = () => {
        // Clean up previous listener
        if (unsubTransactions) unsubTransactions();

        const patrolIds = patrolsData.map((p) => p.id);

        const txQ = query(
          collection(this.firestore, 'point_transactions'),
          where('patrolId', 'in', patrolIds),
        );

        unsubTransactions = onSnapshot(
          txQ,
          (snapshot) => {
            const newScores = new Map<string, number>();
            for (const d of snapshot.docs) {
              const data = d.data();
              const pid = data['patrolId'] as string;
              const pts = (data['points'] as number) || 0;
              newScores.set(pid, (newScores.get(pid) || 0) + pts);
            }
            scoresMap = newScores;
            scoresReady = true;
            emit();
          },
          (error) => subscriber.error(error),
        );
      };

      // Cleanup
      return () => {
        unsubPatrols();
        if (unsubTransactions) unsubTransactions();
      };
    });
  }
}
