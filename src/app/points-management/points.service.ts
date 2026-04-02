import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PointsAdjustment } from './points-adjustment.model';
import { FirebaseService } from '../core/services/firebase.service';
import { PointTransaction } from '../core/models/firebase.models';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class PointsService {
  private firebaseService = inject(FirebaseService);

  saveAdjustment(data: PointsAdjustment): Observable<void> {
    // 1. Determinar el tipo de objetivo de forma segura mediante prefijos
    let targetType: 'cursante' | 'patrulla' = 'cursante';
    let targetId = data.target;
    let patrolId = 'patrulla_001'; // Fallback temporal para cursantes

    if (data.target.startsWith('patrulla:')) {
      targetType = 'patrulla';
      targetId = data.target.replace('patrulla:', ''); // Extraer ID limpio
      patrolId = targetId; // Si es patrulla, el ID de patrulla es el mismo
    } else if (data.target.startsWith('cursante:')) {
      targetType = 'cursante';
      targetId = data.target.replace('cursante:', '');
      // Cuando tengas la DB de cursantes, harás una búsqueda para ver a qué patrulla pertenece este cursante.
      // patrolId = buscarPatrullaDelCursante(targetId);
    } else {
      // Fallback para mantener compatibilidad si no usan prefijos
      if (
        data.target.includes('escuadron') ||
        data.target.includes('batallon')
      ) {
        targetType = 'patrulla';
        patrolId = data.target;
      }
    }

    // 2. Construir los términos de búsqueda (separar por espacios y minúsculas)
    const searchTerms = data.justification
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 2); // Excluir palabras muy cortas (el, la, a)

    // 3. Crear el modelo estructurado de Firebase
    const transaction: Omit<PointTransaction, 'id'> = {
      patrolId: patrolId,
      targetType: targetType,
      targetId: targetId, // <- Usando la variable local en vez de `data.target` directo
      points: data.points,
      justification: data.justification,
      authorId: 'dirigente_mock_123', // TODO: Reemplazar con Auth UID real
      authorName: 'Dirigente Ejemplo', // TODO: Reemplazar con nombre de Auth real
      timestamp: Timestamp.now(), // Timestamp oficial de Firestore
      dateString: new Date().toISOString().split('T')[0], // Truco de fecha 'YYYY-MM-DD'
      searchTerms: searchTerms,
    };

    console.log(
      '[PointsService] Enviando transacción a Firestore:',
      transaction,
    );

    // 4. Ejecutar y convertir la promesa del servicio Firebase en un Observable para compatibilidad con la UI
    return from(this.firebaseService.addPointTransaction(transaction));
  }
}
