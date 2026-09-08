// Firebase Auth Login & Role Selector View

import { authService, ROLES } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderLoginView() {
  const currentUser = authService.getCurrentUser();

  setTimeout(() => {
    bindLoginEvents();
  }, 50);

  return `
    <div class="animate-fade-in" style="display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: 16px;">
      <div class="card" style="width: 100%; max-width: 440px; border-color: rgba(212, 175, 55, 0.4); box-shadow: var(--shadow-lg); background: var(--bg-card);">
        
        <!-- Header Branding -->
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="/gavel-club-logo.svg" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 12px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" />
          <h2 style="font-size: 1.5rem; color: var(--gold-primary);">PSS MIYAPUR GAVEL CLUB</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Youth Leadership Program • Member & Admin Authentication</p>
        </div>

        ${currentUser ? `
          <div style="background: var(--badge-bg); border-radius: 14px; padding: 18px; margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color);">
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">CURRENTLY SIGNED IN AS:</div>
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--gold-bright); margin-top: 4px;">${currentUser.name}</div>
            <div style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 2px;">${currentUser.email || 'president@pssgavelclub.org'}</div>
            <span class="badge badge-gold" style="margin-top: 8px; font-size: 0.8rem;"><i class="fa-solid fa-user-shield"></i> Role: ${currentUser.role}</span>
          </div>

          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px;">Switch Access Role (Role-Based Testing):</div>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px;">
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

          <button id="logout-btn" class="btn btn-danger" style="width: 100%; height: 46px;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        ` : `
          <form id="login-form">
            <div class="form-group">
              <label class="form-label required">Email Address</label>
              <input type="email" id="login-email" class="form-input" value="president@pssgavelclub.org" placeholder="yourname@domain.com" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Password</label>
              <div style="position: relative;">
                <input type="password" id="login-password" class="form-input" value="••••••••" placeholder="Enter password" required style="padding-right: 42px;" />
                <button type="button" id="toggle-password-btn" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);" title="Show/Hide Password">
                  <i class="fa-solid fa-eye" id="eye-icon"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">Select Access Role</label>
              <select id="login-role" class="form-select">
                <option value="${ROLES.PRESIDENT}">President (Full Admin)</option>
                <option value="${ROLES.EC_OFFICER}">EC Officer (Manage Members & Meetings)</option>
                <option value="${ROLES.MEMBER}">Member (View Only)</option>
              </select>
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 14px; height: 46px;">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In to Account
            </button>
          </form>
        `}
      </div>
    </div>
  `;
}

function bindLoginEvents() {
  const togglePassBtn = document.getElementById('toggle-password-btn');
  togglePassBtn?.addEventListener('click', () => {
    const passInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passInput && eyeIcon) {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.className = 'fa-solid fa-eye-slash';
      } else {
        passInput.type = 'password';
        eyeIcon.className = 'fa-solid fa-eye';
      }
    }
  });

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
    }

    setTimeout(() => {
      authService.login(email, pass, role);
      showToast(`Logged in successfully as ${role}!`, 'success');
      window.location.hash = '#dashboard';
      window.location.reload();
    }, 400);
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
