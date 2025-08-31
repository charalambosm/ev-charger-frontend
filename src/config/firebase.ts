// src/config/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAF2HT5fcAQfp67dq7mGiaDyfS9lT462MY",
    authDomain: "ev-charger-map-cyprus-3eff9.firebaseapp.com",
    projectId: "ev-charger-map-cyprus-3eff9",
    storageBucket: "ev-charger-map-cyprus-3eff9.firebasestorage.app",
    messagingSenderId: "684712827178",
    appId: "1:684712827178:web:d6635968cf5dd4a265e653",
    measurementId: "G-Z3NYYWNH4C"
  };

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);