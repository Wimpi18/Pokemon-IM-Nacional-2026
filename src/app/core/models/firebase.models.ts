import { Timestamp } from '@angular/fire/firestore';

export interface User {
  uid: string;
  realName: string;
  nickname: string;
  phoneNumber: string;
  course: string;
  selectedPokemon: string;
  createdAt: Timestamp;
}

export interface Cursante extends User {
  role: 'cursante';
  patrolId: string;
}

export interface Dirigente extends User {
  role: 'dirigente';
}

export interface Patrol {
  id: string;
  name: string;
  course: string;
}

export interface PointTransaction {
  id: string;
  patrolId: string;
  targetType: 'cursante' | 'patrulla';
  targetId: string;
  points: number;
  justification: string;
  authorId: string;
  authorName: string;
  timestamp: Timestamp;
  searchTerms: string[];
}
