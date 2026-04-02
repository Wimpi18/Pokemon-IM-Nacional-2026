import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Patrol } from '../core/models/firebase.models';

/** Patrol enriched with its computed leaderboard rank */
export interface RankedPatrol extends Patrol {
  rank: number;
  isCurrentUserPatrol: boolean;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly firestore = inject(Firestore);

  getRankedPatrols(
    course: string,
    currentPatrolId: string | null,
  ): Observable<RankedPatrol[]> {
    const patrolsRef = collection(this.firestore, 'patrols');
    const q = query(
      patrolsRef,
      where('course', '==', course),
      orderBy('totalScore', 'desc'),
    );

    return new Observable<RankedPatrol[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const patrols: Patrol[] = snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as Patrol,
          );

          const ranked: RankedPatrol[] = [];
          let currentRank = 0;
          let previousScore: number | null = null;

          for (const patrol of patrols) {
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
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }
}
