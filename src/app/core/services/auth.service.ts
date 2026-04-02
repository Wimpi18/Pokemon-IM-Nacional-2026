import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  public currentUser = signal<User | null>(null);
  public isAuthReady = signal<boolean>(false);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isAuthReady.set(true);
    });
  }

  /** Iniciar sesión con Correo del Dirigente */
  loginEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password).catch(
      (error) => {
        console.error('Error logging in:', error);
        throw error;
      },
    );
  }

  logout(): Promise<void> {
    return signOut(this.auth).catch((error) => {
      console.error('Logout error:', error);
    });
  }
}
