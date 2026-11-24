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

const MAX_PLATFORM_USERS = 100;
const REGISTERED_USERS_KEY = 'credora_registered_users_registry';

export function getRegisteredUsersCount() {
  try {
    const list = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
    return list.length;
  } catch (e) {
    return 1;
  }
}

export function checkRegistrationCapacity(email) {
  try {
    let list = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
    const normalizedEmail = email ? email.toLowerCase() : null;
    if (normalizedEmail && list.includes(normalizedEmail)) {
      return true; // Already registered user
    }
    if (list.length >= MAX_PLATFORM_USERS) {
      alert("Platform registration capacity reached (100 user deployment limit). New applicant access is temporarily paused.");
      return false;
    }
    if (normalizedEmail) {
      list.push(normalizedEmail);
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
    }
    return true;
  } catch (e) {
    return true;
  }
}

export const AuthState = {
  getUser: () => {
    const userStr = localStorage.getItem('credora_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getToken: () => localStorage.getItem('credora_token'),
  getRole: () => localStorage.getItem('credora_user_role') || 'applicant',
  
  setSession: (user, token, role = 'applicant') => {
    if (!checkRegistrationCapacity(user.email)) {
      return false;
    }

    // Detect user account switch and clear lingering tab session state
    const prevUser = AuthState.getUser();
    if (prevUser && prevUser.email && prevUser.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      sessionStorage.clear();
    }

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
    return true;
  },
  
  clearSession: () => {
    localStorage.removeItem('credora_user');
    localStorage.removeItem('credora_token');
    localStorage.removeItem('credora_user_role');
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear session storage:", e);
    }
  }
};

export function getRedirectTarget() {
  let target = sessionStorage.getItem('credora_redirect_after_login');
  sessionStorage.removeItem('credora_redirect_after_login');
  if (!target) return 'dashboard.html';
  if (target.includes('pages/app/')) {
    target = target.substring(target.indexOf('pages/app/') + 'pages/app/'.length);
  } else if (target.includes('../app/')) {
    target = target.substring(target.indexOf('../app/') + '../app/'.length);
  }
  if (!target || target === '/' || target.includes('index.html') || target.includes('login.html')) {
    return 'dashboard.html';
  }
  return target;
}

// Google Sign-In
export async function loginWithGoogle() {
  showLoader();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const sessionOk = AuthState.setSession(result.user, token, 'applicant');
    if (!sessionOk) {
      hideLoader();
      return null;
    }
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
    const sessionOk = AuthState.setSession(result.user, token, 'applicant');
    if (!sessionOk) {
      hideLoader();
      return null;
    }
    window.location.href = getRedirectTarget();
    return result.user;
  } catch (err) {
    console.warn("Firebase email login failed, falling back to local session:", err.message);
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
    const displayName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const demoUser = { uid: "usr-" + Date.now().toString(36), email: email, displayName: displayName };
    const sessionOk = AuthState.setSession(demoUser, "jwt-credora-session-" + Date.now(), 'applicant');
    if (!sessionOk) {
      hideLoader();
      return null;
    }
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

  // Gate "Apply Now" buttons across all pages for unauthenticated visitors
  document.querySelectorAll('a[href*="apply-loan.html"], a[href*="loan-flow.html"]').forEach(el => {
    // Avoid re-attaching
    if (el.dataset.authGated) return;
    el.dataset.authGated = "true";
    el.addEventListener('click', (e) => {
      const currentUser = AuthState.getUser();
      if (!currentUser) {
        e.preventDefault();
        let targetHref = el.getAttribute('href') || 'apply-loan.html';
        if (targetHref.includes('pages/app/')) {
          targetHref = targetHref.substring(targetHref.indexOf('pages/app/') + 'pages/app/'.length);
        } else if (targetHref.includes('../app/')) {
          targetHref = targetHref.substring(targetHref.indexOf('../app/') + '../app/'.length);
        }
        sessionStorage.setItem('credora_redirect_after_login', targetHref);
        const isInPages = window.location.pathname.includes('/pages/');
        const loginPath = isInPages 
          ? (window.location.pathname.includes('/pages/app/') ? 'login.html' : '../app/login.html') 
          : 'pages/app/login.html';
        window.location.href = loginPath;
      }
    });
  });

  if (!user) return;

  const displayName = user.displayName || user.email.split('@')[0];
  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';

  // Update navbar user names
  document.querySelectorAll('.user-name, [data-user-name]').forEach(el => {
    el.innerText = displayName;
  });

  // Update greetings
  document.querySelectorAll('.user-greeting').forEach(el => {
    el.innerText = `Welcome, ${displayName}`;
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

// Admin & Role-Guard Enforcer
export function enforceAdminGuard(redirectPath = '../errors/403.html') {
  const role = AuthState.getRole();
  if (role !== 'officer' && role !== 'admin') {
    const currentFile = window.location.pathname.split('/').pop() || 'admin.html';
    sessionStorage.setItem('credora_admin_redirect', currentFile);
    window.location.replace(redirectPath);
    return false;
  }
  return true;
}

// Automatically enforce guards based on portal route
export function checkRouteGuards() {
  const currentPath = window.location.pathname.toLowerCase();
  if (currentPath.includes('/pages/admin/') && !currentPath.includes('admin-login.html')) {
    enforceAdminGuard('../errors/403.html');
  }
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

document.addEventListener('DOMContentLoaded', () => {
  checkRouteGuards();
  syncUserUI();
});
