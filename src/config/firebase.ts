import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your_api_key_here",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your_app_id",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "your_measurement_id",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Auth (for future authentication features)
export const auth = getAuth(app);

export default app;
