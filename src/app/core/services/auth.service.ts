import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Cursante, Dirigente } from '../models/firebase.models';
type UserProfile = Cursante | Dirigente;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // Authentication session
  public currentUser = signal<User | null>(null);

  // Authorization profile (Firestore)
  public userProfile = signal<UserProfile | null>(null);

  public isAuthReady = signal<boolean>(false);

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);

      // Si hay un usuario conectado en Auth, traemos su Perfil en Firestore para averiguar su ROL
      if (user) {
        try {
          const docRef = doc(this.firestore, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            this.userProfile.set(docSnap.data() as UserProfile);
          } else {
            console.warn(
              `No se encontró perfil en Firestore para el usuario: ${user.uid}`,
            );
            this.userProfile.set(null);
          }
        } catch (error) {
          console.error('Error fetching user role from Firestore', error);
          this.userProfile.set(null);
        }
      } else {
        this.userProfile.set(null);
      }

      this.isAuthReady.set(true);
    });
  }

  /** Iniciar sesión con Correo del Dirigente */
  async loginEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      const user = credential.user;

      // Validar inmediatamente si es Dirigente antes de dejarlo entrar
      const docRef = doc(this.firestore, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        if (profile.role !== 'dirigente') {
          await this.logout();
          throw new Error('access-denied');
        }
      } else {
        await this.logout();
        throw new Error('not-found');
      }

      return credential;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /** Cerrar sesión completamente */
  logout(): Promise<void> {
    return signOut(this.auth).catch((error) => {
      console.error('Logout error:', error);
    });
  }
}
