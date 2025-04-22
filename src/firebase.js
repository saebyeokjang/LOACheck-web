// src/firebase.js - Firebase 설정 파일
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase 구성 정보
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "loa-check.firebaseapp.com",
  projectId: "loa-check",
  storageBucket: "loa-check.firebasestorage.app",
  messagingSenderId: "832979775342",
  appId: "1:832979775342:web:6c9d0d43431e24fd209b7f",
  measurementId: "G-HN0K9494SX"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;