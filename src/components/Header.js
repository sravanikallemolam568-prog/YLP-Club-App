// Top Bar Header Component with cleaner branding and app-focused identity

import { authService } from '../services/authService.js';

export function renderHeader(activeBranch) {
  const user = authService.getCurrentUser();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return `
    <header class="top-header">
      <div class="brand-pill">
        <img src="/gavel-club-logo.svg" alt="PSS Miyapur Gavel Club logo" class="brand-logo" />
        <div>
          <div class="brand-title">PSS MIYAPUR GAVEL</div>
          <div class="brand-subtitle">GAVEL CLUB MANAGEMENT</div>
        </div>
      </div>

      <div class="header-actions">
        <select id="global-branch-selector" class="form-select" style="padding: 6px 10px; font-size: 0.82rem; height: 38px; border-radius: 8px; font-weight: 600; width: 130px;">
          <option value="All" ${activeBranch === 'All' ? 'selected' : ''}>All Branches</option>
          <option value="Miyapur" ${activeBranch === 'Miyapur' ? 'selected' : ''}>Miyapur</option>
          <option value="GHMC" ${activeBranch === 'GHMC' ? 'selected' : ''}>GHMC</option>
          <option value="MKR" ${activeBranch === 'MKR' ? 'selected' : ''}>MKR</option>
        </select>

        <button id="theme-toggle-btn" class="btn btn-outline btn-icon" style="width: 38px; height: 38px;" title="Toggle Light/Dark Theme">
          <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" style="color: ${isDark ? '#FBBC04' : '#5F6368'}"></i>
        </button>

        <div class="badge badge-info" style="padding: 6px 10px; cursor: pointer;" id="user-profile-pill" title="Current User Role">
          <i class="fa-solid fa-user-shield"></i> ${user ? user.role : 'President'}
        </div>
      </div>
    </header>
  `;
}
