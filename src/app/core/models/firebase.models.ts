import { Timestamp } from '@angular/fire/firestore';

export interface User {
  uid?: string; // Normalmente el Document ID se extrae dinámicamente, pero puede ser útil aquí
  role: 'cursante' | 'dirigente' | 'admin';
  realName: string;
  nickname: string;
  phoneNumber: string;
  patrolId: string; // Referencia al ID de la patrulla
  course: string;
  profilePhotoId: string;
  selectedPokemon: string;
  createdAt: Timestamp; // Firestore timestamp
}

export interface Patrol {
  id?: string; // Document ID
  name: string;
  course: string;
  totalScore: number;
  memberCount: number;
}

export interface PointTransaction {
  id?: string;
  patrolId: string;
  targetType: 'cursante' | 'patrulla';
  targetId: string;
  points: number;
  justification: string;
  authorId: string;
  authorName: string;
  timestamp: Timestamp;
  dateString: string; // "YYYY-MM-DD"
  searchTerms: string[];
}
