// Application Initializer & Client-Side Router

import './styles/main.css';
import './styles/components.css';
import './styles/mobile.css';

import { renderSplashScreen } from './components/SplashScreen.js';
import { renderHeader } from './components/Header.js';
import { renderNavigation } from './components/Navigation.js';

import { renderDashboardView } from './views/DashboardView.js';
import { renderMembersView } from './views/MembersView.js';
import { renderSpeechesView } from './views/SpeechesView.js';
import { renderMeetingsView } from './views/MeetingsView.js';
import { renderAgendaConfigView } from './views/AgendaConfigView.js';
import { renderRolesView } from './views/RolesView.js';
import { renderAttendanceView } from './views/AttendanceView.js';
import { renderMentorsView } from './views/MentorsView.js';
import { renderSettingsView } from './views/SettingsView.js';
import { renderLoginView } from './views/LoginView.js';

class AppController {
  constructor() {
    this.activeBranch = 'All';
    this.activeView = 'dashboard';
    this.appContainer = document.getElementById('app');
  }

  init() {
    // Show splash screen first
    renderSplashScreen(() => {
      this.bindHashRouter();
      this.renderApp();
    });
  }

  bindHashRouter() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.activeView = hash;
      this.renderApp();
    });

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.activeView = initialHash;
  }

  renderApp() {
    const { bottomNavHtml, sideNavHtml } = renderNavigation(this.activeView);
    const headerHtml = renderHeader(this.activeBranch);

    let viewHtml = '';
    switch (this.activeView) {
      case 'dashboard': viewHtml = renderDashboardView(this.activeBranch); break;
      case 'members': viewHtml = renderMembersView(this.activeBranch); break;
      case 'speeches': viewHtml = renderSpeechesView(this.activeBranch); break;
      case 'meetings': viewHtml = renderMeetingsView(this.activeBranch); break;
      case 'agenda': viewHtml = renderAgendaConfigView(this.activeBranch); break;
      case 'roles': viewHtml = renderRolesView(this.activeBranch); break;
      case 'attendance': viewHtml = renderAttendanceView(this.activeBranch); break;
      case 'mentors': viewHtml = renderMentorsView(this.activeBranch); break;
      case 'settings': viewHtml = renderSettingsView(); break;
      case 'login': viewHtml = renderLoginView(); break;
      default: viewHtml = renderDashboardView(this.activeBranch); break;
    }

    this.appContainer.innerHTML = `
      ${headerHtml}
      <div class="app-wrapper">
        ${sideNavHtml}
        <main class="main-content">
          ${viewHtml}
        </main>
      </div>
      ${bottomNavHtml}
    `;

    this.bindHeaderEvents();
  }

  bindHeaderEvents() {
    const branchSelector = document.getElementById('global-branch-selector');
    branchSelector?.addEventListener('change', (e) => {
      this.activeBranch = e.target.value;
      this.renderApp();
    });

    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      this.renderApp();
    });

    const profilePill = document.getElementById('user-profile-pill');
    profilePill?.addEventListener('click', () => {
      window.location.hash = '#login';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
