import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../config/firebase.js';
import { getCloudStatus, startCloudSync, stopCloudSync } from './cloudDataService.js';

export const ROLES = {
  MEMBER: 'Member',
  EC_OFFICER: 'EC Officer',
  VP_MEMBERSHIP: 'VP Membership',
  VP_PR: 'VP Public Relations',
  PRESIDENT: 'President'
};
const LOCAL_MODE_KEY = 'pssgavel_local_mode';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initializePromise = null;
    this.lastAuthError = '';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isConfigured() {
    return firebaseConfigured;
  }

  getLastAuthError() {
    return this.lastAuthError;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  async initialize() {
    if (!firebaseConfigured || !auth || !db) {
      if (localStorage.getItem(LOCAL_MODE_KEY) === 'true') {
        this.currentUser = {
          name: 'Local device session',
          email: '',
          role: ROLES.PRESIDENT,
          branch: 'Miyapur',
          offline: true
        };
      }
      return !!this.currentUser;
    }
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      onAuthStateChanged(auth, async firebaseUser => {
        if (!firebaseUser) {
          this.currentUser = null;
          stopCloudSync();
          finish(false);
          return;
        }

        try {
          await this.loadProfile(firebaseUser);
          finish(true);
        } catch (error) {
          this.lastAuthError = error.message || 'This account is not configured for the club app.';
          this.currentUser = null;
          await signOut(auth).catch(() => {});
          finish(false);
        }
      });
    });

    return this.initializePromise;
  }

  async loadProfile(firebaseUser) {
    const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!profileSnapshot.exists()) {
      throw new Error('Your account has no club role yet. Ask the President to provision your account.');
    }

    const profile = profileSnapshot.data();
    if (!Object.values(ROLES).includes(profile.role)) {
      throw new Error('Your account has an invalid club role. Ask the President to correct your profile.');
    }

    this.currentUser = {
      uid: firebaseUser.uid,
      name: profile.name || firebaseUser.displayName || firebaseUser.email || 'Club member',
      email: firebaseUser.email || '',
      role: profile.role,
      branch: profile.branch || 'Miyapur'
    };
    this.lastAuthError = '';
    return this.currentUser;
  }

  async loginWithPassword(email, password) {
    if (!firebaseConfigured || !auth || !db) {
      throw new Error('Firebase is not configured. Add the real project settings to .env first.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await this.loadProfile(credential.user);
      const synced = await startCloudSync(this.currentUser.role);
      if (!synced) throw new Error(getCloudStatus().error || 'Could not connect to the club database.');
      return this.currentUser;
    } catch (error) {
      this.currentUser = null;
      await signOut(auth).catch(() => {});
      stopCloudSync();
      throw error;
    }
  }

  continueOnThisDevice() {
    localStorage.setItem(LOCAL_MODE_KEY, 'true');
    this.currentUser = {
      name: 'Local device session',
      email: '',
      role: ROLES.PRESIDENT,
      branch: 'Miyapur',
      offline: true
    };
    return this.currentUser;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem(LOCAL_MODE_KEY);
    stopCloudSync();
    if (auth?.currentUser) await signOut(auth);
  }

  isPresident() {
    return this.currentUser?.role === ROLES.PRESIDENT;
  }

  isVPMembership() {
    return this.currentUser?.role === ROLES.VP_MEMBERSHIP;
  }

  isVPPR() {
    return this.currentUser?.role === ROLES.VP_PR;
  }

  isReadOnly() {
    return this.currentUser?.role === ROLES.MEMBER;
  }

  isECOfficer() {
    return this.currentUser?.role === ROLES.EC_OFFICER || this.isPresident();
  }

  canManageMembers() {
    return this.isPresident() || this.isVPMembership() || this.isECOfficer();
  }

  canManageMeetings() {
    return this.isPresident() || this.isECOfficer();
  }

  canManageMedia() {
    return this.isPresident() || this.isECOfficer() || this.isVPPR();
  }

  canEditAdmin() {
    return this.isECOfficer();
  }
}

export const authService = new AuthService();
