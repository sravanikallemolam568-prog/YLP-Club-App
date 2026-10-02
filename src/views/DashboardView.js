// Simple, modern home dashboard for the club app

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

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
          <div style="font-size: 0.92rem; font-weight:800; color:#111827;">${reminder.title}</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color:#4b5563; line-height:1.45;">${reminder.message}</div>
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
        <div style="font-size: 0.92rem; font-weight:800; color:#111827;">${reminder.title}</div>
      </div>
    </div>
    <div style="font-size: 0.8rem; color:#4b5563; line-height:1.45;">${reminder.message}</div>
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

export function renderDashboardView(branchFilter = 'All') {
  const user = authService.getCurrentUser();
  let members = dbService.getMembers();
  let meetings = dbService.getMeetings();
  let attendance = dbService.getAttendance();
  const reminders = dbService.getReminders()
    .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate));

  const dueReminders = getDueReminders(reminders);
  if (dueReminders.length) {
    triggerBrowserReminder(reminders);
    setTimeout(() => showReminderAlertPopup(reminders), 200);
  }

  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
    meetings = meetings.filter(m => m.branch === branchFilter);
    attendance = attendance.filter(a => a.branch === branchFilter);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const todaysMeeting = meetings.find(m => m.date === todayLabel) || meetings[0];
  const nextMeeting = meetings.find(m => m.date && m.date !== todayLabel) || meetings[0];
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status !== 'Present').length;

  setTimeout(() => bindReminderEvents(), 40);

  return `
    <div class="animate-fade-in" style="max-width: 980px; margin: 0 auto; padding-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px;">
        <div>
          <div style="font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); font-weight: 800;">PSS MIYAPUR GAVEL</div>
          <h2 style="font-size: 2.1rem; line-height: 1.1; margin-top: 6px; margin-bottom: 0;">${greeting} 👋</h2>
        </div>
        <div style="background: rgba(69, 201, 189, 0.09); border: 1px solid rgba(69, 201, 189, 0.18); border-radius: 14px; padding: 8px 12px; color: var(--teal-dark); font-weight: 800; font-size: 0.8rem;">
          ${user ? user.role : 'President'}
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(69,201,189,0.08), rgba(255,255,255,1)); border: 1px solid rgba(69, 201, 189, 0.14); border-radius: 22px; padding: 20px 18px; margin-bottom: 22px; box-shadow: var(--shadow-sm);">
        <img src="/gavel-club-logo.svg" alt="PSS Gavel Club logo" style="width: 52px; height: 52px; object-fit: cover; border-radius: 16px; flex-shrink: 0;" />
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); font-weight: 700;">PSS MIYAPUR GAVEL</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px; line-height: 1.1;">Gavel Club Management</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 26px;">
        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 10px;">Today's Meeting</div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--teal-dark); font-weight: 800; font-size: 1.1rem;">
            <i class="fa-solid fa-calendar-days"></i>
            <span>${todaysMeeting ? todaysMeeting.date : 'No meeting scheduled'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; color: var(--text-secondary);">
            <i class="fa-solid fa-clock"></i>
            <span>${todaysMeeting ? todaysMeeting.startTime : '—'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; color: var(--text-secondary);">
            <i class="fa-solid fa-location-dot"></i>
            <span>${todaysMeeting ? todaysMeeting.branch : '—'}</span>
          </div>
        </article>

        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px;">Attendance</div>
          <div style="display: flex; align-items: end; gap: 18px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--teal-dark);">${presentCount}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Present</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">${absentCount}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Absent</div>
            </div>
          </div>
          <div style="height: 8px; background: #EAF3F2; border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${attendance.length ? Math.max(10, Math.round((presentCount / Math.max(attendance.length, 1)) * 100)) : 0}%; background: linear-gradient(90deg, var(--teal-primary), var(--teal-dark)); border-radius: inherit;"></div>
          </div>
        </article>

        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 10px;">Upcoming Meeting</div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--teal-dark); font-weight: 800; font-size: 1.1rem;">
            <i class="fa-solid fa-clock"></i>
            <span>${nextMeeting ? nextMeeting.date : 'Next session'}</span>
          </div>
          <div style="color: var(--text-secondary);">
            ${nextMeeting ? nextMeeting.startTime : 'Awaiting schedule'}
          </div>
        </article>
      </div>

      <div style="margin-top: 28px; background: linear-gradient(180deg, rgba(69,201,189,0.05), rgba(255,255,255,0.9)); border: 1px solid rgba(69, 201, 189, 0.15); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); font-weight: 800;">Reminder Panel</div>
            <h3 style="margin: 6px 0 0; font-size: 1.35rem; color: var(--text-primary);">Upcoming reminders</h3>
          </div>
          <span style="display:inline-flex; align-items:center; justify-content:center; padding: 6px 10px; border-radius: 999px; background: rgba(69, 201, 189, 0.12); color: var(--teal-dark); font-size: 0.72rem; font-weight: 800;">${reminders.filter(item => !item.done).length} active</span>
        </div>

        <div style="display: grid; grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.24fr); gap: 18px;">
          <form id="reminder-form" style="display:grid; gap: 12px; padding: 14px; border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 16px;">
            <label style="display:grid; gap: 6px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Title</span>
              <input id="reminder-title" class="form-input" type="text" maxlength="80" placeholder="Meeting reminder" required />
            </label>
            <label style="display:grid; gap: 6px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Type</span>
              <select id="reminder-type" class="form-select">
                <option value="Meeting">Meeting</option>
                <option value="Attendance">Attendance</option>
                <option value="Event">Event</option>
                <option value="General">General</option>
              </select>
            </label>
            <label style="display:grid; gap: 6px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Date</span>
              <input id="reminder-date" class="form-input" type="date" required />
            </label>
            <label style="display:grid; gap: 6px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">Message</span>
              <textarea id="reminder-message" class="form-input" rows="4" maxlength="200" placeholder="Share the message or action needed." required></textarea>
            </label>
            <button type="submit" class="btn btn-primary" style="justify-self: start;">
              <i class="fa-solid fa-bell"></i> Add reminder
            </button>
          </form>

          <div style="display:grid; gap: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;">Alerts</span>
              <button id="enable-reminder-alerts" type="button" class="btn btn-outline btn-sm">Enable desktop alerts</button>
            </div>
            ${reminders.length ? reminders.map(reminder => `
              <article style="padding: 14px 14px 12px; border: 1px solid ${reminder.done ? 'rgba(16,185,129,0.25)' : 'var(--border-color)'}; border-radius: 14px; background: ${reminder.done ? 'rgba(16,185,129,0.04)' : 'var(--bg-card)'};">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                  <div>
                    <div style="font-size: 0.68rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">${reminder.type}</div>
                    <h4 style="margin: 6px 0 4px; font-size: 1rem; color: var(--text-primary);">${reminder.title}</h4>
                  </div>
                  <span style="padding: 5px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; color: ${reminder.done ? '#047857' : '#0f766e'}; background: ${reminder.done ? 'rgba(16,185,129,0.12)' : 'rgba(69, 201, 189, 0.12)'};">${reminder.done ? 'Done' : 'Pending'}</span>
                </div>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5;">${reminder.message}</p>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top: 12px; flex-wrap: wrap;">
                  <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-calendar-day"></i> ${new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <div style="display:flex; gap: 8px;">
                    <button type="button" class="btn btn-outline btn-sm reminder-toggle-btn" data-reminder-id="${reminder.id}">${reminder.done ? 'Undo' : 'Mark done'}</button>
                    <button type="button" class="btn btn-outline btn-sm reminder-delete-btn" data-reminder-id="${reminder.id}">Delete</button>
                  </div>
                </div>
              </article>
            `).join('') : '<div style="padding: 18px; border: 1px dashed var(--border-color); border-radius: 14px; color: var(--text-secondary); text-align:center;">No reminders yet. Add one to keep your club tasks on track.</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}
