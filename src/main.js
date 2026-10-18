// Application Initializer & Client-Side Router with Auth Guard

import './styles/main.css';
import './styles/components.css';
import './styles/mobile.css';

import { authService } from './services/authService.js';
import { startCloudSync } from './services/cloudDataService.js';
import { renderSplashScreen } from './components/SplashScreen.js';
import { renderHeader } from './components/Header.js';
import { renderNavigation } from './components/Navigation.js';

import { renderDashboardView } from './views/DashboardView.js';
import { renderMembersView } from './views/MembersView.js';
import { renderSpeechesView } from './views/SpeechesView.js';
import { renderMeetingsView } from './views/MeetingsView.js';
import { renderMediaHubView } from './views/MediaHubView.js';
import { renderAgendaConfigView } from './views/AgendaConfigView.js';
import { renderRolesView } from './views/RolesView.js';
import { renderAttendanceView } from './views/AttendanceView.js';
import { renderMentorsView } from './views/MentorsView.js';
import { renderSettingsView } from './views/SettingsView.js';
import { renderLoginView } from './views/LoginView.js';
import { renderClubConnectView } from './views/ClubConnectView.js';
import { renderECElectionsView } from './views/ECElectionsView.js';
import { initAIAssistant } from './components/AIAssistant.js';
import { showToast } from './components/Modal.js';

class AppController {
  constructor() {
    this.activeBranch = 'All';
    this.activeView = 'dashboard';
    this.appContainer = document.getElementById('app');
    window.addEventListener('club:cloud-error', (event) => {
      showToast(event.detail || 'Could not save records to Firestore.', 'error');
    });
  }

  init() {
    // Show splash screen first
    renderSplashScreen(async () => {
      try {
        this.bindHashRouter();
        await authService.initialize();
        const currentUser = authService.getCurrentUser();
        if (authService.isConfigured() && authService.isLoggedIn() && currentUser && !currentUser.offline) {
          try {
            const synced = await startCloudSync(currentUser.role);
            if (!synced) {
              console.warn('Could not sync with Firestore on start. Running with local records.');
            }
          } catch (syncErr) {
            console.warn('Cloud sync error on startup:', syncErr);
          }
        }
      } catch (err) {
        console.error('App initialization error:', err);
      } finally {
        this.renderApp();
      }
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
    // Enforce Authentication Guard: Must be logged in to access app screens
    const isLoggedIn = authService.isLoggedIn();
    if (!isLoggedIn && this.activeView !== 'login') {
      this.activeView = 'login';
      window.location.hash = '#login';
    }

    // Unified Route Guard: Enforce view access based on the user's role
    if (isLoggedIn && !authService.canAccessView(this.activeView)) {
      showToast(`Your role (${authService.getCurrentUser()?.role || 'Member'}) does not have access to this section.`, 'warning');
      this.activeView = 'dashboard';
      window.location.hash = '#dashboard';
    }

    const isLoginPage = (this.activeView === 'login' && !isLoggedIn);

    const { bottomNavHtml, sideNavHtml } = isLoginPage 
      ? { bottomNavHtml: '', sideNavHtml: '' }
      : renderNavigation(this.activeView);

    const headerHtml = renderHeader(this.activeBranch);

    let viewHtml = '';
    switch (this.activeView) {
      case 'dashboard': viewHtml = renderDashboardView(this.activeBranch); break;
      case 'members': viewHtml = renderMembersView(this.activeBranch); break;
      case 'speeches': viewHtml = renderSpeechesView(this.activeBranch); break;
      case 'meetings': viewHtml = renderMeetingsView(this.activeBranch); break;
      case 'media': viewHtml = renderMediaHubView(this.activeBranch); break;
      case 'agenda': viewHtml = renderAgendaConfigView(this.activeBranch); break;
      case 'roles': viewHtml = renderRolesView(this.activeBranch); break;
      case 'attendance': viewHtml = renderAttendanceView(this.activeBranch); break;
      case 'mentors': viewHtml = renderMentorsView(this.activeBranch); break;
      case 'settings': viewHtml = renderSettingsView(); break;
      case 'connect': viewHtml = renderClubConnectView(this.activeBranch); break;
      case 'elections': viewHtml = renderECElectionsView(); break;
      case 'login': viewHtml = renderLoginView(); break;
      default: viewHtml = renderDashboardView(this.activeBranch); break;
    }

    this.appContainer.innerHTML = `
      ${headerHtml}
      <div class="app-wrapper" style="${isLoginPage ? 'padding-bottom: 0;' : ''}">
        ${sideNavHtml}
        <main class="main-content">
          ${viewHtml}
        </main>
      </div>
      ${bottomNavHtml}
    `;

    // Mount AI assistant floating widget on all authenticated screens
    if (!isLoginPage) {
      initAIAssistant();
    }

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

function startApp() {
  const app = new AppController();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
