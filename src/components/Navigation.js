// Simplified app navigation for a cleaner mobile-first club experience

import { authService } from '../services/authService.js';

export function renderNavigation(activeView) {
  const isVPM = authService.isVPMembership();
  const isVPPR = authService.isVPPR();

  const highlightNavId = activeView === 'agenda' ? 'meetings' : activeView;

  let desktopNavItems = [
    { id: 'dashboard', label: 'Home', icon: 'fa-house' },
    { id: 'members', label: 'Members', icon: 'fa-users' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-calendar-days' },
    { id: 'media', label: 'Media', icon: 'fa-photo-film' },
    { id: 'more', label: 'More', icon: 'fa-ellipsis' }
  ];

  let mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: 'fa-house' },
    { id: 'members', label: 'Members', icon: 'fa-users' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-calendar-days' },
    { id: 'media', label: 'Media', icon: 'fa-photo-film' },
    { id: 'more', label: 'More', icon: 'fa-ellipsis' }
  ];

  let extraItems = [
    { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
    { id: 'speeches', label: 'Speeches', icon: 'fa-scroll' },
    { id: 'mentors', label: 'Mentors', icon: 'fa-user-graduate' },
    { id: 'roles', label: 'Roles', icon: 'fa-award' },
    { id: 'settings', label: 'EC Committee', icon: 'fa-sliders' },
    { id: 'connect', label: 'Club Connect', icon: 'fa-comments' },
    { id: 'elections', label: 'EC Elections', icon: 'fa-check-to-slot' }
  ];

  if (isVPM) {
    desktopNavItems = desktopNavItems.filter(item => ['dashboard', 'members', 'meetings', 'more'].includes(item.id));
    mobileNavItems = mobileNavItems.filter(item => ['dashboard', 'members', 'meetings', 'more'].includes(item.id));
    extraItems = extraItems.filter(item => ['attendance', 'speeches', 'mentors', 'roles', 'connect', 'elections'].includes(item.id));
  }

  if (isVPPR) {
    desktopNavItems = desktopNavItems.filter(item => ['dashboard', 'media', 'more'].includes(item.id));
    mobileNavItems = mobileNavItems.filter(item => ['dashboard', 'media', 'more'].includes(item.id));
    extraItems = extraItems.filter(item => ['connect', 'elections'].includes(item.id));
  }

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
