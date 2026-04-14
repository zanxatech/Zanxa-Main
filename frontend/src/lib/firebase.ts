import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Robust check: Only initialize if API key and Project ID are not placeholders
const isFirebaseAvailable = 
  !!firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('your-api-key') &&
  !!firebaseConfig.projectId && 
  !firebaseConfig.projectId.includes('your-project-id');

let app = null;
if (isFirebaseAvailable) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// In Next.js, we might not have a valid app during SSR or if config is missing
const auth = app ? getAuth(app) : null;

if (!isFirebaseAvailable) {
  console.warn("⚠️ Firebase is NOT initialized. Valid credentials missing in .env.");
}

export { app, auth, isFirebaseAvailable };
