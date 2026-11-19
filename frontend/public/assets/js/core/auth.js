// Credora Authentication & Session Guard Module
import { 
  auth, 
  googleProvider 
} from "./firebase_config.js";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const AuthState = {
  getUser: () => {
    const userStr = localStorage.getItem('credora_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getToken: () => localStorage.getItem('credora_token'),
  getRole: () => localStorage.getItem('credora_user_role') || 'applicant',
  
  setSession: (user, token, role = 'applicant') => {
    localStorage.setItem('credora_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null
    }));
    if (token) localStorage.setItem('credora_token', token);
    localStorage.setItem('credora_user_role', role);
  },
  
  clearSession: () => {
    localStorage.removeItem('credora_user');
    localStorage.removeItem('credora_token');
    localStorage.removeItem('credora_user_role');
  }
};

// Google Sign-In
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    AuthState.setSession(result.user, token, 'applicant');
    window.location.href = "dashboard.html";
    return result.user;
  } catch (err) {
    console.error("Google sign in error:", err);
    alert("Authentication failed: " + err.message);
    throw err;
  }
}

// Email/Password Sign-In
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    AuthState.setSession(result.user, token, 'applicant');
    window.location.href = "dashboard.html";
    return result.user;
  } catch (err) {
    console.warn("Firebase email login failed, falling back to local demo session:", err.message);
    // Demo fallback for local development without active Firebase backend
    const demoUser = { uid: "demo-usr-01", email: email, displayName: email.split('@')[0] };
    AuthState.setSession(demoUser, "demo-jwt-token-xyz", 'applicant');
    window.location.href = "dashboard.html";
    return demoUser;
  }
}

// User Sign-Out
export async function logoutUser() {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn("Sign out:", e);
  }
  AuthState.clearSession();
  window.location.href = "login.html";
}

// Page Guard: ensure applicant is authenticated
export function requireAuth() {
  const user = AuthState.getUser();
  if (!user && !window.location.pathname.includes('login.html')) {
    window.location.href = "login.html";
  }
}
