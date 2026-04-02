import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  runTransaction,
  query,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User, Patrol, PointTransaction } from '../models/firebase.models';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore = inject(Firestore);

  // --- Usuarios (users) ---
  getUser(uid: string): Observable<User | undefined> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return new Observable((subscriber) => {
      return onSnapshot(userRef, (snapshot) => {
        subscriber.next(
          snapshot.exists()
            ? ({ ...snapshot.data(), uid: snapshot.id } as User)
            : undefined,
        );
      });
    });
  }

  // --- Patrullas (patrols) ---
  getPatrol(patrolId: string): Observable<Patrol | undefined> {
    const patrolRef = doc(this.firestore, `patrols/${patrolId}`);
    return new Observable((subscriber) => {
      return onSnapshot(patrolRef, (snapshot) => {
        subscriber.next(
          snapshot.exists()
            ? ({ ...snapshot.data(), id: snapshot.id } as Patrol)
            : undefined,
        );
      });
    });
  }

  listPatrols(): Observable<Patrol[]> {
    const patrolsRef = collection(this.firestore, 'patrols');
    return new Observable((subscriber) => {
      const q = query(patrolsRef, orderBy('name'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          subscriber.next(
            snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Patrol),
          );
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addPointTransaction(
    transaction: Omit<PointTransaction, 'id'>,
  ): Promise<void> {
    const patrolRef = doc(this.firestore, `patrols/${transaction.patrolId}`);
    const transactionsRef = collection(this.firestore, 'point_transactions');

    try {
      await runTransaction(this.firestore, async (firestoreTransaction) => {
        const patrolDoc = await firestoreTransaction.get(patrolRef);
        if (!patrolDoc.exists()) {
          throw new Error('¡La patrulla no existe!');
        }

        const currentScore = patrolDoc.data()['totalScore'] || 0;
        const newScore = currentScore + transaction.points;

        // 2. Transacción de actualización a la patrulla
        firestoreTransaction.update(patrolRef, { totalScore: newScore });

        // 3. Crear el documento de la transacción de puntos
        const newTransactionRef = doc(transactionsRef); // Autogenera un nuevo ID
        firestoreTransaction.set(newTransactionRef, transaction);
      });
      console.log('Transacción de puntos registrada con éxito.');
    } catch (error) {
      console.error('Error en la transacción de puntos: ', error);
      throw error;
    }
  }
}
