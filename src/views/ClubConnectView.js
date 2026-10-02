import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function safeHttpUrl(value = '') {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function getEcContacts() {
  const committee = dbService.getECCommittee();
  return [
    { role: 'President', name: committee.president, email: committee.presidentEmail, icon: 'fa-crown' },
    { role: 'VP Membership', name: committee.vpMembership, email: committee.vpMembershipEmail, icon: 'fa-users' },
    { role: 'VP Public Relations', name: committee.vpPR, email: committee.vpPREmail, icon: 'fa-photo-film' },
    { role: committee.ajithSirRole || 'Advisor & Mentor', name: committee.ajithSir, email: committee.ajithSirEmail, icon: 'fa-user-graduate' }
  ].filter(contact => contact.name && contact.email);
}

export function renderClubConnectView(branchFilter = 'All') {
  const meetings = dbService.getMeetings()
    .filter(meeting => meeting.status === 'Upcoming')
    .filter(meeting => branchFilter === 'All' || meeting.branch === branchFilter)
    .sort((first, second) => String(first.date).localeCompare(String(second.date)));
  const contacts = getEcContacts();
  const canManageCalls = authService.canManageMeetings();
  const currentUser = authService.getCurrentUser() || { name: 'Club Member', email: 'member@pssgavelclub.org' };
  const supportTickets = dbService.getSupportTickets()
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  setTimeout(() => bindClubConnectEvents(), 50);

  return `
    <div class="animate-fade-in connect-page">
      <header class="connect-heading">
        <div>
          <h2>Club Connect</h2>
          <p>Connect with the EC, join meetings, and get help from your club.</p>
        </div>
      </header>

      <div class="connect-quick-actions" aria-label="Club Connect shortcuts">
        <a class="connect-feature-card" href="#connect-video-calls">
          <span class="connect-feature-icon"><i class="fa-solid fa-video"></i></span>
          <span><strong>Video Calls</strong><small>Join online club meetings</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
        <a class="connect-feature-card" href="#connect-ec-contacts">
          <span class="connect-feature-icon"><i class="fa-solid fa-comments"></i></span>
          <span><strong>Chat with EC</strong><small>Contact your EC team</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
        <a class="connect-feature-card" href="#connect-support">
          <span class="connect-feature-icon"><i class="fa-solid fa-circle-question"></i></span>
          <span><strong>Doubts &amp; Support</strong><small>Get help when you need it</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
      </div>

      <section class="connect-section" id="connect-video-calls">
        <div class="section-heading">
          <div><h3>Upcoming Meetings</h3></div>
          ${meetings.length ? `<span class="connect-section-count">${meetings.length} ${meetings.length === 1 ? 'meeting' : 'meetings'}</span>` : ''}
        </div>
        ${meetings.length ? `
          <div class="connect-card-list">
            ${meetings.map(meeting => {
              const safeLink = safeHttpUrl(meeting.videoLink);
              return `
                <article class="connect-meeting-card">
                  <div class="connect-meeting-main">
                    <div class="connect-feature-icon"><i class="fa-solid fa-video"></i></div>
                    <div class="connect-card-title">
                      <span class="connect-meeting-label">Upcoming Club Meeting</span>
                      <h4>${escapeHtml(meeting.date)} · ${escapeHtml(meeting.branch)}</h4>
                      <p>${escapeHtml(meeting.startTime)}</p>
                    </div>
                  </div>
                  <div class="connect-meeting-platform"><span>Platform</span><strong>${escapeHtml(meeting.videoPlatform || 'Google Meet')}</strong></div>
                  <div class="connect-meeting-actions">
                    ${safeLink ? `<a class="btn btn-primary connect-join-button" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i> Join Call</a>` : '<span class="connect-link-missing">Meeting link not added</span>'}
                  </div>
                  ${canManageCalls ? `
                    <details class="connect-meeting-settings">
                      <summary>Meeting settings</summary>
                      <form class="connect-link-form" data-meeting-id="${escapeHtml(meeting.id)}">
                        <label>
                          <span>Meeting Platform</span>
                          <select class="form-select connect-platform" aria-label="Meeting Platform">
                            <option value="Google Meet" ${meeting.videoPlatform === 'Google Meet' || !meeting.videoPlatform ? 'selected' : ''}>Google Meet</option>
                            <option value="Zoom" ${meeting.videoPlatform === 'Zoom' ? 'selected' : ''}>Zoom</option>
                            <option value="Microsoft Teams" ${meeting.videoPlatform === 'Microsoft Teams' ? 'selected' : ''}>Microsoft Teams</option>
                          </select>
                        </label>
                        <label class="connect-link-field">
                          <span>Meeting Link</span>
                          <input class="form-input connect-video-link" type="url" value="${escapeHtml(meeting.videoLink || '')}" placeholder="https://..." />
                        </label>
                        <button class="btn btn-outline" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save Meeting Link</button>
                      </form>
                    </details>
                  ` : ''}
                </article>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="connect-empty"><i class="fa-regular fa-calendar"></i><h4>No upcoming meetings</h4><p>Scheduled online meetings will appear here with their call details.</p></div>
        `}
      </section>

      <section class="connect-section" id="connect-ec-contacts">
        <div class="section-heading">
          <div><h3>Chat with EC</h3><p class="section-note">Contact a committee member directly.</p></div>
        </div>
        <div class="connect-contact-grid">
          ${contacts.map(contact => `
            <article class="connect-contact-card">
              <div class="connect-icon"><i class="fa-solid ${contact.icon}"></i></div>
              <div class="connect-card-title"><h4>${escapeHtml(contact.name)}</h4><p>${escapeHtml(contact.role)}</p></div>
              <a class="btn btn-outline btn-sm" href="mailto:${escapeHtml(contact.email)}?subject=${encodeURIComponent('PSS Miyapur Gavel Club')}"><i class="fa-solid fa-envelope"></i> Message</a>
            </article>
          `).join('') || '<div class="connect-empty">EC contact details have not been added yet.</div>'}
        </div>
        <p class="connect-note"><i class="fa-solid fa-circle-info"></i> Messages open your email app; live in-app chat is not connected.</p>
      </section>

      <section class="connect-section connect-support-section" id="connect-support">
        <div class="section-heading"><div><h3>Doubts &amp; Support</h3><p class="section-note">Quick answers and a direct way to ask for help.</p></div></div>
        <div class="connect-faq-list">
          <details class="connect-faq"><summary>Where do I join an online meeting?</summary><p>Choose Join Call on the upcoming meeting card above.</p></details>
          <details class="connect-faq"><summary>Where can I see my meeting role or agenda?</summary><p>Open Meetings to review roles, then open Agenda to see the planned activities and timings.</p></details>
          <details class="connect-faq"><summary>How do I record attendance?</summary><p>Open More, choose Attendance, select the meeting, and choose the appropriate status for each member.</p></details>
        </div>

        <div class="support-ticket-layout">
          <form id="connect-ticket-form" class="connect-card connect-support-form">
            <div><h4>Create support ticket</h4><p class="section-note">Raise a request and the EC can track it.</p></div>
            <label>
              <span>Category</span>
              <select id="ticket-category" class="form-select">
                <option value="Meeting Access">Meeting Access</option>
                <option value="Mentoring">Mentoring</option>
                <option value="Attendance">Attendance</option>
                <option value="Event Query">Event Query</option>
                <option value="General Help">General Help</option>
              </select>
            </label>
            <label>
              <span>Title</span>
              <input id="ticket-title" class="form-input" maxlength="100" placeholder="Brief title for your issue" required />
            </label>
            <label>
              <span>Details</span>
              <textarea id="ticket-details" class="form-input" rows="4" maxlength="1200" placeholder="Describe what you need help with" required></textarea>
            </label>
            <div class="support-ticket-form-footer">
              <button class="btn btn-primary" type="submit"><i class="fa-solid fa-ticket"></i> Submit Ticket</button>
              <span class="support-ticket-user">Raised by: ${escapeHtml(currentUser.name || 'Club Member')}</span>
            </div>
          </form>

          <div class="connect-card support-ticket-panel">
            <div class="support-ticket-header">
              <div>
                <h4>Recent support tickets</h4>
                <p class="section-note">Tracks club issues and follow-up requests.</p>
              </div>
              <span class="support-ticket-badge">${supportTickets.length} total</span>
            </div>
            <div class="support-ticket-list" id="support-ticket-list">
              ${supportTickets.length ? supportTickets.map(ticket => `
                <article class="support-ticket-item" data-ticket-id="${escapeHtml(ticket.id)}">
                  <div class="support-ticket-row">
                    <div>
                      <h5>${escapeHtml(ticket.title)}</h5>
                      <p>${escapeHtml(ticket.category)}</p>
                    </div>
                    <span class="support-status status-${escapeHtml(ticket.status).toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(ticket.status)}</span>
                  </div>
                  <p class="support-ticket-description">${escapeHtml(ticket.description)}</p>
                  <div class="support-ticket-meta">
                    <span>By ${escapeHtml(ticket.submittedBy || currentUser.name)}</span>
                    <span>${new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="support-ticket-actions">
                    <select class="form-select support-ticket-status" data-ticket-id="${escapeHtml(ticket.id)}">
                      <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                      <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                      <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </div>
                </article>
              `).join('') : '<div class="connect-empty"><i class="fa-regular fa-clipboard"></i><h4>No tickets yet</h4><p>Support requests created by members will appear here.</p></div>'}
            </div>
          </div>
        </div>

        <form id="connect-support-form" class="connect-card connect-support-form">
          <div><h4>Contact your club</h4><p class="section-note">Tell the EC what you need help with.</p></div>
          <label><span>Send to</span>
            <select id="support-recipient" class="form-select">
              ${contacts.map(contact => `<option value="${escapeHtml(contact.email)}">${escapeHtml(contact.role)} · ${escapeHtml(contact.name)}</option>`).join('')}
            </select>
          </label>
          <label><span>Topic</span><input id="support-topic" class="form-input" maxlength="100" placeholder="What do you need help with?" required /></label>
          <label><span>Details</span><textarea id="support-details" class="form-input" rows="4" maxlength="1200" placeholder="Share a few details so the EC can help." required></textarea></label>
          <button class="btn btn-primary" type="submit" ${contacts.length ? '' : 'disabled'}><i class="fa-solid fa-paper-plane"></i> Prepare support email</button>
          ${!contacts.length ? `<p class="connect-note">Add EC contact emails in EC Committee settings before sending a support request.</p>` : ''}
        </form>
      </section>
    </div>
  `;
}

function bindClubConnectEvents() {
  document.querySelectorAll('.connect-link-form').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const meetingId = form.dataset.meetingId;
      const videoPlatform = form.querySelector('.connect-platform')?.value || 'Google Meet';
      const videoLink = form.querySelector('.connect-video-link')?.value.trim() || '';
      if (videoLink && !safeHttpUrl(videoLink)) {
        showToast('Enter a valid http or https meeting link.', 'error');
        return;
      }
      dbService.updateMeeting(meetingId, { videoPlatform, videoLink });
      showToast('Meeting link saved.', 'success');
      window.location.reload();
    });
  });

  document.getElementById('connect-ticket-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const category = document.getElementById('ticket-category')?.value || 'General Help';
    const title = document.getElementById('ticket-title')?.value.trim();
    const description = document.getElementById('ticket-details')?.value.trim();
    const currentUser = authService.getCurrentUser() || { name: 'Club Member', email: 'member@pssgavelclub.org' };

    if (!title || !description) {
      showToast('Please fill in the ticket title and details.', 'error');
      return;
    }

    dbService.addSupportTicket({
      title,
      category,
      description,
      status: 'Open',
      submittedBy: currentUser.name || 'Club Member'
    });

    showToast('Support ticket created successfully.', 'success');
    window.location.reload();
  });

  document.querySelectorAll('.support-ticket-status').forEach(select => {
    select.addEventListener('change', event => {
      const ticketId = event.target.dataset.ticketId;
      const status = event.target.value;
      if (!ticketId || !status) return;
      dbService.updateSupportTicket(ticketId, { status });
      showToast('Ticket status updated.', 'success');
      window.location.reload();
    });
  });

  document.getElementById('connect-support-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const recipient = document.getElementById('support-recipient')?.value;
    const topic = document.getElementById('support-topic')?.value.trim();
    const details = document.getElementById('support-details')?.value.trim();
    if (!recipient || !topic || !details) return;
    const subject = encodeURIComponent(`[PSS Gavel Support] ${topic}`);
    const body = encodeURIComponent(`${details}\n\nSent from PSS Miyapur Gavel Club app.`);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
}