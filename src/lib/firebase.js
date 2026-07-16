import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection } from 'firebase/firestore';
import { FIREBASE_CONFIG, TEAM_ID } from './constants.js';

const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);

export const teamRef    = () => doc(db, 'teams', TEAM_ID);
export const playersCol = () => collection(db, 'teams', TEAM_ID, 'players');
export const playsCol   = () => collection(db, 'teams', TEAM_ID, 'plays');
export const matchesCol = () => collection(db, 'teams', TEAM_ID, 'matches');
