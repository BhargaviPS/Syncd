import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

// 🔥 Your actual Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyCWLDrUEeoXibGPprQR3N61MA8WWJB5gRM",
  authDomain: "sync-d-540cd.firebaseapp.com",
  projectId: "sync-d-540cd",
  storageBucket: "sync-d-540cd.appspot.com",
  messagingSenderId: "70598425035",
  appId: "1:70598425035:web:c78e9e7794a7401e619e4e",
  measurementId: "G-R5K6HTGPMM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  analytics,
  logEvent,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
};
