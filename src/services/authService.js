import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../config/firebase.js';
import { getCloudStatus, startCloudSync, stopCloudSync } from './cloudDataService.js';
import { dbService } from './dbService.js';

export const ROLES = {
  PRESIDENT: 'President',
  MASTER_ADVISOR: 'Club Advisor',
  VP_EDUCATION: 'VP Education',
  VP_MEMBERSHIP: 'VP Membership',
  VP_PR: 'VP Public Relations',
  SECRETARY: 'Secretary',
  SERGEANT: 'Sergeant-at-Arms',
  EC_OFFICER: 'EC Officer',
  MEMBER: 'Member'
};

const LOCAL_MODE_KEY = 'pssgavel_local_mode';
const AUTH_USER_KEY = 'pssgavel_auth_user';

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

export function matchesPhone(inputPhone = '', targetPhone = '') {
  const cleanInput = normalizePhone(inputPhone);
  const cleanTarget = normalizePhone(targetPhone);
  if (!cleanInput || !cleanTarget) return false;
  if (cleanInput === cleanTarget) return true;
  // Match last 10 digits for phone numbers with country codes or prefixes
  if (cleanInput.length >= 10 && cleanTarget.length >= 10) {
    return cleanInput.slice(-10) === cleanTarget.slice(-10);
  }
  return false;
}

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

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  async initialize() {
    // Restore saved dual-credential session if available
    const savedUserJson = localStorage.getItem(AUTH_USER_KEY);
    if (savedUserJson) {
      try {
        this.currentUser = JSON.parse(savedUserJson);
      } catch {
        this.currentUser = null;
      }
    }

    if (!firebaseConfigured || !auth || !db) {
      if (!this.currentUser && localStorage.getItem(LOCAL_MODE_KEY) === 'true') {
        this.currentUser = {
          name: 'Local device session',
          email: '',
          phone: '',
          role: ROLES.PRESIDENT,
          tier: 1,
          branch: 'Miyapur',
          offline: true
        };
      }
      return !!this.currentUser;
    }

    if (this.currentUser) {
      return true;
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
          if (!this.currentUser) {
            this.currentUser = null;
            stopCloudSync();
            finish(false);
          } else {
            finish(true);
          }
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
      phone: profile.phone || '',
      role: profile.role,
      tier: profile.role === ROLES.PRESIDENT || profile.role === ROLES.MASTER_ADVISOR ? 1 : (profile.role === ROLES.MEMBER ? 3 : 2),
      branch: profile.branch || 'Miyapur'
    };
    this.saveSession();
    this.lastAuthError = '';
    return this.currentUser;
  }

  /**
   * Check if Email and Mobile number match any registered account
   * Used to conditionally reveal the password input only when matched
   */
  checkCredentialsMatch(email, phone) {
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);
    if (!cleanEmail || !cleanPhone || cleanPhone.length < 10) {
      return null;
    }

    const ec = dbService.getECCommittee();

    // President
    const isPresidentEmail = normalizeEmail(ec.presidentEmail) === cleanEmail || cleanEmail === 'president@pssgavelclub.org';
    if (isPresidentEmail && matchesPhone(cleanPhone, ec.presidentPhone)) {
      return {
        matched: true,
        name: ec.president || 'Sravani Kallemolam',
        role: ROLES.PRESIDENT,
        tier: 1,
        title: 'Club President (Super Admin)'
      };
    }

    // Master 2 / Club Advisor (TM Ajith)
    const master2Email = ec.master2Email || ec.ajithSirEmail;
    const master2Phone = ec.master2Phone || ec.ajithSirPhone;
    if (normalizeEmail(master2Email) === cleanEmail && matchesPhone(cleanPhone, master2Phone)) {
      return {
        matched: true,
        name: ec.master2Name || ec.ajithSir || 'TM Ajith',
        role: ROLES.MASTER_ADVISOR,
        tier: 1,
        title: ec.master2Role || ec.ajithSirRole || 'Club Advisor & Mentor'
      };
    }

    // EC Officers (Tier 2)
    const ecRoles = [
      { key: 'vpEducation', role: ROLES.VP_EDUCATION, title: 'VP Education' },
      { key: 'vpMembership', role: ROLES.VP_MEMBERSHIP, title: 'VP Membership' },
      { key: 'vpPR', role: ROLES.VP_PR, title: 'VP Public Relations' },
      { key: 'secretary', role: ROLES.SECRETARY, title: 'Secretary' },
      { key: 'sergeant', role: ROLES.SERGEANT, title: 'Sergeant-at-Arms' }
    ];

    for (const item of ecRoles) {
      const offEmail = ec[item.key + 'Email'];
      const offPhone = ec[item.key + 'Phone'];
      if (normalizeEmail(offEmail) === cleanEmail && matchesPhone(cleanPhone, offPhone)) {
        return {
          matched: true,
          name: ec[item.key] || item.title,
          role: item.role,
          tier: 2,
          title: item.title
        };
      }
    }

    // Members (Tier 3)
    const members = dbService.getMembers();
    const matchedMember = members.find(m => {
      const emailMatches = normalizeEmail(m.email) === cleanEmail;
      const phoneMatches = matchesPhone(cleanPhone, m.mobile || m.phone);
      return emailMatches && phoneMatches;
    });

    if (matchedMember) {
      return {
        matched: true,
        name: matchedMember.name || 'Club Member',
        role: ROLES.MEMBER,
        tier: 3,
        title: 'Gavelier Member'
      };
    }

    return null;
  }

  /**
   * Login with Email, Phone, and Password (Default: 123456)
   * Also supports optional Name mention
   * Validates against Tier 1 (Master Block), Tier 2 (EC Team Block), or Tier 3 (Club Members)
   */
  async loginWithCredentials(email, phone, password = '123456', name = '') {
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);
    const cleanPassword = String(password || '123456').trim();
    const enteredName = String(name || '').trim();

    if (!cleanEmail) {
      throw new Error('Please enter your registered email address.');
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Please enter your valid 10-digit registered mobile number.');
    }

    const ec = dbService.getECCommittee();

    // -------------------------------------------------------------------------
    // TIER 1: MASTER BLOCK (2 People - Full Super Admin & Starting Video Calls)
    // -------------------------------------------------------------------------
    // 1. President (Master 1) - Sravani Kallemolam
    const isPresidentEmail = normalizeEmail(ec.presidentEmail) === cleanEmail || cleanEmail === 'president@pssgavelclub.org';
    if (isPresidentEmail && matchesPhone(cleanPhone, ec.presidentPhone)) {
      const requiredPass = String(ec.presidentPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.president || 'Sravani Kallemolam',
        email: ec.presidentEmail || cleanEmail,
        phone: ec.presidentPhone || cleanPhone,
        role: ROLES.PRESIDENT,
        tier: 1,
        title: 'Club President (Super Admin)',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // 2. Co-Master / Club Advisor (Master 2) - TM Ajith
    const master2Email = ec.master2Email || ec.ajithSirEmail;
    const master2Phone = ec.master2Phone || ec.ajithSirPhone;
    if (normalizeEmail(master2Email) === cleanEmail && matchesPhone(cleanPhone, master2Phone)) {
      const requiredPass = String(ec.master2Password || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.master2Name || ec.ajithSir || 'TM Ajith',
        email: master2Email,
        phone: master2Phone,
        role: ROLES.MASTER_ADVISOR,
        tier: 1,
        title: ec.master2Role || ec.ajithSirRole || 'Club Advisor & Mentor',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // -------------------------------------------------------------------------
    // TIER 2: EC TEAM BLOCK (5 People - Role Management & Starting Video Calls)
    // -------------------------------------------------------------------------
    // 1. VP Education
    if (normalizeEmail(ec.vpEducationEmail) === cleanEmail && matchesPhone(cleanPhone, ec.vpEducationPhone)) {
      const requiredPass = String(ec.vpEducationPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.vpEducation || 'VP Education',
        email: ec.vpEducationEmail,
        phone: ec.vpEducationPhone,
        role: ROLES.VP_EDUCATION,
        tier: 2,
        title: 'VP Education',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // 2. VP Membership
    if (normalizeEmail(ec.vpMembershipEmail) === cleanEmail && matchesPhone(cleanPhone, ec.vpMembershipPhone)) {
      const requiredPass = String(ec.vpMembershipPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.vpMembership || 'VP Membership',
        email: ec.vpMembershipEmail,
        phone: ec.vpMembershipPhone,
        role: ROLES.VP_MEMBERSHIP,
        tier: 2,
        title: 'VP Membership',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // 3. VP Public Relations (PR)
    if (normalizeEmail(ec.vpPREmail) === cleanEmail && matchesPhone(cleanPhone, ec.vpPRPhone)) {
      const requiredPass = String(ec.vpPRPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.vpPR || 'VP Public Relations',
        email: ec.vpPREmail,
        phone: ec.vpPRPhone,
        role: ROLES.VP_PR,
        tier: 2,
        title: 'VP Public Relations',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // 4. Secretary
    if (normalizeEmail(ec.secretaryEmail) === cleanEmail && matchesPhone(cleanPhone, ec.secretaryPhone)) {
      const requiredPass = String(ec.secretaryPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.secretary || 'Secretary',
        email: ec.secretaryEmail,
        phone: ec.secretaryPhone,
        role: ROLES.SECRETARY,
        tier: 2,
        title: 'Secretary',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // 5. Sergeant-at-Arms
    if (normalizeEmail(ec.sergeantEmail) === cleanEmail && matchesPhone(cleanPhone, ec.sergeantPhone)) {
      const requiredPass = String(ec.sergeantPassword || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || ec.sergeant || 'Sergeant-at-Arms',
        email: ec.sergeantEmail,
        phone: ec.sergeantPhone,
        role: ROLES.SERGEANT,
        tier: 2,
        title: 'Sergeant-at-Arms',
        branch: 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    // -------------------------------------------------------------------------
    // TIER 3: LOWER BLOCK (Club Members - Read Access, Cannot Start Calls)
    // -------------------------------------------------------------------------
    const members = dbService.getMembers();
    const matchedMember = members.find(m => {
      const emailMatches = normalizeEmail(m.email) === cleanEmail;
      const phoneMatches = matchesPhone(cleanPhone, m.mobile || m.phone);
      return emailMatches && phoneMatches;
    });

    if (matchedMember) {
      const requiredPass = String(matchedMember.password || '123456').trim();
      if (cleanPassword !== requiredPass) {
        throw new Error('Incorrect password. (Default is 123456)');
      }
      this.currentUser = {
        name: enteredName || matchedMember.name || 'Club Member',
        email: matchedMember.email || cleanEmail,
        phone: matchedMember.mobile || cleanPhone,
        memberId: matchedMember.id,
        role: ROLES.MEMBER,
        tier: 3,
        title: 'Gavelier Member',
        branch: matchedMember.branch || 'Miyapur'
      };
      this.saveSession();
      return this.currentUser;
    }

    throw new Error('No club record matched this Email and Phone number. Please check your credentials or contact the President.');
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
    const ec = dbService.getECCommittee();
    this.currentUser = {
      name: ec.president || 'Sravani Kallemolam',
      email: ec.presidentEmail || 'sravanikallemolam568@gmail.com',
      phone: ec.presidentPhone || '9014231403',
      role: ROLES.PRESIDENT,
      tier: 1,
      title: 'Club President (Super Admin)',
      branch: 'Miyapur',
      offline: true
    };
    this.saveSession();
    return this.currentUser;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem(LOCAL_MODE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    stopCloudSync();
    if (auth?.currentUser) await signOut(auth);
  }

  // Permission & Role Checkers
  isMaster() {
    return this.currentUser?.tier === 1 ||
           this.currentUser?.role === ROLES.PRESIDENT ||
           this.currentUser?.role === ROLES.MASTER_ADVISOR;
  }

  isPresident() {
    return this.currentUser?.role === ROLES.PRESIDENT;
  }

  isMasterAdvisor() {
    return this.currentUser?.role === ROLES.MASTER_ADVISOR;
  }

  isTier2() {
    return this.currentUser?.tier === 2 || [
      ROLES.VP_EDUCATION,
      ROLES.VP_MEMBERSHIP,
      ROLES.VP_PR,
      ROLES.SECRETARY,
      ROLES.SERGEANT,
      ROLES.EC_OFFICER
    ].includes(this.currentUser?.role);
  }

  isECOfficer() {
    return this.isMaster() || this.isTier2();
  }

  isVPMembership() {
    return this.currentUser?.role === ROLES.VP_MEMBERSHIP;
  }

  isVPPR() {
    return this.currentUser?.role === ROLES.VP_PR;
  }

  isVPEducation() {
    return this.currentUser?.role === ROLES.VP_EDUCATION;
  }

  isReadOnly() {
    return this.currentUser?.role === ROLES.MEMBER || this.currentUser?.tier === 3;
  }

  // Video Call Permissions:
  // ONLY Master Block (2 people) and EC Team Block (5 people) can start / configure calls.
  // Lower Block (Members) CANNOT start calls.
  canStartVideoCall() {
    return this.isMaster() || this.isTier2();
  }

  // Only President can edit the Master and EC Team Roster
  canManageEC() {
    return this.isPresident();
  }

  canManageMembers() {
    return this.isPresident() || this.isMaster() || this.isVPMembership() || this.isTier2();
  }

  canManageMeetings() {
    return this.isPresident() || this.isMaster() || this.isVPEducation() || this.isTier2();
  }

  canManageMedia() {
    return this.isPresident() || this.isMaster() || this.isVPPR() || this.isTier2();
  }

  canEditAdmin() {
    return this.isPresident() || this.isMaster();
  }
}

export const authService = new AuthService();
