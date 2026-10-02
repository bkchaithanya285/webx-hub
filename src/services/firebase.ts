import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyBERTDa5cqox4J6KdoEdhZ3zmAi06MVnXc",
  authDomain: "webx-hub.firebaseapp.com",
  projectId: "webx-hub",
  storageBucket: "webx-hub.firebasestorage.app",
  messagingSenderId: "424496604938",
  appId: "1:424496604938:web:8f72ead0dfd8e3ad5efcf3",
  measurementId: "G-Z5R60VWHXQ"
};

// Initialize Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Initialize Analytics conditionally (only in browser environments where supported)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("[WEBX COMMAND] Firebase Analytics initialized.");
    }
  }).catch(() => {});
}

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  return await signInWithPopup(auth, googleProvider);
}

import { getFunctions, Functions } from 'firebase/functions';

const functionsInstance: Functions = getFunctions(app);

export { app, auth, db, analytics, functionsInstance as functions };
