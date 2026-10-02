// Firebase Configuration & Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Default Firebase credentials config (User can replace with their Firebase Project Config)
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForPSSMiyapurGavelClub2026",
  authDomain: "pss-miyapur-gavel-club.firebaseapp.com",
  projectId: "pss-miyapur-gavel-club",
  storageBucket: "pss-miyapur-gavel-club.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demoapp id"
};

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialized with demo mode:", e);
}

export { app, auth, db };
