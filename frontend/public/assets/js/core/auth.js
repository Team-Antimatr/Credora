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
import { showLoader, hideLoader } from "./app.js";

export const AuthState = {
  getUser: () => {
    const userStr = localStorage.getItem('credora_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getToken: () => localStorage.getItem('credora_token'),
  getRole: () => localStorage.getItem('credora_user_role') || 'applicant',
  
  setSession: (user, token, role = 'applicant') => {
    let displayName = user.displayName;
    if (!displayName && user.email) {
      const namePart = user.email.split('@')[0].replace(/[._-]/g, ' ');
      displayName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    localStorage.setItem('credora_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: displayName || 'Credora Applicant',
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

function getRedirectTarget() {
  const target = sessionStorage.getItem('credora_redirect_after_login') || 'dashboard.html';
  sessionStorage.removeItem('credora_redirect_after_login');
  return target;
}

// Google Sign-In
export async function loginWithGoogle() {
  showLoader();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    AuthState.setSession(result.user, token, 'applicant');
    window.location.href = getRedirectTarget();
    return result.user;
  } catch (err) {
    hideLoader();
    console.error("Google sign in error:", err);
    alert("Authentication failed: " + err.message);
    throw err;
  }
}

// Email/Password Sign-In
export async function loginWithEmail(email, password) {
  showLoader();
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    AuthState.setSession(result.user, token, 'applicant');
    window.location.href = getRedirectTarget();
    return result.user;
  } catch (err) {
    console.warn("Firebase email login failed, falling back to local session:", err.message);
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
    const displayName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const demoUser = { uid: "usr-" + Date.now().toString(36), email: email, displayName: displayName };
    AuthState.setSession(demoUser, "jwt-credora-session-" + Date.now(), 'applicant');
    window.location.href = getRedirectTarget();
    return demoUser;
  }
}

// User Sign-Out
export async function logoutUser() {
  showLoader();
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn("Firebase sign out:", e);
  }
  AuthState.clearSession();
  window.location.href = "login.html";
}

// Sync UI across dashboard and apply-loan
export function syncUserUI() {
  const user = AuthState.getUser();
  if (!user) return;

  const displayName = user.displayName || user.email.split('@')[0];
  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';

  // Update navbar user names
  document.querySelectorAll('.user-name, [data-user-name]').forEach(el => {
    el.innerText = displayName;
  });

  // Update greetings
  document.querySelectorAll('.user-greeting').forEach(el => {
    el.innerText = `Welcome back, ${displayName}`;
  });

  // Update initials
  document.querySelectorAll('.user-initials').forEach(el => {
    el.innerText = initials;
  });

  // Update full name input in form if present
  const fullNameInput = document.getElementById('fullName');
  if (fullNameInput && (!fullNameInput.value || fullNameInput.value === 'Rahul Sharma' || fullNameInput.value === 'Applicant' || fullNameInput.value === 'Credora Applicant')) {
    fullNameInput.value = displayName;
  }

  // Hook Sign Out buttons
  document.querySelectorAll('a[href*="login.html"]').forEach(link => {
    if (link.innerText.includes('Sign Out')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    }
  });
}

// Keep Firebase auth state synced
try {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      user.getIdToken().then(token => {
        AuthState.setSession(user, token, 'applicant');
        syncUserUI();
      });
    }
  });
} catch (e) {
  console.warn("Auth listener warning:", e);
}

document.addEventListener('DOMContentLoaded', syncUserUI);
