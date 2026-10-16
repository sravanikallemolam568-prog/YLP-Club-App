// Clean login experience with club branding and simple mobile-friendly form

import { authService } from '../services/authService.js';
import { dbService } from '../services/dbService.js';
import { showToast } from '../components/Modal.js';

export function renderLoginView() {
  const currentUser = authService.getCurrentUser();
  const firebaseConfigured = authService.isConfigured();

  setTimeout(() => {
    bindLoginEvents();
  }, 50);

  return `
    <div class="login-page animate-fade-in">
      <section class="login-panel">
        <div class="card login-card" style="max-width: 460px; border-radius: 28px; padding: 28px 22px;">
          <div style="display: flex; justify-content: center; margin-bottom: 18px;">
            <img src="/gavel-club-logo.svg" alt="PSS Miyapur Gavel Club logo" style="width: 72px; height: 72px; object-fit: contain; border-radius: 18px;" />
          </div>

          <div style="text-align: center; margin-bottom: 22px;">
            <div style="font-size: 0.76rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 8px;">PSS Miyapur Gavel</div>
            <h2 style="font-size: 2rem; margin: 0;">PSS MIYAPUR GAVEL</h2>
            <div style="margin-top: 8px; font-size: 0.92rem; color: var(--text-secondary); font-weight: 600;">GAVEL CLUB MANAGEMENT</div>
          </div>

          ${currentUser ? `
            <div style="background: var(--badge-bg); border-radius: 16px; padding: 18px; margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color);">
              <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Currently signed in</div>
              <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary); margin-top: 6px;">${currentUser.name}</div>
              <div style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px;">${currentUser.email || 'user@pssgavelclub.org'}</div>
              <span class="badge badge-info" style="margin-top: 10px; font-size: 0.8rem;">${currentUser.role}</span>
            </div>

            <button id="logout-btn" class="btn btn-danger" style="width: 100%; height: 44px; margin-top: 12px;">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
          ` : !firebaseConfigured ? `
            <div role="status" style="padding: 14px; border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-secondary); line-height: 1.5;">
              <strong style="color: var(--text-primary);">Open on this device</strong>
              <div style="margin-top: 6px;">Firebase can be connected later. For now, records stay in this browser and are not shared or backed up.</div>
              <button id="open-device-mode-btn" type="button" class="btn btn-primary" style="width: 100%; margin-top: 14px;">Open app</button>
            </div>
          ` : `
            <form id="login-form">
              <div class="form-group">
                <label class="form-label required">Email / Username</label>
                <input type="email" id="login-email" class="form-input" placeholder="yourname@domain.com" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Password</label>
                <div style="position: relative;">
                  <input type="password" id="login-password" class="form-input" placeholder="Enter password" required style="padding-right: 42px;" />
                  <button type="button" id="toggle-password-btn" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);" title="Show/Hide Password">
                    <i class="fa-solid fa-eye" id="eye-icon"></i>
                  </button>
                </div>
              </div>

              <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px; height: 46px;">
                <i class="fa-solid fa-right-to-bracket"></i> Login
              </button>
            </form>
          `}
        </div>
      </section>
    </div>
  `;
}

function bindLoginEvents() {
  document.getElementById('open-device-mode-btn')?.addEventListener('click', () => {
    dbService.clearLegacyDemoData();
    authService.continueOnThisDevice();
    showToast('Opened in local-only mode. Data stays in this browser.', 'info');
    window.location.hash = '#dashboard';
  });

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

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
    }

    try {
      const loggedInUser = await authService.loginWithPassword(email, pass);
      showToast(`Signed in as ${loggedInUser.role}.`, 'success');
      window.location.hash = '#dashboard';
    } catch (error) {
      const message = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
        ? 'Email or password is incorrect.'
        : error.message || 'Unable to sign in. Check your connection and try again.';
      showToast(message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
      }
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await authService.logout();
    showToast('Signed out successfully.', 'info');
    window.location.hash = '#login';
  });
}
