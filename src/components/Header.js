// Top Bar Header Component with Theme Switcher, Branch Selector, and User Role Pill

import { authService } from '../services/authService.js';

export function renderHeader(activeBranch, onBranchChange, onThemeToggle) {
  const user = authService.getCurrentUser();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return `
    <header class="top-header">
      <div class="brand-pill">
        <img src="/gavel-club-logo.svg" alt="Logo" class="brand-logo" />
        <div>
          <div class="brand-title">PSS MIYAPUR GAVEL</div>
          <div class="brand-subtitle">Android App • ${user ? user.role : 'Guest'}</div>
        </div>
      </div>

      <div class="header-actions">
        <!-- Branch Selector -->
        <select id="global-branch-selector" class="form-select" style="padding: 6px 10px; font-size: 0.82rem; height: 38px; border-radius: 8px; font-weight: 600; width: 130px;">
          <option value="All" ${activeBranch === 'All' ? 'selected' : ''}>All Branches</option>
          <option value="Miyapur" ${activeBranch === 'Miyapur' ? 'selected' : ''}>Miyapur</option>
          <option value="GHMC" ${activeBranch === 'GHMC' ? 'selected' : ''}>GHMC</option>
          <option value="MKR" ${activeBranch === 'MKR' ? 'selected' : ''}>MKR</option>
        </select>

        <!-- Light / Dark Theme Toggle -->
        <button id="theme-toggle-btn" class="btn btn-outline btn-icon" style="width: 38px; height: 38px;" title="Toggle Light/Dark Theme">
          <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" style="color: ${isDark ? '#F6C90E' : '#0B192C'}"></i>
        </button>

        <!-- User Role Profile Pill -->
        <div class="badge badge-gold" style="padding: 6px 10px; cursor: pointer;" id="user-profile-pill" title="Current User Role">
          <i class="fa-solid fa-user-shield"></i> ${user ? user.role : 'Sign In'}
        </div>
      </div>
    </header>
  `;
}
