import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updatePassword,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import {
  Cursante,
  Dirigente,
  User as FirestoreUser,
} from '../models/firebase.models';

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

      if (user) {
        await this.syncProfile(user.uid);
      } else {
        this.userProfile.set(null);
      }

      this.isAuthReady.set(true);
    });
  }

  /** Sync firestore profile to signal */
  private async syncProfile(uid: string) {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.userProfile.set(docSnap.data() as UserProfile);
      } else {
        this.userProfile.set(null);
      }
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  }

  async loginEmail(
    email: string,
    password: string,
  ): Promise<{ credential: UserCredential; profile: UserProfile }> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      const user = credential.user;

      const docRef = doc(this.firestore, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        this.userProfile.set(profile);
        return { credential, profile };
      } else {
        await this.logout();
        throw new Error('not-found');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /** Update Firestore user data */
  async updateProfile(
    uid: string,
    data: Partial<FirestoreUser>,
  ): Promise<void> {
    const docRef = doc(this.firestore, 'users', uid);
    await updateDoc(docRef, data);
    // Refresh local signal
    await this.syncProfile(uid);
  }

  /** Update Auth password */
  async updateAuthPassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
    } else {
      throw new Error('no-auth-user');
    }
  }

  /** Cerrar sesión completamente */
  logout(): Promise<void> {
    return signOut(this.auth)
      .then(() => {
        this.userProfile.set(null);
        this.currentUser.set(null);
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  }
}
