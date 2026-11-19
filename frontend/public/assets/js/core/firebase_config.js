// Credora Firebase Client Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCfOT1zQgtJ5YLkesK-0E_ixbB_FsezSAY",
  authDomain: "credora-a98f0.firebaseapp.com",
  projectId: "credora-a98f0",
  storageBucket: "credora-a98f0.firebasestorage.app",
  messagingSenderId: "782827682864",
  appId: "1:782827682864:web:1395d118c4c0aae561c1f5",
  measurementId: "G-YVVNP438H3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
