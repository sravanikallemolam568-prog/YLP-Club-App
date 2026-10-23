// Modern, Dynamic Gavel Club Dashboard with Automated Branch Metrics & Management

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast, openModal, closeModal } from '../components/Modal.js';

function getDueReminders(reminders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reminders.filter(reminder => !reminder.done && new Date(reminder.dueDate) <= today);
}

function showReminderAlertPopup(reminders) {
  const dueReminders = getDueReminders(reminders);
  if (!dueReminders.length) return;

  const alertBox = document.getElementById('reminder-alert-popup');
  const reminder = dueReminders[0];
  const message = `${reminder.title} • ${reminder.type}`;

  if (alertBox) {
    alertBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <div style="width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background: rgba(16,185,129,0.12); color:#0f766e; font-size:14px;">
          <i class="fa-solid fa-bell"></i>
        </div>
        <div>
          <div style="font-size: 0.68rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#5b6470;">Reminder</div>
          <div style="font-size: 0.92rem; font-weight:800; color:#111827;">${escapeHtml(reminder.title)}</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color:#4b5563; line-height:1.45;">${escapeHtml(reminder.message)}</div>
      <div style="margin-top: 10px; font-size: 0.72rem; color:#0f766e; font-weight:700;">Due: ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    `;
    alertBox.style.display = 'block';
    alertBox.dataset.active = 'true';
    alertBox.setAttribute('title', message);
    return;
  }

  const popup = document.createElement('div');
  popup.id = 'reminder-alert-popup';
  popup.style.position = 'fixed';
  popup.style.right = '20px';
  popup.style.bottom = '88px';
  popup.style.width = 'min(320px, calc(100vw - 28px))';
  popup.style.padding = '14px 16px';
  popup.style.borderRadius = '16px';
  popup.style.background = 'linear-gradient(135deg, #ecfdf5, #ffffff)';
  popup.style.border = '1px solid rgba(16,185,129,0.22)';
  popup.style.boxShadow = '0 18px 42px rgba(15, 23, 42, 0.18)';
  popup.style.zIndex = '1000';
  popup.style.display = 'block';
  popup.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <div style="width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background: rgba(16,185,129,0.12); color:#0f766e; font-size:14px;">
        <i class="fa-solid fa-bell"></i>
      </div>
      <div>
        <div style="font-size: 0.68rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#5b6470;">Reminder</div>
        <div style="font-size: 0.92rem; font-weight:800; color:#111827;">${escapeHtml(reminder.title)}</div>
      </div>
    </div>
    <div style="font-size: 0.8rem; color:#4b5563; line-height:1.45;">${escapeHtml(reminder.message)}</div>
    <div style="margin-top: 10px; font-size: 0.72rem; color:#0f766e; font-weight:700;">Due: ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  `;
  document.body.appendChild(popup);
}

function triggerBrowserReminder(reminders) {
  if (!('Notification' in window)) return;

  const dueReminders = getDueReminders(reminders);
  if (!dueReminders.length) return;

  if (Notification.permission === 'granted') {
    dueReminders.slice(0, 3).forEach(reminder => {
      new Notification(reminder.title, {
        body: reminder.message,
        tag: reminder.id
      });
    });
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export function renderDashboardView(branchFilter = 'All') {
  const user = authService.getCurrentUser();
  const allMembers = dbService.getMembers();
  const allMeetings = dbService.getMeetings();
  const allAttendance = dbService.getAttendance();
  const allBranches = dbService.getBranches();

  // Filtered views based on selected branch
  let displayMembers = allMembers;
  let displayMeetings = allMeetings;
  let displayAttendance = allAttendance;

  if (branchFilter !== 'All') {
    displayMembers = allMembers.filter(m => (m.branch || '').toLowerCase() === branchFilter.toLowerCase());
    displayMeetings = allMeetings.filter(m => (m.branch || '').toLowerCase() === branchFilter.toLowerCase());
    displayAttendance = allAttendance.filter(a => (a.branch || '').toLowerCase() === branchFilter.toLowerCase());
  }

  // Branch member counts from database
  const totalMembersCount = allMembers.length;
  const miyapurCount = allMembers.filter(m => (m.branch || '').toLowerCase() === 'miyapur').length;
  const mkrCount = allMembers.filter(m => (m.branch || '').toLowerCase() === 'mkr').length;
  
  // Custom branch counts (excluding Miyapur and MKR)
  const customBranches = allBranches.filter(b => {
    const clean = b.trim().toLowerCase();
    return clean !== 'miyapur' && clean !== 'mkr';
  });

  const scheduledMeetingsCount = allMeetings.filter(m => m.status === 'Upcoming').length;

  const reminders = dbService.getReminders()
    .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate));

  const dueReminders = getDueReminders(reminders);
  if (dueReminders.length) {
    triggerBrowserReminder(reminders);
    setTimeout(() => showReminderAlertPopup(reminders), 200);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const todaysMeeting = displayMeetings.find(m => m.date === todayLabel) || displayMeetings.find(m => m.status === 'Upcoming') || displayMeetings[0];
  
  const presentCount = displayAttendance.filter(a => a.status === 'Present').length;
  const absentCount = displayAttendance.filter(a => a.status !== 'Present').length;
  
  const speechList = dbService.getSpeechList();
  const totalSpeechProjects = displayMembers.length * speechList.length;
  const completedSpeechProjects = displayMembers.reduce((total, member) =>
    total + Math.min(Math.max(Number(member.speechesCompleted) || 0, 0), speechList.length), 0);
  const speechProgressPercent = totalSpeechProjects
    ? Math.round((completedSpeechProjects / totalSpeechProjects) * 100)
    : 0;

  // Permission: Add Branch appears ONLY for President / Super Admin (Tier 1)
  const canAddBranch = authService.isMaster();

  setTimeout(() => bindDashboardEvents(), 40);

  return `
    <div class="animate-fade-in" style="max-width: 1040px; margin: 0 auto; padding-bottom: 30px;">
      
      <!-- Top Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--teal-deep, #0F766E); font-weight: 800; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-crown" style="color: #EAB308;"></i>
            <span>PSS MIYAPUR GAVEL CLUB</span>
          </div>
          <h2 style="font-size: 1.85rem; font-weight: 800; line-height: 1.2; margin: 4px 0 0; color: var(--text-primary);">
            Gavel Club Dashboard
          </h2>
          <p style="margin: 2px 0 0; font-size: 0.86rem; color: var(--text-secondary);">
            ${greeting}, <strong>${escapeHtml(user?.name || 'Club Leader')}</strong> · Active Branch: <span class="badge badge-info" style="font-weight: 700;">${escapeHtml(branchFilter)}</span>
          </p>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="#connect" class="btn btn-primary" style="display: flex; align-items: center; gap: 7px; font-weight: 700; padding: 8px 16px; border-radius: 12px;">
            <i class="fa-solid fa-comments"></i> Club Connect
          </a>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- 1. METRICS CARDS: AUTOMATIC COUNTS FROM DATABASE -->
      <!-- ================================================================= -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 22px;">
        
        <!-- Total Members -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: absolute; right: 14px; top: 14px; width: 36px; height: 36px; border-radius: 10px; background: rgba(13, 148, 136, 0.12); color: var(--teal-deep, #0F766E); display: grid; place-items: center; font-size: 1rem;">
            <i class="fa-solid fa-users"></i>
          </div>
          <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">
            Total Members
          </div>
          <div style="font-size: 2.3rem; font-weight: 800; color: var(--teal-deep, #0F766E); margin: 6px 0 2px; line-height: 1;">
            ${totalMembersCount}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            All branches
          </div>
        </article>

        <!-- Miyapur Members -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: absolute; right: 14px; top: 14px; width: 36px; height: 36px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); color: #1D4ED8; display: grid; place-items: center; font-size: 1rem;">
            <i class="fa-solid fa-location-dot"></i>
          </div>
          <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">
            Miyapur
          </div>
          <div style="font-size: 2.3rem; font-weight: 800; color: #1D4ED8; margin: 6px 0 2px; line-height: 1;">
            ${miyapurCount}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            Members
          </div>
        </article>

        <!-- MKR Branch Members -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: absolute; right: 14px; top: 14px; width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); color: #047857; display: grid; place-items: center; font-size: 1rem;">
            <i class="fa-solid fa-building-user"></i>
          </div>
          <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">
            MKR Branch
          </div>
          <div style="font-size: 2.3rem; font-weight: 800; color: #047857; margin: 6px 0 2px; line-height: 1;">
            ${mkrCount}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            Members
          </div>
        </article>

        <!-- Scheduled Sessions / Upcoming Meetings -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: absolute; right: 14px; top: 14px; width: 36px; height: 36px; border-radius: 10px; background: rgba(234, 179, 8, 0.14); color: #B45309; display: grid; place-items: center; font-size: 1rem;">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
          <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">
            Upcoming Meetings
          </div>
          <div style="font-size: 2.3rem; font-weight: 800; color: #B45309; margin: 6px 0 2px; line-height: 1;">
            ${scheduledMeetingsCount}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            Scheduled sessions
          </div>
        </article>

        <!-- Custom Branches (if added by President) -->
        ${customBranches.map(branchName => {
          const count = allMembers.filter(m => (m.branch || '').toLowerCase() === branchName.toLowerCase()).length;
          return `
            <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
              <div style="position: absolute; right: 14px; top: 14px; width: 36px; height: 36px; border-radius: 10px; background: rgba(139, 92, 246, 0.12); color: #6D28D9; display: grid; place-items: center; font-size: 1rem;">
                <i class="fa-solid fa-sitemap"></i>
              </div>
              <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">
                ${escapeHtml(branchName)}
              </div>
              <div style="font-size: 2.3rem; font-weight: 800; color: #6D28D9; margin: 6px 0 2px; line-height: 1;">
                ${count}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">
                Members
              </div>
            </article>
          `;
        }).join('')}

      </div>

      <!-- ================================================================= -->
      <!-- 2. BRANCHES BAR: DYNAMIC LIST & PRESIDENT-ONLY ADD BRANCH -->
      <!-- ================================================================= -->
      <div class="card" style="margin-bottom: 24px; padding: 14px 18px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-sitemap" style="color: var(--teal-primary, #0D9488);"></i> Branches:
          </span>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="dash-branch-pill ${branchFilter === 'All' ? 'active' : ''}" data-branch="All" style="padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; border: 1px solid ${branchFilter === 'All' ? 'var(--teal-primary, #0D9488)' : 'var(--border-color)'}; background: ${branchFilter === 'All' ? 'var(--teal-primary, #0D9488)' : 'var(--bg-main)'}; color: ${branchFilter === 'All' ? '#FFFFFF' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.15s;">
              All (${totalMembersCount})
            </button>
            ${allBranches.map(b => {
              const bCount = allMembers.filter(m => (m.branch || '').toLowerCase() === b.toLowerCase()).length;
              const isSelected = branchFilter.toLowerCase() === b.toLowerCase();
              return `
                <button type="button" class="dash-branch-pill ${isSelected ? 'active' : ''}" data-branch="${escapeHtml(b)}" style="padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; border: 1px solid ${isSelected ? 'var(--teal-primary, #0D9488)' : 'var(--border-color)'}; background: ${isSelected ? 'var(--teal-primary, #0D9488)' : 'var(--bg-main)'}; color: ${isSelected ? '#FFFFFF' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.15s;">
                  ${escapeHtml(b)} (${bCount})
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Add Branch button strictly for President / Super Admin -->
        ${canAddBranch ? `
          <button type="button" id="dash-add-branch-btn" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; border-radius: 10px; border-color: var(--teal-primary, #0D9488); color: var(--teal-deep, #0F766E); padding: 6px 14px;">
            <i class="fa-solid fa-plus"></i> Add Branch
          </button>
        ` : ''}
      </div>

      <!-- ================================================================= -->
      <!-- 3. SPEECH PROGRESS & MEETING SUMMARY -->
      <!-- ================================================================= -->
      ${authService.canAccessView('speeches') ? `
      <div class="home-speech-overview" style="margin-bottom: 22px;">
        <div class="home-speech-overview-copy">
          <div class="home-speech-overview-title"><i class="fa-solid fa-microphone-lines"></i> Speech Completion Progress</div>
          <div class="home-speech-overview-count">${completedSpeechProjects} of ${totalSpeechProjects} projects completed (${speechProgressPercent}%)</div>
          <div class="home-speech-overview-track" role="progressbar" aria-label="Club speech project completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${speechProgressPercent}">
            <span style="width: ${speechProgressPercent}%"></span>
          </div>
        </div>
        <a class="btn btn-outline btn-sm" href="#speeches"><i class="fa-solid fa-arrow-right"></i> View Speeches</a>
      </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <!-- Meeting Summary -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">Next Meeting</span>
              <span class="badge ${todaysMeeting?.status === 'Upcoming' ? 'badge-success' : 'badge-info'}" style="font-size: 0.72rem;">${todaysMeeting ? todaysMeeting.status : 'None'}</span>
            </div>
            <h4 style="margin: 0 0 6px; font-size: 1.1rem; color: var(--text-primary);">
              ${todaysMeeting ? `${escapeHtml(todaysMeeting.date)} · ${escapeHtml(todaysMeeting.startTime)}` : 'No upcoming session'}
            </h4>
            <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary);">
              <i class="fa-solid fa-location-dot" style="color: #EF4444; margin-right: 4px;"></i> Branch: <strong>${todaysMeeting ? escapeHtml(todaysMeeting.branch) : branchFilter}</strong>
            </p>
          </div>
          <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="#connect" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-video"></i> In-App Call
            </a>
            <a href="#agenda" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-list-check"></i> Agenda
            </a>
          </div>
        </article>

        <!-- Attendance Summary -->
        <article class="card" style="margin: 0; padding: 18px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 800;">Attendance Rate</span>
              <span style="font-size: 0.78rem; font-weight: 800; color: var(--teal-deep, #0F766E);">${displayAttendance.length ? Math.round((presentCount / displayAttendance.length) * 100) : 0}%</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 16px; margin: 8px 0 10px;">
              <div>
                <span style="font-size: 1.8rem; font-weight: 800; color: var(--teal-deep, #0F766E);">${presentCount}</span>
                <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; margin-left: 4px;">Present</span>
              </div>
              <div>
                <span style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary);">${absentCount}</span>
                <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; margin-left: 4px;">Absent</span>
              </div>
            </div>
            <div style="height: 8px; background: var(--badge-bg); border-radius: 999px; overflow: hidden;">
              <div style="height: 100%; width: ${displayAttendance.length ? Math.max(10, Math.round((presentCount / displayAttendance.length) * 100)) : 0}%; background: linear-gradient(90deg, var(--teal-primary, #0D9488), var(--teal-deep, #0F766E)); border-radius: inherit;"></div>
            </div>
          </div>
          <div style="margin-top: 14px;">
            <a href="#attendance" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-clipboard-user"></i> Full Attendance
            </a>
          </div>
        </article>

      </div>

      <!-- ================================================================= -->
      <!-- 4. REMINDERS PANEL: KEEPING ALL WORKING REMINDERS FEATURES -->
      <!-- ================================================================= -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 20px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); font-weight: 800;">Club Task Management</div>
            <h3 style="margin: 4px 0 0; font-size: 1.25rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-bell" style="color: var(--teal-primary, #0D9488);"></i> Upcoming Reminders
            </h3>
          </div>
          <span style="display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border-radius: 999px; background: rgba(13, 148, 136, 0.12); color: var(--teal-deep, #0F766E); font-size: 0.74rem; font-weight: 800;">
            ${reminders.filter(item => !item.done).length} active
          </span>
        </div>

        <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 18px;">
          
          <!-- Add Reminder Form -->
          <form id="reminder-form" style="display: grid; gap: 12px; padding: 16px; border: 1px solid var(--border-color); background: var(--bg-main); border-radius: 16px;">
            <label style="display: grid; gap: 4px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Title</span>
              <input id="reminder-title" class="form-input" type="text" maxlength="80" placeholder="e.g. Confirm Meeting Roles" required />
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <label style="display: grid; gap: 4px;">
                <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Type</span>
                <select id="reminder-type" class="form-select">
                  <option value="Meeting">Meeting</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Event">Event</option>
                  <option value="General">General</option>
                </select>
              </label>
              <label style="display: grid; gap: 4px;">
                <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Due Date</span>
                <input id="reminder-date" class="form-input" type="date" required />
              </label>
            </div>
            <label style="display: grid; gap: 4px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Message</span>
              <textarea id="reminder-message" class="form-input" rows="3" maxlength="200" placeholder="Details or action needed..." required></textarea>
            </label>
            <button type="submit" class="btn btn-primary" style="justify-self: start; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-plus"></i> Add Reminder
            </button>
          </form>

          <!-- Reminders List -->
          <div style="display: grid; gap: 10px; max-height: 400px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;">Active Alerts</span>
              <button id="enable-reminder-alerts" type="button" class="btn btn-outline btn-sm" style="font-size: 0.74rem;">Enable Desktop Alerts</button>
            </div>
            ${reminders.length ? reminders.map(reminder => `
              <article style="padding: 12px 14px; border: 1px solid ${reminder.done ? 'rgba(16,185,129,0.25)' : 'var(--border-color)'}; border-radius: 14px; background: ${reminder.done ? 'rgba(16,185,129,0.04)' : 'var(--bg-main)'};">
                <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;">
                  <div>
                    <div style="font-size: 0.66rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">${escapeHtml(reminder.type)}</div>
                    <h4 style="margin: 3px 0 2px; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(reminder.title)}</h4>
                  </div>
                  <span style="padding: 3px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; color: ${reminder.done ? '#047857' : 'var(--teal-deep, #0F766E)'}; background: ${reminder.done ? 'rgba(16,185,129,0.12)' : 'rgba(13, 148, 136, 0.12)'};">
                    ${reminder.done ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p style="margin: 4px 0 8px; color: var(--text-secondary); font-size: 0.78rem; line-height: 1.45;">${escapeHtml(reminder.message)}</p>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                  <span style="font-size: 0.7rem; color: var(--text-muted);"><i class="fa-solid fa-calendar-day"></i> ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-outline btn-sm reminder-toggle-btn" data-reminder-id="${escapeHtml(reminder.id)}" style="font-size: 0.72rem; padding: 3px 8px;">${reminder.done ? 'Undo' : 'Mark Done'}</button>
                    <button type="button" class="btn btn-outline btn-sm reminder-delete-btn" data-reminder-id="${escapeHtml(reminder.id)}" style="font-size: 0.72rem; padding: 3px 8px; color: #EF4444;">Delete</button>
                  </div>
                </div>
              </article>
            `).join('') : '<div style="padding: 24px; border: 1px dashed var(--border-color); border-radius: 14px; color: var(--text-secondary); text-align: center; font-size: 0.84rem;">No reminders yet. Add one to track club actions.</div>'}
          </div>

        </div>
      </div>

    </div>
  `;
}

function bindDashboardEvents() {
  bindReminderEvents();

  // Branch filter pills in Dashboard
  document.querySelectorAll('.dash-branch-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const branch = pill.dataset.branch;
      const globalSelector = document.getElementById('global-branch-selector');
      if (globalSelector && branch) {
        globalSelector.value = branch;
        globalSelector.dispatchEvent(new Event('change'));
      }
    });
  });

  // Add Branch Button (President / Super Admin)
  document.getElementById('dash-add-branch-btn')?.addEventListener('click', () => {
    openModal({
      title: 'Add New Club Branch',
      content: `
        <form id="dash-create-branch-form" style="display: grid; gap: 14px;">
          <label style="display: grid; gap: 6px;">
            <span style="font-weight: 700; font-size: 0.82rem; color: var(--text-secondary);">Branch / Location Name</span>
            <input type="text" id="dash-new-branch-input" class="form-input" placeholder="e.g. Kondapur or Hitec City" maxlength="40" required />
          </label>
          <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
            This creates an official branch category across the club roster, attendance, and meetings.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="dash-cancel-branch-btn" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create Branch</button>
          </div>
        </form>
      `
    });

    document.getElementById('dash-cancel-branch-btn')?.addEventListener('click', closeModal);

    document.getElementById('dash-create-branch-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('dash-new-branch-input');
      const branchName = input?.value.trim();

      if (!branchName) {
        showToast('Please enter a valid branch name.', 'error');
        return;
      }

      const added = dbService.addBranch(branchName);
      if (added) {
        showToast(`Branch "${branchName}" added successfully!`, 'success');
        closeModal();
        // Update global selector and re-render
        const globalSelector = document.getElementById('global-branch-selector');
        if (globalSelector) {
          globalSelector.value = branchName;
          globalSelector.dispatchEvent(new Event('change'));
        }
      } else {
        showToast(`Branch "${branchName}" already exists.`, 'warning');
      }
    });
  });
}

function bindReminderEvents() {
  const form = document.getElementById('reminder-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('reminder-title')?.value.trim();
    const message = document.getElementById('reminder-message')?.value.trim();
    const dueDate = document.getElementById('reminder-date')?.value;
    const type = document.getElementById('reminder-type')?.value || 'General';

    if (!title || !message || !dueDate) {
      showToast('Please fill in the reminder title, date, and message.', 'error');
      return;
    }

    dbService.addReminder({ title, message, dueDate, type });
    showToast('Reminder added successfully.', 'success');
    window.location.reload();
  });

  const alertToggle = document.getElementById('enable-reminder-alerts');
  alertToggle?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported on this device.', 'error');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('Desktop alerts are already enabled.', 'success');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast('Desktop alerts enabled.', 'success');
      const dueReminders = getDueReminders(dbService.getReminders());
      if (dueReminders.length) {
        triggerBrowserReminder(dbService.getReminders());
      }
    } else {
      showToast('Desktop alerts were not enabled.', 'error');
    }
  });

  document.querySelectorAll('.reminder-toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
      const reminderId = button.dataset.reminderId;
      if (!reminderId) return;
      dbService.toggleReminder(reminderId);
      showToast('Reminder updated.', 'success');
      window.location.reload();
    });
  });

  document.querySelectorAll('.reminder-delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const reminderId = button.dataset.reminderId;
      if (!reminderId) return;
      dbService.deleteReminder(reminderId);
      showToast('Reminder removed.', 'success');
      window.location.reload();
    });
  });
}
