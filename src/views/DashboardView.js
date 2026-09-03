// Dashboard View with Time-Aware Greeting, Live Stats, Branch Distribution, Next Meeting, and EC Officers

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';

export function renderDashboardView(branchFilter = 'All') {
  const user = authService.getCurrentUser();
  let members = dbService.getMembers();
  let meetings = dbService.getMeetings();
  let ec = dbService.getECCommittee();
  let attendance = dbService.getAttendance();

  // Apply Branch Filter
  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
    meetings = meetings.filter(m => m.branch === branchFilter);
    attendance = attendance.filter(a => a.branch === branchFilter);
  }

  // Time-Aware Greeting Calculation
  const currentHour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) timeGreeting = 'Good afternoon';
  else if (currentHour >= 17) timeGreeting = 'Good evening';

  // Metrics Calculations
  const totalMembers = members.length;
  const totalSpeeches = members.reduce((sum, m) => sum + (m.speechesCompleted || 0), 0);
  const meetingsHeld = meetings.length;

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const avgAttendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 85;

  // Branch Distribution Counts
  const miyapurCount = dbService.getMembers().filter(m => m.branch === 'Miyapur').length;
  const ghmcCount = dbService.getMembers().filter(m => m.branch === 'GHMC').length;
  const mkrCount = dbService.getMembers().filter(m => m.branch === 'MKR').length;

  const nextMeeting = meetings.find(m => m.status === 'Upcoming') || meetings[0];

  return `
    <div class="animate-fade-in">
      <!-- Time Greeting & Welcome Banner -->
      <div class="card" style="background: linear-gradient(135deg, var(--navy-mid) 0%, var(--navy-dark) 100%); border-color: var(--gold-primary); margin-bottom: 20px; color: #FFFFFF;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 0.85rem; color: var(--gold-bright); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              <i class="fa-solid fa-clock"></i> ${timeGreeting}, ${user ? user.name : 'Gavelier'}!
            </div>
            <h2 style="font-size: 1.6rem; margin-top: 4px; color: #FFFFFF;">PSS Miyapur Gavel Club Dashboard</h2>
            <p style="font-size: 0.9rem; color: #94A3B8; margin-top: 2px;">
              Empowering young leaders through speech, communication & leadership excellence.
            </p>
          </div>
          <div class="badge badge-gold" style="font-size: 0.85rem; padding: 8px 14px;">
            <i class="fa-solid fa-code-branch"></i> Active Branch: ${branchFilter}
          </div>
        </div>
      </div>

      <!-- Stat Tiles Grid -->
      <div class="stats-grid">
        <div class="stat-tile">
          <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          <div class="stat-val">${totalMembers}</div>
          <div class="stat-lbl">Total Members</div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon"><i class="fa-solid fa-microphone"></i></div>
          <div class="stat-val">${totalSpeeches}</div>
          <div class="stat-lbl">Speeches Completed</div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="stat-val">${meetingsHeld}</div>
          <div class="stat-lbl">Meetings Held</div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon"><i class="fa-solid fa-user-check"></i></div>
          <div class="stat-val">${avgAttendancePct}%</div>
          <div class="stat-lbl">Avg Attendance</div>
        </div>
      </div>

      <!-- Grid Layout for Next Meeting & Branch Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- Next Meeting Showcase Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-calendar-day"></i> Next Meeting</div>
            <span class="badge badge-gold">${nextMeeting ? nextMeeting.status : 'Scheduled'}</span>
          </div>
          ${nextMeeting ? `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="font-weight: 700; font-size: 1.1rem; color: var(--gold-primary);">
                Date: ${nextMeeting.date} (${nextMeeting.startTime})
              </div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">
                <i class="fa-solid fa-location-dot"></i> Branch: ${nextMeeting.branch}
              </div>
              <div style="margin-top: 8px; padding: 10px; background-color: var(--badge-bg); border-radius: 10px; font-size: 0.85rem;">
                <div style="font-weight: 700; margin-bottom: 4px;">Role Highlights:</div>
                <div><strong>Gavelier:</strong> ${nextMeeting.roles?.Gavelier || 'TBD'}</div>
                <div><strong>Topic Master:</strong> ${nextMeeting.roles?.['Topic Master'] || 'TBD'}</div>
              </div>
              <a href="#agenda" class="btn btn-primary btn-sm" style="margin-top: 6px; width: 100%;">
                <i class="fa-solid fa-list-check"></i> View Meeting Agenda
              </a>
            </div>
          ` : '<p>No upcoming meetings scheduled.</p>'}
        </div>

        <!-- Branch Distribution Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-chart-simple"></i> Branch Distribution</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                <span>Miyapur Branch</span>
                <span>${miyapurCount} Members</span>
              </div>
              <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${(miyapurCount/Math.max(totalMembers,1))*100}%"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                <span>GHMC Branch</span>
                <span>${ghmcCount} Members</span>
              </div>
              <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${(ghmcCount/Math.max(totalMembers,1))*100}%"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                <span>MKR Branch</span>
                <span>${mkrCount} Members</span>
              </div>
              <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${(mkrCount/Math.max(totalMembers,1))*100}%"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Executive Committee Showcase -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-user-gear"></i> Executive Committee (EC)</div>
          <a href="#settings" class="btn btn-outline btn-sm"><i class="fa-solid fa-pen"></i> Manage EC</a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--badge-bg);">
            <div style="font-size: 0.75rem; color: var(--gold-primary); font-weight: 700; text-transform: uppercase;">President</div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-top: 2px;">${ec.president || 'Priya Varma'}</div>
          </div>
          <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--badge-bg);">
            <div style="font-size: 0.75rem; color: var(--gold-primary); font-weight: 700; text-transform: uppercase;">VP Education</div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-top: 2px;">${ec.vpEducation || 'Kiran Kumar'}</div>
          </div>
          <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--badge-bg);">
            <div style="font-size: 0.75rem; color: var(--gold-primary); font-weight: 700; text-transform: uppercase;">VP Membership</div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-top: 2px;">${ec.vpMembership || 'Sravani Reddy'}</div>
          </div>
          <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--badge-bg);">
            <div style="font-size: 0.75rem; color: var(--gold-primary); font-weight: 700; text-transform: uppercase;">VP Public Relations</div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-top: 2px;">${ec.vpPR || 'Rahul Sharma'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
