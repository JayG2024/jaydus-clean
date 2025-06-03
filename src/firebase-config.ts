import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Optional
};

// Validate that all required Firebase config values are present
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(
    `Firebase configuration is missing the following keys: ${missingKeys.join(', ')}. ` +
    'Please ensure all VITE_FIREBASE_* environment variables are set correctly.'
  );
  // Potentially throw an error or return a mock/dummy object if critical for app startup
} else {
  // Initialize Firebase
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  // Initialize Analytics if supported and measurementId is present
  if (firebaseConfig.measurementId) {
    isSupported().then((supported) => {
      if (supported && firebaseApp) {
        analytics = getAnalytics(firebaseApp);
        console.log('Firebase Analytics initialized.');
      } else {
        console.log('Firebase Analytics is not supported in this environment or Firebase app is not initialized.');
      }
    });
  } else {
    console.log('Firebase Measurement ID not provided; Analytics not initialized.');
  }

  console.log('Firebase initialized successfully.');
}

export { firebaseApp, auth, db, storage, analytics };
