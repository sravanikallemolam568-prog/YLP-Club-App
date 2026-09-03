// Firebase Auth Login & Role Selector View

import { authService, ROLES } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderLoginView() {
  const currentUser = authService.getCurrentUser();

  setTimeout(() => {
    bindLoginEvents();
  }, 50);

  return `
    <div class="animate-fade-in" style="display: flex; align-items: center; justify-content: center; min-height: 80vh;">
      <div class="card" style="width: 100%; max-width: 440px; border-color: var(--gold-primary); box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="/gavel-club-logo.svg" alt="Logo" style="width: 90px; height: 90px; margin-bottom: 12px;" />
          <h2 style="font-size: 1.5rem; color: var(--gold-primary);">PSS MIYAPUR GAVEL CLUB</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Firebase Authentication & Role Access</p>
        </div>

        ${currentUser ? `
          <div style="background: var(--badge-bg); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">CURRENTLY LOGGED IN AS:</div>
            <div style="font-weight: 800; font-size: 1.1rem; color: var(--gold-primary); margin-top: 4px;">${currentUser.name}</div>
            <span class="badge badge-gold" style="margin-top: 6px;">Role: ${currentUser.role}</span>
          </div>

          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">Switch Role Preview (RBAC Testing):</div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
            <button class="btn btn-outline role-switch-btn" data-role="${ROLES.PRESIDENT}">
              <i class="fa-solid fa-crown" style="color: #F6C90E;"></i> Switch to President (Full Admin)
            </button>
            <button class="btn btn-outline role-switch-btn" data-role="${ROLES.EC_OFFICER}">
              <i class="fa-solid fa-user-shield" style="color: #10B981;"></i> Switch to EC Officer
            </button>
            <button class="btn btn-outline role-switch-btn" data-role="${ROLES.MEMBER}">
              <i class="fa-solid fa-user" style="color: #3B82F6;"></i> Switch to Member (Read-Only)
            </button>
          </div>

          <button id="logout-btn" class="btn btn-danger" style="width: 100%;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        ` : `
          <form id="login-form">
            <div class="form-group">
              <label class="form-label required">Email Address</label>
              <input type="email" id="login-email" class="form-input" value="president@pssgavelclub.org" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Password</label>
              <input type="password" id="login-password" class="form-input" value="••••••••" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Access Role</label>
              <select id="login-role" class="form-select">
                <option value="${ROLES.PRESIDENT}">President (Full Admin)</option>
                <option value="${ROLES.EC_OFFICER}">EC Officer (Manage Members & Meetings)</option>
                <option value="${ROLES.MEMBER}">Member (View Only)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 14px;">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
          </form>
        `}
      </div>
    </div>
  `;
}

function bindLoginEvents() {
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    authService.login(email, pass, role);
    showToast(`Logged in successfully as ${role}!`, 'success');
    window.location.hash = '#dashboard';
    window.location.reload();
  });

  document.querySelectorAll('.role-switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.currentTarget.dataset.role;
      authService.login('', '', role);
      showToast(`Switched role to ${role}`, 'success');
      window.location.hash = '#dashboard';
      window.location.reload();
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    authService.logout();
    showToast('Signed out successfully.', 'info');
    window.location.hash = '#login';
    window.location.reload();
  });
}
