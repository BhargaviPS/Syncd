// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// ✅ CORRECT Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWLDrUEeoXibGPprQR3N61MA8WWJB5gRM",
  authDomain: "sync-d-540cd.firebaseapp.com",
  projectId: "sync-d-540cd",
  storageBucket: "sync-d-540cd.appspot.com",
  messagingSenderId: "70598425035",
  appId: "1:70598425035:web:c78e9e7794a7401e619e4e",
  measurementId: "G-R5K6HTGPMM"
};

// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export for App.jsx
export {
  auth,
  signInAnonymously,
  onAuthStateChanged,
  db,
  doc,
  setDoc,
  getDoc,
  analytics,
  logEvent
};
