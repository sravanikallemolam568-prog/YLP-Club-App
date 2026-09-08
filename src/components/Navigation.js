// Touch-Friendly Navigation Component (Bottom Nav for Phones, Side Nav for Tablet/Desktop)

export function renderNavigation(activeView) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'members', label: 'Members', icon: 'fa-users' },
    { id: 'speeches', label: 'Speeches', icon: 'fa-scroll' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-calendar-days' },
    { id: 'media', label: 'Media Hub', icon: 'fa-photo-film' },
    { id: 'agenda', label: 'Agenda', icon: 'fa-list-check' },
    { id: 'roles', label: 'Roles', icon: 'fa-award' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
    { id: 'mentors', label: 'Mentors', icon: 'fa-user-graduate' },
    { id: 'settings', label: 'EC Committee', icon: 'fa-sliders' }
  ];

  // Mobile Bottom Bar
  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: 'fa-house' },
    { id: 'members', label: 'Members', icon: 'fa-users' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-calendar-days' },
    { id: 'media', label: 'Media', icon: 'fa-photo-film' },
    { id: 'speeches', label: 'Speeches', icon: 'fa-scroll' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
    { id: 'mentors', label: 'Mentors', icon: 'fa-user-graduate' }
  ];

  const bottomNavHtml = `
    <nav class="bottom-nav">
      ${mobileNavItems.map(item => `
        <a href="#${item.id}" class="nav-item ${activeView === item.id ? 'active' : ''}" data-view="${item.id}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;

  const sideNavHtml = `
    <aside class="side-nav">
      <div style="padding: 10px 16px 20px 16px; border-bottom: 1px solid var(--border-color); margin-bottom: 12px;">
        <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.15rem; color: var(--gold-primary);">
          PSS MIYAPUR GAVEL
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">NAVIGATION MENU</div>
      </div>
      ${navItems.map(item => `
        <a href="#${item.id}" class="side-nav-item ${activeView === item.id ? 'active' : ''}" data-view="${item.id}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </aside>
  `;

  return { bottomNavHtml, sideNavHtml };
}
