import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// These values are replaced with actual Firebase Project settings provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBsZKiLx1nClQGwmWpbdMaR5hVCz9ZvyBs",
  authDomain: "hostelconnect-608b0.firebaseapp.com",
  projectId: "hostelconnect-608b0",
  storageBucket: "hostelconnect-608b0.firebasestorage.app",
  messagingSenderId: "467012019057",
  appId: "1:467012019057:web:b7d3c468b1056244ed0cd0",
  measurementId: "G-ZKB0S0NTX9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
