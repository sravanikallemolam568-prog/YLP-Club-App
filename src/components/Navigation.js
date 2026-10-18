// Simplified app navigation for a cleaner mobile-first club experience

import { authService } from '../services/authService.js';

export function renderNavigation(activeView) {
  const highlightNavId = activeView === 'agenda' ? 'meetings' : activeView;
  const role = authService.getCurrentUser()?.role;

  let primaryIds = [];
  let extraIds = [];

  if (authService.isPresident() || authService.isMasterAdvisor()) {
    primaryIds = ['dashboard', 'members', 'meetings', 'media'];
    extraIds = ['attendance', 'speeches', 'mentors', 'roles', 'settings', 'connect', 'elections'];
  } else if (authService.isVPEducation()) {
    primaryIds = ['dashboard', 'speeches', 'meetings', 'attendance'];
    extraIds = ['agenda', 'roles', 'mentors', 'connect', 'elections'];
  } else if (authService.isVPMembership()) {
    primaryIds = ['dashboard', 'members', 'attendance'];
    extraIds = ['connect', 'elections'];
  } else if (authService.isVPPR()) {
    primaryIds = ['dashboard', 'meetings', 'media'];
    extraIds = ['connect', 'elections'];
  } else if (authService.isSecretary()) {
    primaryIds = ['dashboard', 'attendance', 'meetings'];
    extraIds = ['connect', 'elections'];
  } else if (authService.isSergeant()) {
    primaryIds = ['dashboard', 'meetings'];
    extraIds = ['connect', 'elections'];
  } else {
    // Member (Tier 3)
    primaryIds = ['dashboard', 'members', 'meetings', 'media'];
    extraIds = ['attendance', 'speeches', 'mentors', 'roles', 'connect', 'elections'];
  }

  const navItemLookup = {
    dashboard: { id: 'dashboard', label: 'Home', icon: 'fa-house' },
    members: { id: 'members', label: 'Members', icon: 'fa-users' },
    speeches: { id: 'speeches', label: 'Speeches', icon: 'fa-microphone-lines' },
    meetings: { id: 'meetings', label: 'Meetings', icon: 'fa-calendar-days' },
    attendance: { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
    media: { id: 'media', label: 'Media', icon: 'fa-photo-film' },
    agenda: { id: 'agenda', label: 'Agenda Config', icon: 'fa-list-check' },
    mentors: { id: 'mentors', label: 'Mentors', icon: 'fa-user-graduate' },
    roles: { id: 'roles', label: 'Roles Tracker', icon: 'fa-award' },
    settings: { id: 'settings', label: 'Leadership & EC', icon: 'fa-crown' },
    connect: { id: 'connect', label: 'Club Connect', icon: 'fa-comments' },
    elections: { id: 'elections', label: 'EC Elections', icon: 'fa-check-to-slot' },
    more: { id: 'more', label: 'More', icon: 'fa-ellipsis' }
  };

  const desktopNavItems = primaryIds.map(id => navItemLookup[id]).filter(Boolean);
  const mobileNavItems = [...desktopNavItems];

  if (extraIds.length > 0) {
    desktopNavItems.push(navItemLookup.more);
    mobileNavItems.push(navItemLookup.more);
  }

  const extraItems = extraIds.map(id => navItemLookup[id]).filter(Boolean);
  const isMoreActive = extraItems.some(item => item.id === activeView);

  const bottomNavHtml = `
    <nav class="bottom-nav">
      ${mobileNavItems.map(item => item.id === 'more' ? `
        <details class="more-nav-menu mobile-more-menu">
          <summary class="nav-item ${isMoreActive ? 'active' : ''}" aria-label="More options">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.label}</span>
          </summary>
          <div class="more-nav-options">
            ${extraItems.map(option => `
              <a href="#${option.id}" class="side-nav-item ${highlightNavId === option.id ? 'active' : ''}" data-view="${option.id}">
                <i class="fa-solid ${option.icon}"></i>
                <span>${option.label}</span>
              </a>
            `).join('')}
          </div>
        </details>
      ` : `
        <a href="#${item.id}" class="nav-item ${highlightNavId === item.id ? 'active' : ''}" data-view="${item.id}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;

  const sideNavHtml = `
    <aside class="side-nav">
      <div class="simple-side-header">
        <div class="simple-side-logo"><img src="/gavel-club-logo.svg" alt="Gavel logo" /></div>
        <div>
          <div class="simple-side-title">PSS MIYAPUR</div>
          <div class="simple-side-sub">GAVEL CLUB</div>
        </div>
      </div>

      <div class="simple-side-group">
        ${desktopNavItems.map(item => item.id === 'more' ? `
          <details class="more-nav-menu desktop-more-menu">
            <summary class="side-nav-item ${isMoreActive ? 'active' : ''}" aria-label="More options">
              <i class="fa-solid ${item.icon}"></i>
              <span>${item.label}</span>
            </summary>
            <div class="more-nav-options">
              ${extraItems.map(option => `
                <a href="#${option.id}" class="side-nav-item ${highlightNavId === option.id ? 'active' : ''}" data-view="${option.id}">
                  <i class="fa-solid ${option.icon}"></i>
                  <span>${option.label}</span>
                </a>
              `).join('')}
            </div>
          </details>
        ` : `
          <a href="#${item.id}" class="side-nav-item ${highlightNavId === item.id ? 'active' : ''}" data-view="${item.id}">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </div>
    </aside>
  `;

  return { bottomNavHtml, sideNavHtml };
}
