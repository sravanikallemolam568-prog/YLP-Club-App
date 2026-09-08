// Authentication & Role-Based Access Control (RBAC) Service

const AUTH_USER_KEY = 'pssgavel_auth_user';

export const ROLES = {
  MEMBER: 'Member',
  EC_OFFICER: 'EC Officer',
  PRESIDENT: 'President'
};

class AuthService {
  constructor() {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    this.currentUser = stored ? JSON.parse(stored) : null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  login(email, password, selectedRole = ROLES.PRESIDENT) {
    let name = 'Club Member';
    if (selectedRole === ROLES.PRESIDENT) name = 'Priya Varma (President)';
    else if (selectedRole === ROLES.EC_OFFICER) name = 'Kiran Kumar (VP Ed)';
    else name = 'Rahul Sharma (Member)';

    this.currentUser = {
      name: name,
      email: email || 'user@pssgavelclub.org',
      role: selectedRole,
      branch: 'Miyapur'
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  register(name, email, password, role = ROLES.MEMBER, branch = 'Miyapur') {
    this.currentUser = {
      name,
      email,
      role,
      branch
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_USER_KEY);
  }

  // Permission Checks
  isPresident() {
    return this.currentUser?.role === ROLES.PRESIDENT;
  }

  isECOfficer() {
    return this.currentUser?.role === ROLES.EC_OFFICER || this.currentUser?.role === ROLES.PRESIDENT;
  }

  canEditAdmin() {
    return this.isECOfficer();
  }
}

export const authService = new AuthService();
