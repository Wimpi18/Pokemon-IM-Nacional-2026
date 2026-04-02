import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Cursante, Patrol } from '../core/models/firebase.models';

@Injectable({
  providedIn: 'root',
})
export class ParticipantService {
  private readonly firestore = inject(Firestore);

  /**
   * Obtiene las patrullas filtradas por el curso del Dirigente actual.
   * Evita traer distracciones o patrullas de otros campamentos.
   */
  async getCoursePatrols(course: string): Promise<Patrol[]> {
    const q = query(
      collection(this.firestore, 'patrols'),
      where('course', '==', course),
    );
    const sn = await getDocs(q);

    // Si la patrulla ya trae el id internamente, usamos ese, si no usamos d.id
    return sn.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data } as Patrol;
    });
  }

  /**
   * Obtiene los cursantes registrados bajo el mismo curso.
   */
  async getCourseCursantes(course: string): Promise<Cursante[]> {
    const q = query(
      collection(this.firestore, 'users'),
      where('role', '==', 'cursante'),
      where('course', '==', course),
    );
    const sn = await getDocs(q);

    return sn.docs.map((d) => {
      return d.data() as Cursante;
    });
  }

  /**
   * Registra un nuevo cursante usando una "Secondary App".
   * Esto impide que el método createUserWithEmailAndPassword destruya
   * la sesión activa del Dirigente que lo está registrando.
   */
  async registerCursante(
    email: string,
    password: string,
    cursanteData: Omit<Cursante, 'uid' | 'role' | 'createdAt'>,
  ): Promise<void> {
    let secondaryApp;
    try {
      // 1. Iniciamos una aplicación secundaria descartable
      secondaryApp = initializeApp(
        environment.firebaseConfig,
        `ParticipantRegistrationApp_${Date.now()}`,
      );
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Creamos la cuenta en Authentication a nombre de esa sub-aplicación
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      const uid = credential.user.uid;

      // 3. Guardamos el Perfil Oficial en Firestore (usando nuestra app principal)
      const newCursante: Cursante = {
        ...cursanteData,
        uid,
        role: 'cursante',
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(this.firestore, 'users', uid), newCursante);

      // 4. Cerramos la sesión en la sub-aplicación para no dejar basura
      await secondaryAuth.signOut();
    } catch (error) {
      console.error('Error registering participant:', error);
      throw error;
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch((e) =>
          console.error('Error cleaning up secondary app', e),
        );
      }
    }
  }
}
