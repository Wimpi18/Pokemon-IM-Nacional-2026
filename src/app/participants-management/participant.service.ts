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

  async getCoursePatrols(course: string): Promise<Patrol[]> {
    const q = query(
      collection(this.firestore, 'patrols'),
      where('course', '==', course),
    );
    const sn = await getDocs(q);

    return sn.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data } as Patrol;
    });
  }

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

  async registerCursante(
    email: string,
    password: string,
    cursanteData: Omit<Cursante, 'uid' | 'role' | 'createdAt'>,
  ): Promise<void> {
    let secondaryApp;
    try {
      secondaryApp = initializeApp(
        environment.firebaseConfig,
        `ParticipantRegistrationApp_${Date.now()}`,
      );
      const secondaryAuth = getAuth(secondaryApp);

      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      const uid = credential.user.uid;

      const newCursante: Cursante = {
        ...cursanteData,
        uid,
        role: 'cursante',
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(this.firestore, 'users', uid), newCursante);

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
