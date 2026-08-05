import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDOH4N4djxnsi6sq0HCUmbzB_Vx8FUErW4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'equitylabs-ai.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'equitylabs-ai',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'equitylabs-ai.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '61158626073',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:61158626073:web:af2776f5ed238f02b62b88',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-G9ENY7ZHRB',
};

const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseClient = firebaseApp;
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firebaseDb: Firestore = getFirestore(firebaseApp);
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);
// Intencionalmente no exponemos helpers de Phone/SMS Auth.
// La autenticación del proyecto queda limitada a email/Google en las capas de UI existentes.

let analyticsInstance: Analytics | null = null;
let analyticsInitPromise: Promise<Analytics | null> | null = null;

export const getFirebaseAnalytics = async () => {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === 'undefined') return null;

  if (!analyticsInitPromise) {
    analyticsInitPromise = isAnalyticsSupported()
      .then((supported) => {
        if (!supported) return null;
        analyticsInstance = getAnalytics(firebaseApp);
        return analyticsInstance;
      })
      .catch(() => null);
  }

  return analyticsInitPromise;
};

export const getFirebaseConfig = () => firebaseConfig;
