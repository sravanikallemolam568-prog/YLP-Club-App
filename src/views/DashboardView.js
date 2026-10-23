// Gavel Club Dashboard — Redesigned with Blue (Confidence), Green (Growth), and Yellow (Lead)

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
        <div style="width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background: #FEFCE8; color:#854D0E; font-size:14px; border: 1px solid #FACC15;">
          <i class="fa-solid fa-bell" style="color: #854D0E;"></i>
        </div>
        <div>
          <div style="font-size: 0.68rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#64748B;">Priority Reminder</div>
          <div style="font-size: 0.92rem; font-weight:800; color:#0F172A;">${escapeHtml(reminder.title)}</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color:#64748B; line-height:1.45;">${escapeHtml(reminder.message)}</div>
      <div style="margin-top: 10px; font-size: 0.72rem; color:#854D0E; font-weight:700;">Due: ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
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
  popup.style.background = '#FFFFFF';
  popup.style.border = '1px solid #FACC15';
  popup.style.boxShadow = '0 18px 42px rgba(15, 23, 42, 0.16)';
  popup.style.zIndex = '1000';
  popup.style.display = 'block';
  popup.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <div style="width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background: #FEFCE8; color:#854D0E; font-size:14px; border: 1px solid #FACC15;">
        <i class="fa-solid fa-bell" style="color: #854D0E;"></i>
      </div>
      <div>
        <div style="font-size: 0.68rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#64748B;">Priority Reminder</div>
        <div style="font-size: 0.92rem; font-weight:800; color:#0F172A;">${escapeHtml(reminder.title)}</div>
      </div>
    </div>
    <div style="font-size: 0.8rem; color:#64748B; line-height:1.45;">${escapeHtml(reminder.message)}</div>
    <div style="margin-top: 10px; font-size: 0.72rem; color:#854D0E; font-weight:700;">Due: ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
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
  const nextMeeting = displayMeetings.find(m => m.status === 'Upcoming') || displayMeetings[0];
  
  const presentCount = displayAttendance.filter(a => a.status === 'Present').length;
  const absentCount = displayAttendance.filter(a => a.status !== 'Present').length;
  const attendancePercent = displayAttendance.length ? Math.round((presentCount / displayAttendance.length) * 100) : 0;
  
  const speechList = dbService.getSpeechList();
  const totalSpeechProjects = displayMembers.length * speechList.length;
  const completedSpeechProjects = displayMembers.reduce((total, member) =>
    total + Math.min(Math.max(Number(member.speechesCompleted) || 0, 0), speechList.length), 0);
  const speechProgressPercent = totalSpeechProjects
    ? Math.round((completedSpeechProjects / totalSpeechProjects) * 100)
    : 0;

  // Permission: Add Branch button appears strictly for President / Super Admin (Tier 1)
  const canAddBranch = authService.isMaster();

  setTimeout(() => bindDashboardEvents(), 40);

  return `
    <div class="animate-fade-in gd-container">
      
      <!-- ================================================================= -->
      <!-- 1. DASHBOARD HEADER -->
      <!-- ================================================================= -->
      <header class="gd-header">
        <div>
          <div class="gd-brand-badge">
            <i class="fa-solid fa-crown" style="color: #FACC15;"></i>
            <span>PSS MIYAPUR GAVEL CLUB</span>
          </div>
          <h2 class="gd-title">Gavel Club Dashboard</h2>
          <p class="gd-subtitle">
            ${greeting}, <strong>${escapeHtml(user?.name || 'Club Leader')}</strong> · Active: <span class="badge" style="background: #EFF6FF; color: #1E3A8A; font-weight: 700; border: 1px solid #2563EB;">${escapeHtml(branchFilter)}</span>
          </p>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="#connect" class="btn btn-primary" style="background: #2563EB; border-color: #2563EB; display: inline-flex; align-items: center; gap: 7px; font-weight: 700; padding: 8px 16px; border-radius: 12px;">
            <i class="fa-solid fa-comments"></i> Club Connect
          </a>
        </div>
      </header>

      <!-- ================================================================= -->
      <!-- 2. SIX SUMMARY CARDS (BLUE, GREEN, YELLOW SYSTEM) -->
      <!-- ================================================================= -->
      <div class="gd-cards-grid">
        
        <!-- 1. Total Members (Blue Confidence) -->
        <article class="gd-card gd-accent-blue">
          <div class="gd-card-top">
            <span class="gd-card-label">Total Members</span>
            <div class="gd-card-icon"><i class="fa-solid fa-users"></i></div>
          </div>
          <div class="gd-card-value">${totalMembersCount}</div>
          <div class="gd-card-desc">All branches</div>
        </article>

        <!-- 2. Miyapur Branch Members (Blue Confidence) -->
        <article class="gd-card gd-accent-blue">
          <div class="gd-card-top">
            <span class="gd-card-label">Miyapur</span>
            <div class="gd-card-icon"><i class="fa-solid fa-location-dot"></i></div>
          </div>
          <div class="gd-card-value">${miyapurCount}</div>
          <div class="gd-card-desc">Members</div>
        </article>

        <!-- 3. MKR Branch Members (Green Growth) -->
        <article class="gd-card gd-accent-green">
          <div class="gd-card-top">
            <span class="gd-card-label">MKR Branch</span>
            <div class="gd-card-icon"><i class="fa-solid fa-seedling"></i></div>
          </div>
          <div class="gd-card-value">${mkrCount}</div>
          <div class="gd-card-desc">Members</div>
        </article>

        <!-- 4. Upcoming Meetings (Yellow Leadership) -->
        <article class="gd-card gd-accent-yellow">
          <div class="gd-card-top">
            <span class="gd-card-label">Upcoming Meetings</span>
            <div class="gd-card-icon"><i class="fa-solid fa-calendar-check"></i></div>
          </div>
          <div class="gd-card-value">${scheduledMeetingsCount}</div>
          <div class="gd-card-desc">Scheduled sessions</div>
        </article>

        <!-- 5. Attendance Overview (Green Growth) -->
        <article class="gd-card gd-accent-green">
          <div class="gd-card-top">
            <span class="gd-card-label">Attendance</span>
            <div class="gd-card-icon"><i class="fa-solid fa-clipboard-check"></i></div>
          </div>
          <div class="gd-card-value">${attendancePercent}%</div>
          <div class="gd-card-desc">${presentCount} Present · ${absentCount} Absent</div>
        </article>

        <!-- 6. Speech Progress (Blue & Green Accents) -->
        <article class="gd-card gd-accent-blue">
          <div class="gd-card-top">
            <span class="gd-card-label">Speech Progress</span>
            <div class="gd-card-icon"><i class="fa-solid fa-microphone-lines"></i></div>
          </div>
          <div class="gd-card-value">${speechProgressPercent}%</div>
          <div class="gd-card-desc">${completedSpeechProjects} of ${totalSpeechProjects} completed</div>
        </article>

        <!-- Custom Branches (if created by President) -->
        ${customBranches.map(branchName => {
          const count = allMembers.filter(m => (m.branch || '').toLowerCase() === branchName.toLowerCase()).length;
          return `
            <article class="gd-card gd-accent-blue">
              <div class="gd-card-top">
                <span class="gd-card-label">${escapeHtml(branchName)}</span>
                <div class="gd-card-icon"><i class="fa-solid fa-sitemap"></i></div>
              </div>
              <div class="gd-card-value">${count}</div>
              <div class="gd-card-desc">Members</div>
            </article>
          `;
        }).join('')}

      </div>

      <!-- ================================================================= -->
      <!-- 3. OUR BRANCHES MANAGEMENT SECTION -->
      <!-- ================================================================= -->
      <section class="gd-branch-panel" aria-label="Our Branches">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="gd-branch-title">
            <i class="fa-solid fa-sitemap" style="color: #2563EB;"></i>
            <span>Our Branches:</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="gd-branch-pill ${branchFilter === 'All' ? 'active' : ''}" data-branch="All">
              <span>All Branches</span>
              <span class="badge" style="background: rgba(0,0,0,0.06); color: inherit; padding: 1px 6px; font-size: 0.7rem;">${totalMembersCount}</span>
            </button>
            ${allBranches.map(b => {
              const bCount = allMembers.filter(m => (m.branch || '').toLowerCase() === b.toLowerCase()).length;
              const isSelected = branchFilter.toLowerCase() === b.toLowerCase();
              return `
                <button type="button" class="gd-branch-pill ${isSelected ? 'active' : ''}" data-branch="${escapeHtml(b)}">
                  <span>${escapeHtml(b)}</span>
                  <span class="badge" style="background: rgba(0,0,0,0.06); color: inherit; padding: 1px 6px; font-size: 0.7rem;">${bCount}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Add Branch button strictly for President / Super Admin -->
        ${canAddBranch ? `
          <button type="button" id="gd-add-branch-btn" class="gd-add-branch-btn" title="Add a new club branch">
            <i class="fa-solid fa-plus"></i>
            <span>Add Branch</span>
          </button>
        ` : ''}
      </section>

      <!-- ================================================================= -->
      <!-- 4. MEETINGS, ATTENDANCE & MEMBER GROWTH OVERVIEW -->
      <!-- ================================================================= -->
      <div class="gd-split-row">
        
        <!-- Next Meeting Overview (Yellow Leadership Highlight) -->
        <article class="gd-section-card" style="border-left: 4px solid #FACC15;">
          <div class="gd-section-header">
            <h3>
              <i class="fa-solid fa-calendar-days" style="color: #FACC15;"></i>
              <span>Next Meeting Session</span>
            </h3>
            <span style="font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 999px; ${nextMeeting?.status === 'Upcoming' ? 'background: #F0FDF4; color: #16A34A; border: 1px solid #16A34A;' : 'background: #EFF6FF; color: #2563EB; border: 1px solid #2563EB;'}">
              ${nextMeeting ? nextMeeting.status : 'None'}
            </span>
          </div>

          <div style="margin: 8px 0 14px;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #0F172A;">
              ${nextMeeting ? `${escapeHtml(nextMeeting.date)} · ${escapeHtml(nextMeeting.startTime)}` : 'No upcoming session scheduled'}
            </div>
            <div style="font-size: 0.82rem; color: #64748B; margin-top: 4px;">
              <i class="fa-solid fa-location-dot" style="color: #2563EB; margin-right: 4px;"></i>
              Branch: <strong>${nextMeeting ? escapeHtml(nextMeeting.branch) : branchFilter}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="#connect" class="btn btn-primary btn-sm" style="background: #2563EB; border-color: #2563EB; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
              <i class="fa-solid fa-video"></i> In-App Call
            </a>
            <a href="#agenda" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #2563EB; color: #2563EB;">
              <i class="fa-solid fa-list-check"></i> Open Agenda
            </a>
          </div>
        </article>

        <!-- Attendance & Speech Progress (Growth Green & Blue) -->
        <article class="gd-section-card" style="border-left: 4px solid #16A34A;">
          <div class="gd-section-header">
            <h3>
              <i class="fa-solid fa-chart-line" style="color: #16A34A;"></i>
              <span>Growth &amp; Attendance</span>
            </h3>
            <span style="font-size: 0.78rem; font-weight: 800; color: #16A34A;">${attendancePercent}% Attendance</span>
          </div>

          <!-- Attendance bar -->
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748B; margin-bottom: 4px;">
              <span>Present: <strong>${presentCount}</strong></span>
              <span>Absent: <strong>${absentCount}</strong></span>
            </div>
            <div style="height: 8px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
              <div style="height: 100%; width: ${displayAttendance.length ? Math.max(10, attendancePercent) : 0}%; background: #16A34A; border-radius: inherit;"></div>
            </div>
          </div>

          <!-- Speech Progress bar -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748B; margin-bottom: 4px;">
              <span>Speech Projects</span>
              <span><strong>${completedSpeechProjects} / ${totalSpeechProjects}</strong> (${speechProgressPercent}%)</span>
            </div>
            <div style="height: 8px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
              <div style="height: 100%; width: ${speechProgressPercent}%; background: linear-gradient(90deg, #2563EB, #16A34A); border-radius: inherit;"></div>
            </div>
          </div>

          <div style="margin-top: 14px;">
            <a href="#speeches" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #16A34A; color: #16A34A; background: #F0FDF4;">
              <i class="fa-solid fa-arrow-right"></i> View Speech Tracker
            </a>
          </div>
        </article>

      </div>

      <!-- ================================================================= -->
      <!-- 5. REMINDERS & PRIORITIES (YELLOW LEADERSHIP ACCENT) -->
      <!-- ================================================================= -->
      <section class="gd-section-card" style="border-top: 4px solid #FACC15;">
        <div class="gd-section-header">
          <div>
            <div style="font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: #854D0E; font-weight: 800;">Leadership Action Items</div>
            <h3 style="margin: 3px 0 0;">
              <i class="fa-solid fa-bell" style="color: #FACC15;"></i>
              <span>Reminders &amp; Priorities</span>
            </h3>
          </div>
          <span class="badge" style="background: #FEFCE8; color: #854D0E; border: 1px solid #FACC15; font-weight: 800; font-size: 0.74rem;">
            ${reminders.filter(item => !item.done).length} active
          </span>
        </div>

        <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 18px;">
          
          <!-- Add Reminder Form -->
          <form id="reminder-form" style="display: grid; gap: 12px; padding: 16px; border: 1px solid #E2E8F0; background: #F8FAFC; border-radius: 14px;">
            <label style="display: grid; gap: 4px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Reminder Title</span>
              <input id="reminder-title" class="form-input" type="text" maxlength="80" placeholder="e.g. Confirm Toastmaster Roles" required />
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <label style="display: grid; gap: 4px;">
                <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Category</span>
                <select id="reminder-type" class="form-select">
                  <option value="Meeting">Meeting</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Event">Event</option>
                  <option value="General">General</option>
                </select>
              </label>
              <label style="display: grid; gap: 4px;">
                <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Due Date</span>
                <input id="reminder-date" class="form-input" type="date" required />
              </label>
            </div>
            <label style="display: grid; gap: 4px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Action Details</span>
              <textarea id="reminder-message" class="form-input" rows="3" maxlength="200" placeholder="Required action or deadline..." required></textarea>
            </label>
            <button type="submit" class="btn btn-primary" style="background: #2563EB; border-color: #2563EB; justify-self: start; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
              <i class="fa-solid fa-plus"></i> Add Priority
            </button>
          </form>

          <!-- Reminders Feed -->
          <div style="display: grid; gap: 10px; max-height: 420px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; font-weight: 800; color: #64748B; letter-spacing: 0.06em; text-transform: uppercase;">Active Alerts</span>
              <button id="enable-reminder-alerts" type="button" class="btn btn-outline btn-sm" style="font-size: 0.74rem; border-color: #2563EB; color: #2563EB;">Enable Desktop Alerts</button>
            </div>
            ${reminders.length ? reminders.map(reminder => `
              <article style="padding: 12px 14px; border: 1px solid ${reminder.done ? '#16A34A' : '#E2E8F0'}; border-radius: 14px; background: ${reminder.done ? '#F0FDF4' : '#FFFFFF'};">
                <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;">
                  <div>
                    <span style="font-size: 0.66rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em;">${escapeHtml(reminder.type)}</span>
                    <h4 style="margin: 2px 0 2px; font-size: 0.95rem; color: #0F172A;">${escapeHtml(reminder.title)}</h4>
                  </div>
                  <span style="padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; color: ${reminder.done ? '#16A34A' : '#854D0E'}; background: ${reminder.done ? '#F0FDF4' : '#FEFCE8'}; border: 1px solid ${reminder.done ? '#16A34A' : '#FACC15'};">
                    ${reminder.done ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p style="margin: 4px 0 8px; color: #64748B; font-size: 0.78rem; line-height: 1.45;">${escapeHtml(reminder.message)}</p>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                  <span style="font-size: 0.7rem; color: #64748B;"><i class="fa-solid fa-calendar-day"></i> ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-outline btn-sm reminder-toggle-btn" data-reminder-id="${escapeHtml(reminder.id)}" style="font-size: 0.72rem; padding: 3px 8px; border-color: #16A34A; color: #16A34A;">${reminder.done ? 'Undo' : 'Mark Done'}</button>
                    <button type="button" class="btn btn-outline btn-sm reminder-delete-btn" data-reminder-id="${escapeHtml(reminder.id)}" style="font-size: 0.72rem; padding: 3px 8px; color: #64748B; border-color: #E2E8F0;">Delete</button>
                  </div>
                </div>
              </article>
            `).join('') : '<div style="padding: 24px; border: 1px dashed #E2E8F0; border-radius: 14px; color: #64748B; text-align: center; font-size: 0.84rem;">No priorities set. Add a reminder above.</div>'}
          </div>

        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 6. QUICK ACTIONS BAR (STRICTLY BLUE, GREEN, YELLOW) -->
      <!-- ================================================================= -->
      <div style="margin-top: 22px; display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="#connect" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #2563EB; color: #2563EB; background: #EFF6FF;">
          <i class="fa-solid fa-comments"></i> Club Connect
        </a>
        <a href="#meetings" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #FACC15; color: #854D0E; background: #FEFCE8;">
          <i class="fa-solid fa-calendar-days"></i> All Meetings
        </a>
        <a href="#attendance" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #16A34A; color: #16A34A; background: #F0FDF4;">
          <i class="fa-solid fa-clipboard-user"></i> Record Attendance
        </a>
        <a href="#speeches" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #2563EB; color: #2563EB; background: #EFF6FF;">
          <i class="fa-solid fa-microphone-lines"></i> Speech Tracker
        </a>
      </div>

    </div>
  `;
}

function bindDashboardEvents() {
  bindReminderEvents();

  // Branch filter pills in Dashboard
  document.querySelectorAll('.gd-branch-pill').forEach(pill => {
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
  document.getElementById('gd-add-branch-btn')?.addEventListener('click', () => {
    openModal({
      title: 'Add New Club Branch',
      content: `
        <form id="dash-create-branch-form" style="display: grid; gap: 14px;">
          <label style="display: grid; gap: 6px;">
            <span style="font-weight: 700; font-size: 0.82rem; color: #0F172A;">Branch / Location Name</span>
            <input type="text" id="dash-new-branch-input" class="form-input" placeholder="e.g. Kondapur or Hitec City" maxlength="40" required />
          </label>
          <p style="font-size: 0.76rem; color: #64748B; margin: 0;">
            This creates an official chartered branch across club rosters, attendance, and meeting sessions.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="dash-cancel-branch-btn" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: #2563EB; border-color: #2563EB;"><i class="fa-solid fa-plus"></i> Create Branch</button>
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
