// Clean, modern Login experience with dynamic password reveal on Email + Mobile match

import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderLoginView() {
  const currentUser = authService.getCurrentUser();

  setTimeout(() => {
    bindLoginEvents();
  }, 50);

  const tierBadgeMap = {
    1: { label: '👑 Tier 1: Master Block', bg: 'rgba(234, 179, 8, 0.15)', color: '#B45309', border: '#FDE047' },
    2: { label: '🛡️ Tier 2: EC Team Block', bg: 'rgba(59, 130, 246, 0.15)', color: '#1D4ED8', border: '#93C5FD' },
    3: { label: '👤 Tier 3: Member Block', bg: 'rgba(16, 185, 129, 0.15)', color: '#047857', border: '#A7F3D0' }
  };

  const currentTier = currentUser ? (currentUser.tier || (currentUser.role === 'President' ? 1 : (currentUser.role === 'Member' ? 3 : 2))) : null;
  const currentBadge = currentTier ? tierBadgeMap[currentTier] : null;

  return `
    <div class="login-page animate-fade-in" style="min-height: calc(100vh - 120px); display: flex; align-items: center; justify-content: center; padding: 20px 14px;">
      <section class="login-panel" style="width: 100%; max-width: 440px;">
        <div class="card login-card" style="border-radius: 26px; padding: 32px 24px; box-shadow: 0 20px 48px rgba(11, 25, 44, 0.12); border: 1px solid var(--border-color);">
          
          <!-- Logo & Brand Header -->
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <div style="width: 76px; height: 76px; border-radius: 22px; background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%); display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 10px 24px rgba(11,25,44,0.25);">
              <img src="/gavel-club-logo.svg" alt="PSS Miyapur Gavel Club logo" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 0.74rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold-primary); font-weight: 800;">TOASTMASTERS INTERNATIONAL AFFILIATE</div>
            <h2 style="font-size: 1.85rem; margin: 4px 0 0; color: var(--text-primary); font-weight: 800;">PSS MIYAPUR GAVEL</h2>
            <div style="margin-top: 4px; font-size: 0.88rem; color: var(--text-secondary); font-weight: 600;">Gavel Club Login</div>
          </div>

          ${currentUser ? `
            <!-- Currently Signed In Card -->
            <div style="background: var(--bg-card); border-radius: 18px; padding: 20px; margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">Active Authenticated Session</div>
              
              <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-primary); margin-top: 8px;">${currentUser.name}</div>
              
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                <i class="fa-solid fa-envelope" style="font-size: 0.78rem; opacity: 0.7;"></i> ${currentUser.email || '—'}
              </div>
              ${currentUser.phone ? `
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                  <i class="fa-solid fa-phone" style="font-size: 0.75rem; opacity: 0.7;"></i> ${currentUser.phone}
                </div>
              ` : ''}

              <div style="margin-top: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${currentBadge ? `
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 0.76rem; font-weight: 800; background: ${currentBadge.bg}; color: ${currentBadge.color}; border: 1px solid ${currentBadge.border};">
                    ${currentBadge.label}
                  </span>
                ` : ''}
                <span class="badge badge-info" style="font-size: 0.76rem;">${currentUser.title || currentUser.role}</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <a href="#dashboard" class="btn btn-primary" style="width: 100%; height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font-weight: 700;">
                <i class="fa-solid fa-house"></i> Go to Dashboard
              </a>
              <button id="logout-btn" class="btn btn-danger" style="width: 100%; height: 44px; font-weight: 700;">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
              </button>
            </div>
          ` : `
            <!-- Login Form -->
            <form id="login-form">
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Full Name <span style="font-weight: 400; color: var(--text-muted); font-size: 0.76rem;">(Optional)</span></label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">
                    <i class="fa-solid fa-user"></i>
                  </span>
                  <input 
                    type="text" 
                    id="login-name" 
                    class="form-input" 
                    placeholder="Enter your name" 
                    style="padding-left: 40px; height: 46px; border-radius: 12px;"
                  />
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label required" style="font-weight: 700; font-size: 0.84rem;">Registered Email</label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">
                    <i class="fa-solid fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    id="login-email" 
                    class="form-input" 
                    placeholder="Enter your registered email" 
                    required 
                    style="padding-left: 40px; height: 46px; border-radius: 12px;"
                  />
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label required" style="font-weight: 700; font-size: 0.84rem;">Registered Mobile Number</label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">
                    <i class="fa-solid fa-phone"></i>
                  </span>
                  <input 
                    type="tel" 
                    id="login-phone" 
                    class="form-input" 
                    placeholder="10-digit mobile number" 
                    required 
                    style="padding-left: 40px; height: 46px; border-radius: 12px;"
                  />
                </div>
              </div>

              <!-- Account Verified Banner (Shown dynamically when Email + Phone match) -->
              <div id="account-matched-banner" style="display: none; background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; font-size: 0.82rem; font-weight: 700;">
                <i class="fa-solid fa-circle-check" style="margin-right: 6px; color: #10B981;"></i>
                <span id="account-matched-text">Account verified</span>
              </div>

              <!-- Password Section (Hidden by default; reveals ONLY when Email + Mobile match) -->
              <div id="password-section" style="display: none; margin-bottom: 22px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label required" style="font-weight: 700; font-size: 0.84rem;">Password</label>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                    <input 
                      type="password" 
                      id="login-password" 
                      class="form-input" 
                      placeholder="Enter password (default: 123456)" 
                      value="123456"
                      style="padding-left: 40px; padding-right: 42px; height: 46px; border-radius: 12px;"
                    />
                    <button type="button" id="toggle-login-pass-btn" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Show/Hide Password">
                      <i class="fa-solid fa-eye" id="login-eye-icon"></i>
                    </button>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Default password is <code>123456</code></div>
                </div>
              </div>

              <!-- Step 1 Button: Continue (Checks if Email & Mobile match) -->
              <button type="button" id="verify-continue-btn" class="btn btn-primary" style="width: 100%; height: 48px; border-radius: 12px; font-weight: 800; font-size: 1rem; box-shadow: 0 4px 14px rgba(66, 133, 244, 0.35);">
                <i class="fa-solid fa-arrow-right"></i> Continue
              </button>

              <!-- Step 2 Button: Login (Revealed after Email & Mobile are matched) -->
              <button type="submit" id="login-submit-btn" class="btn btn-primary" style="display: none; width: 100%; height: 48px; border-radius: 12px; font-weight: 800; font-size: 1rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); background: #10B981; border-color: #10B981;">
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
  const emailInput = document.getElementById('login-email');
  const phoneInput = document.getElementById('login-phone');
  const nameInput = document.getElementById('login-name');
  const passSection = document.getElementById('password-section');
  const passInput = document.getElementById('login-password');
  const continueBtn = document.getElementById('verify-continue-btn');
  const loginBtn = document.getElementById('login-submit-btn');
  const matchedBanner = document.getElementById('account-matched-banner');
  const matchedText = document.getElementById('account-matched-text');

  // Reset password visibility whenever email or phone is changed
  function resetPasswordState() {
    if (passSection && passSection.style.display !== 'none') {
      passSection.style.display = 'none';
      if (matchedBanner) matchedBanner.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'block';
      if (loginBtn) loginBtn.style.display = 'none';
    }
  }

  emailInput?.addEventListener('input', resetPasswordState);
  phoneInput?.addEventListener('input', resetPasswordState);

  // Check if credentials match and reveal password
  function handleCredentialVerification() {
    const email = emailInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';

    if (!email) {
      showToast('Please enter your registered email address.', 'error');
      emailInput?.focus();
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      phoneInput?.focus();
      return;
    }

    const match = authService.checkCredentialsMatch(email, phone);
    if (match) {
      // Credentials matched! Reveal the password section
      if (matchedBanner && matchedText) {
        matchedText.innerHTML = `Account verified: <strong>${match.name}</strong> • ${match.title || match.role}`;
        matchedBanner.style.display = 'block';
      }
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = match.name;
      }
      if (passSection) {
        passSection.style.display = 'block';
      }
      if (continueBtn) {
        continueBtn.style.display = 'none';
      }
      if (loginBtn) {
        loginBtn.style.display = 'block';
      }
      showToast(`Account verified: ${match.name}. Please enter your password.`, 'success');
      passInput?.focus();
    } else {
      showToast('No registered club account matches this Email and Phone number.', 'error');
      resetPasswordState();
    }
  }

  continueBtn?.addEventListener('click', handleCredentialVerification);

  // Password show/hide toggle
  const toggleBtn = document.getElementById('toggle-login-pass-btn');
  toggleBtn?.addEventListener('click', () => {
    const eyeIcon = document.getElementById('login-eye-icon');
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

  // Final Form submit (Login)
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const password = passInput?.value.trim() || '123456';

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Logging in...`;
    }

    try {
      const loggedInUser = await authService.loginWithCredentials(email, phone, password, name);
      showToast(`Welcome ${loggedInUser.name}! Signed in as ${loggedInUser.title || loggedInUser.role}.`, 'success');
      window.location.hash = '#dashboard';
    } catch (error) {
      showToast(error.message || 'Unable to authenticate. Check your password.', 'error');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
      }
    }
  });

  // Sign out
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await authService.logout();
    showToast('Signed out successfully.', 'info');
    window.location.hash = '#login';
  });
}
