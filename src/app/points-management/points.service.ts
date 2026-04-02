import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PointsAdjustment } from './points-adjustment.model';
import { FirebaseService } from '../core/services/firebase.service';
import { PointTransaction, Cursante } from '../core/models/firebase.models';
import { Firestore, doc, getDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PointsService {
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  saveAdjustment(data: PointsAdjustment): Observable<void> {
    // Usamos `from` para convertir nuestra lógica asíncrona en Observable para el componente
    return from(this.processAdjustment(data));
  }

  private async processAdjustment(data: PointsAdjustment): Promise<void> {
    const profile = this.authService.userProfile();
    const currentAuth = this.authService.currentUser();

    // Identidad Real del Dirigente
    const authorId = currentAuth?.uid || 'sin_id';
    const authorName =
      profile?.realName || profile?.nickname || 'Dirigente Desconocido';

    let targetType: 'cursante' | 'patrulla';
    let targetId: string;
    let patrolId = '';

    if (data.target.startsWith('patrulla:')) {
      targetType = 'patrulla';
      targetId = data.target.replace('patrulla:', '');
      patrolId = targetId;
    } else if (data.target.startsWith('cursante:')) {
      targetType = 'cursante';
      targetId = data.target.replace('cursante:', '');
      try {
        const userRef = doc(this.firestore, 'users', targetId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as Cursante;
          patrolId = userData.patrolId || 'patrulla_desconocida';
        }
      } catch (e) {
        console.warn('No se pudo encontrar a la patrulla del cursante', e);
        patrolId = 'patrulla_desconocida';
      }
    } else {
      targetType = 'patrulla';
      targetId = data.target;
      patrolId = data.target;
    }

    const searchTerms = data.justification
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const transaction: Omit<PointTransaction, 'id'> = {
      patrolId: patrolId,
      targetType: targetType,
      targetId: targetId,
      points: data.points,
      justification: data.justification,
      authorId: authorId,
      authorName: authorName,
      timestamp: Timestamp.now(),
      searchTerms: searchTerms,
    };

    console.log(
      '[PointsService] Enviando transacción a Firestore:',
      transaction,
    );

    await this.firebaseService.addPointTransaction(transaction);
  }
}
