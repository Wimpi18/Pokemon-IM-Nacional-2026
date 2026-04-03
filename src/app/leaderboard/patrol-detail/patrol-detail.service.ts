import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import {
  PointTransaction,
  Patrol,
  Cursante,
} from '../../core/models/firebase.models';

@Injectable({ providedIn: 'root' })
export class PatrolDetailService {
  private readonly firestore = inject(Firestore);

  /** Get patrol info by ID */
  getPatrol(patrolId: string): Observable<Patrol | null> {
    const patrolRef = doc(this.firestore, 'patrols', patrolId);
    return new Observable((subscriber) => {
      const unsub = onSnapshot(
        patrolRef,
        (snapshot) => {
          subscriber.next(
            snapshot.exists()
              ? ({ ...snapshot.data(), id: snapshot.id } as Patrol)
              : null,
          );
        },
        (error) => subscriber.error(error),
      );
      return () => unsub();
    });
  }

  /** Stream all point transactions for a patrol, ordered by most recent first */
  getPatrolTransactions(patrolId: string): Observable<PointTransaction[]> {
    const txRef = collection(this.firestore, 'point_transactions');
    const q = query(txRef, where('patrolId', '==', patrolId));

    return new Observable((subscriber) => {
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const transactions = snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as PointTransaction,
          );

          // Sorteo manual en memoria para evitar requerir un índice compuesto en Firestore
          transactions.sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || 0;
            return timeB - timeA; // Descendente: más reciente primero
          });

          subscriber.next(transactions);
        },
        (error) => {
          console.error('[PatrolDetailService] Error en snapshot:', error);
          subscriber.error(error);
        },
      );
      return () => unsub();
    });
  }

  /** Stream all members for a patrol */
  getPatrolMembers(patrolId: string): Observable<Cursante[]> {
    const userRef = collection(this.firestore, 'users');
    const q = query(
      userRef,
      where('role', '==', 'cursante'),
      where('patrolId', '==', patrolId),
    );

    return new Observable((subscriber) => {
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const members = snapshot.docs.map(
            (d) => ({ ...d.data(), uid: d.id }) as Cursante,
          );
          subscriber.next(members);
        },
        (error) => subscriber.error(error),
      );
      return () => unsub();
    });
  }
}
