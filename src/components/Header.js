// Top Bar Header Component with cleaner branding and app-focused identity

import { authService } from '../services/authService.js';
import { dbService } from '../services/dbService.js';

export function renderHeader(activeBranch) {
  const user = authService.getCurrentUser();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const branches = dbService.getBranches();

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
        ${user ? `
        ${user.offline ? '<span class="badge badge-warning" title="Changes are saved only in this browser">Local-only</span>' : ''}
        <select id="global-branch-selector" class="form-select" style="padding: 6px 10px; font-size: 0.82rem; height: 38px; border-radius: 8px; font-weight: 600; width: 130px;">
          <option value="All" ${activeBranch === 'All' ? 'selected' : ''}>All Branches</option>
          ${branches.map(b => `<option value="${b}" ${activeBranch === b ? 'selected' : ''}>${b}</option>`).join('')}
        </select>

        <button id="theme-toggle-btn" class="btn btn-outline btn-icon" style="width: 38px; height: 38px;" title="Toggle Light/Dark Theme">
          <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" style="color: ${isDark ? '#FACC15' : '#64748B'}"></i>
        </button>

        <div class="badge ${user.tier === 1 ? 'badge-warning' : user.tier === 2 ? 'badge-info' : 'badge-success'}" style="padding: 6px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 700;" id="user-profile-pill" title="Click to view account session">
          <span>${user.tier === 1 ? '👑' : user.tier === 2 ? '🛡️' : '👤'}</span>
          <span>${user.title || user.role}</span>
        </div>
        ` : ''}
      </div>
    </header>
  `;
}
