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

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function isLeadershipUser(user) {
  if (!user) return false;
  return user.tier === 1 ||
         user.tier === 2 ||
         ['President', 'Club Advisor', 'VP Education', 'VP Membership', 'VP Public Relations', 'Secretary', 'Sergeant-at-Arms', 'EC Officer'].includes(user.role);
}

/**
 * Strict 3-Tier Privacy Filter for EC Chat:
 * - Tier 1 & 2 (Leadership / Upper Block): Can see ALL messages.
 * - Tier 3 (Lower Block / Regular Member): Can ONLY see their own conversation (sent by them or directly mentioning/targeting them).
 *   Other members' messages in Tier 3 are completely hidden.
 */
export function filterECChatMessages(messages = [], currentUser) {
  if (!currentUser) return [];

  if (isLeadershipUser(currentUser)) {
    return messages;
  }

  const userEmail = normalizeEmail(currentUser.email);
  const userName = (currentUser.name || '').trim().toLowerCase();

  return messages.filter(msg => {
    const senderEmail = normalizeEmail(msg.senderEmail);
    const senderName = (msg.senderName || '').trim().toLowerCase();
    const recipientEmail = normalizeEmail(msg.recipientEmail);
    const recipientTag = (msg.recipientTag || '').trim().toLowerCase();
    const content = (msg.content || '').toLowerCase();

    const isSender = (userEmail && senderEmail === userEmail) || (userName && senderName === userName);
    const isDirectRecipient = (userEmail && recipientEmail === userEmail) ||
                              (userName && recipientTag.includes(userName)) ||
                              (userName && content.includes(`@${userName}`));

    return isSender || isDirectRecipient;
  });
}

function getEcContacts() {
  const committee = dbService.getECCommittee();
  return [
    { role: 'President', name: committee.president, email: committee.presidentEmail, phone: committee.presidentPhone, icon: 'fa-crown', tag: '@President' },
    { role: committee.master2Role || committee.ajithSirRole || 'Club Advisor & Mentor', name: committee.master2Name || committee.ajithSir, email: committee.master2Email || committee.ajithSirEmail, phone: committee.master2Phone || committee.ajithSirPhone, icon: 'fa-user-graduate', tag: '@TM-Ajith' },
    { role: 'VP Education', name: committee.vpEducation, email: committee.vpEducationEmail, phone: committee.vpEducationPhone, icon: 'fa-graduation-cap', tag: '@VP-Education' },
    { role: 'VP Membership', name: committee.vpMembership, email: committee.vpMembershipEmail, phone: committee.vpMembershipPhone, icon: 'fa-users', tag: '@VP-Membership' },
    { role: 'VP Public Relations', name: committee.vpPR, email: committee.vpPREmail, phone: committee.vpPRPhone, icon: 'fa-photo-film', tag: '@VP-PR' },
    { role: 'Secretary', name: committee.secretary, email: committee.secretaryEmail, phone: committee.secretaryPhone, icon: 'fa-pen-fancy', tag: '@Secretary' },
    { role: 'Sergeant-at-Arms', name: committee.sergeant, email: committee.sergeantEmail, phone: committee.sergeantPhone, icon: 'fa-shield', tag: '@Sergeant-at-Arms' }
  ].filter(contact => contact.name && (contact.email || contact.phone));
}

function formatChatTimestamp(isoDateStr) {
  try {
    const date = new Date(isoDateStr);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return '';
  }
}

export function renderClubConnectView(branchFilter = 'All') {
  const meetings = dbService.getMeetings()
    .filter(meeting => meeting.status === 'Upcoming')
    .filter(meeting => branchFilter === 'All' || meeting.branch === branchFilter)
    .sort((first, second) => String(first.date).localeCompare(String(second.date)));
  
  const contacts = getEcContacts();
  const canStartCall = authService.canStartVideoCall();
  const currentUser = authService.getCurrentUser() || { name: 'Club Member', email: 'member@pssgavelclub.org', role: 'Member', tier: 3 };
  const isLeadership = isLeadershipUser(currentUser);
  
  const supportTickets = dbService.getSupportTickets()
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  
  const allChatMessages = dbService.getECChatMessages();
  const visibleChatMessages = filterECChatMessages(allChatMessages, currentUser);

  setTimeout(() => bindClubConnectEvents(currentUser), 50);

  return `
    <div class="animate-fade-in connect-page" style="padding-bottom: 50px;">
      <header class="connect-heading">
        <div>
          <h2><i class="fa-solid fa-comments" style="color: var(--teal-primary);"></i> Club Connect</h2>
          <p>Connect with the EC, join live meetings, chat directly with leadership, and get club support.</p>
        </div>
      </header>

      <div class="connect-quick-actions" aria-label="Club Connect shortcuts">
        <a class="connect-feature-card" href="#connect-video-calls">
          <span class="connect-feature-icon"><i class="fa-solid fa-video"></i></span>
          <span><strong>Video Calls</strong><small>Join online club meetings</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
        <a class="connect-feature-card" href="#connect-ec-chat-section">
          <span class="connect-feature-icon" style="background: rgba(69,201,189,0.18); color: var(--teal-deep);"><i class="fa-solid fa-paper-plane"></i></span>
          <span><strong>Chat with EC</strong><small>Private @mention chat</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
        <a class="connect-feature-card" href="#connect-ec-roles-table">
          <span class="connect-feature-icon"><i class="fa-solid fa-table-list"></i></span>
          <span><strong>Role Handbook</strong><small>EC access &amp; permissions</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
        <a class="connect-feature-card" href="#connect-support">
          <span class="connect-feature-icon"><i class="fa-solid fa-circle-question"></i></span>
          <span><strong>Doubts &amp; Support</strong><small>Tickets &amp; FAQs</small></span>
          <i class="fa-solid fa-arrow-down connect-feature-arrow"></i>
        </a>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 1: UPCOMING VIDEO CALLS -->
      <!-- ================================================================= -->
      <section class="connect-section" id="connect-video-calls">
        <div class="section-heading">
          <div><h3>Upcoming Meetings &amp; Calls</h3></div>
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
                    ${safeLink ? `
                      <a class="btn btn-primary connect-join-button" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-video"></i> Join Call
                      </a>
                    ` : `
                      <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.25); padding: 8px 12px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-circle-pause"></i> Meeting call not yet started by EC/President
                      </span>
                    `}
                  </div>
                  ${canStartCall ? `
                    <details class="connect-meeting-settings">
                      <summary><i class="fa-solid fa-gear"></i> Start / Configure Video Call (Tier 1 &amp; Tier 2 Authority)</summary>
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
                          <span>Video Call Link (URL)</span>
                          <input class="form-input connect-video-link" type="url" value="${escapeHtml(meeting.videoLink || '')}" placeholder="https://meet.google.com/..." required />
                        </label>
                        <button class="btn btn-primary" type="submit"><i class="fa-solid fa-play"></i> Start / Save Call Link</button>
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

      <!-- ================================================================= -->
      <!-- SECTION 2: HIERARCHICAL LIVE CHAT WITH EC (@MENTION ENFORCED) -->
      <!-- ================================================================= -->
      <section class="connect-section" id="connect-ec-chat-section">
        <div class="section-heading" style="margin-bottom: 14px;">
          <div>
            <h3 style="display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-comments" style="color: var(--teal-primary);"></i> Live Chat with EC
            </h3>
            <p class="section-note">
              ${isLeadership 
                ? 'EC Leadership Channel: Supervisory access to view and reply to all member communications.' 
                : 'Direct, private communication with your Executive Committee officers.'}
            </p>
          </div>
          <span class="badge ${isLeadership ? 'badge-info' : 'badge-success'}" style="font-weight: 700; font-size: 0.78rem;">
            ${isLeadership ? '🛡️ EC Leadership Channel' : '🔒 Private Member Inbox'}
          </span>
        </div>

        <!-- Privacy & Mention Instructions Banner -->
        <div style="background: ${isLeadership ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.09)'}; border: 1px solid ${isLeadership ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}; border-radius: 14px; padding: 12px 16px; margin-bottom: 16px; font-size: 0.82rem; line-height: 1.45; color: var(--text-primary); display: flex; align-items: flex-start; gap: 10px;">
          <i class="fa-solid ${isLeadership ? 'fa-shield-halved' : 'fa-lock'}" style="margin-top: 3px; font-size: 1rem; color: ${isLeadership ? '#2563EB' : '#059669'};"></i>
          <div>
            ${isLeadership ? `
              <strong>EC Officer Oversight:</strong> All Tier 1 (President &amp; Advisor) and Tier 2 (EC Officers) can view and reply to member communications for transparent club governance.
            ` : `
              <strong>Confidential Communication:</strong> In Tier 3, your messages can only be seen by <strong>you</strong> and the <strong>EC leadership team</strong>. Other club members <strong>cannot</strong> see your messages. Messages must start with an <code>@mention</code> pointing to the officer you wish to contact.
            `}
          </div>
        </div>

        <!-- Interactive Chat Container -->
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); box-shadow: var(--shadow-sm);">
          
          <!-- Chat Feed Header -->
          <div style="padding: 14px 18px; background: var(--badge-bg); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
              <span>Messages (${visibleChatMessages.length})</span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">
              Posting as: <strong>${escapeHtml(currentUser.name || 'Member')}</strong> (${escapeHtml(currentUser.role || 'Member')})
            </div>
          </div>

          <!-- Messages Stream -->
          <div id="ec-chat-messages-container" style="min-height: 260px; max-height: 480px; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-main);">
            ${visibleChatMessages.length === 0 ? `
              <div style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
                <div style="width: 54px; height: 54px; border-radius: 16px; background: rgba(69,201,189,0.12); color: var(--teal-deep); display: grid; place-items: center; font-size: 1.4rem; margin: 0 auto 12px;">
                  <i class="fa-regular fa-comments"></i>
                </div>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">No messages yet</div>
                <p style="margin: 4px 0 0; font-size: 0.82rem;">Select an EC officer below using an @mention to start the conversation.</p>
              </div>
            ` : visibleChatMessages.map(msg => {
              const isOwnMessage = (currentUser.email && normalizeEmail(msg.senderEmail) === normalizeEmail(currentUser.email)) ||
                                   (currentUser.name && msg.senderName === currentUser.name);
              const senderIsTier1 = msg.senderTier === 1 || msg.senderRole === 'President' || msg.senderRole === 'Club Advisor';
              const senderIsTier2 = msg.senderTier === 2 || ['VP Education', 'VP Membership', 'VP Public Relations', 'Secretary', 'Sergeant-at-Arms', 'EC Officer'].includes(msg.senderRole);
              
              const badgeBg = senderIsTier1 ? 'rgba(234, 179, 8, 0.15)' : senderIsTier2 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
              const badgeColor = senderIsTier1 ? '#B45309' : senderIsTier2 ? '#1D4ED8' : '#047857';
              const badgeIcon = senderIsTier1 ? '👑' : senderIsTier2 ? '🛡️' : '👤';

              return `
                <div class="ec-chat-bubble ${isOwnMessage ? 'own-message' : ''}" style="display: flex; flex-direction: column; max-width: 90%; align-self: ${isOwnMessage ? 'flex-end' : 'flex-start'};">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.74rem;">
                    <span style="font-weight: 800; color: var(--text-primary);">${escapeHtml(msg.senderName)}</span>
                    <span style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; font-size: 0.7rem;">
                      <span>${badgeIcon}</span> <span>${escapeHtml(msg.senderRole || 'Member')}</span>
                    </span>
                    <span style="color: var(--text-muted); font-size: 0.68rem;">${formatChatTimestamp(msg.createdAt)}</span>
                  </div>

                  <div style="background: ${isOwnMessage ? 'linear-gradient(135deg, var(--teal-primary), var(--teal-deep))' : 'var(--bg-card)'}; color: ${isOwnMessage ? '#FFFFFF' : 'var(--text-primary)'}; padding: 12px 16px; border-radius: 16px; border: 1px solid ${isOwnMessage ? 'transparent' : 'var(--border-color)'}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); word-break: break-word;">
                    ${msg.recipientTag ? `
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; background: ${isOwnMessage ? 'rgba(255,255,255,0.22)' : 'rgba(69,201,189,0.18)'}; color: ${isOwnMessage ? '#FFFFFF' : 'var(--teal-deep)'}; font-weight: 800; font-size: 0.74rem; margin-bottom: 6px;">
                        ${escapeHtml(msg.recipientTag)}
                      </span>
                    ` : ''}
                    <div style="font-size: 0.88rem; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
                  </div>

                  ${(isOwnMessage || authService.isPresident()) ? `
                    <div style="display: flex; justify-content: ${isOwnMessage ? 'flex-end' : 'flex-start'}; margin-top: 2px;">
                      <button type="button" class="ec-chat-del-btn" data-msg-id="${escapeHtml(msg.id)}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.68rem; padding: 2px 6px;" title="Delete message">
                        <i class="fa-regular fa-trash-can"></i> Delete
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Quick @Mention Helper Chips -->
          <div style="padding: 10px 16px; background: var(--bg-card); border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">
              <i class="fa-solid fa-at" style="color: var(--teal-primary);"></i> Mention:
            </span>
            <div style="display: flex; gap: 6px; flex-wrap: nowrap;">
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@President" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(234, 179, 8, 0.14); color: #B45309; border: 1px solid rgba(234, 179, 8, 0.3); cursor: pointer; white-space: nowrap;">
                👑 @President
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@TM-Ajith" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(59, 130, 246, 0.12); color: #1D4ED8; border: 1px solid rgba(59, 130, 246, 0.3); cursor: pointer; white-space: nowrap;">
                🎓 @TM-Ajith
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@VP-Education" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(59, 130, 246, 0.12); color: #1D4ED8; border: 1px solid rgba(59, 130, 246, 0.3); cursor: pointer; white-space: nowrap;">
                📚 @VP-Education
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@VP-Membership" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); cursor: pointer; white-space: nowrap;">
                👥 @VP-Membership
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@VP-PR" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(14, 116, 144, 0.12); color: #0E7490; border: 1px solid rgba(14, 116, 144, 0.3); cursor: pointer; white-space: nowrap;">
                📢 @VP-PR
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@Secretary" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(139, 92, 246, 0.12); color: #6D28D9; border: 1px solid rgba(139, 92, 246, 0.3); cursor: pointer; white-space: nowrap;">
                📝 @Secretary
              </button>
              <button type="button" class="ec-mention-chip btn-sm" data-tag="@Sergeant-at-Arms" style="padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; background: rgba(239, 68, 68, 0.12); color: #B91C1C; border: 1px solid rgba(239, 68, 68, 0.3); cursor: pointer; white-space: nowrap;">
                🛡️ @Sergeant-at-Arms
              </button>
            </div>
          </div>

          <!-- Chat Input Bar -->
          <form id="ec-chat-form" style="padding: 12px 16px; background: var(--bg-card); border-top: 1px solid var(--border-color); display: flex; gap: 10px; align-items: center;">
            <input 
              type="text" 
              id="ec-chat-input" 
              class="form-input" 
              placeholder="${!isLeadership ? 'Type @ to mention an EC officer (e.g. @President hello)...' : 'Reply with @Member or @Officer...'}"
              style="flex: 1; height: 46px; border-radius: 12px; font-size: 0.88rem;"
              autocomplete="off"
              required 
            />
            <button 
              type="submit" 
              id="ec-chat-send-btn" 
              class="btn btn-primary" 
              style="height: 46px; padding: 0 20px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px; flex-shrink: 0;"
            >
              <span>Send</span>
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SECTION 3: OFFICIAL EC ROLE RESPONSIBILITIES & PERMISSIONS MATRIX -->
      <!-- ================================================================= -->
      <section class="connect-section" id="connect-ec-roles-table">
        <div class="section-heading">
          <div>
            <h3><i class="fa-solid fa-table-list" style="color: var(--teal-primary);"></i> EC Role Responsibilities &amp; Permissions</h3>
            <p class="section-note">Consult the assigned powers and responsibilities before contacting leadership.</p>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; border-radius: 18px; border: 1px solid var(--border-color);">
          <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
              <thead>
                <tr style="background: var(--badge-bg); border-bottom: 2px solid var(--border-color);">
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 170px;">Role</th>
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 280px;">Dashboard / Information Access</th>
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 300px;">Permissions / Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #B45309;">
                      <i class="fa-solid fa-crown" style="color: #EAB308;"></i>
                      <span>President</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 1 · Super Admin</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    All club dashboards, attendance, speech progress, membership, meeting reports, EC reports, meeting schedules, agendas, leadership updates, action items
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    View and monitor all club activities, track progress, review reports, manage leadership updates and action items
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #1D4ED8;">
                      <i class="fa-solid fa-graduation-cap" style="color: #3B82F6;"></i>
                      <span>VP-Education</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Education</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Speech progress, meeting agendas, role assignments, attendance
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Track speech completion status, assign meeting roles, monitor attendance and educational progress
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #047857;">
                      <i class="fa-solid fa-users" style="color: #10B981;"></i>
                      <span>VP-Membership</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Membership</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Membership roster, member status, attendance summaries
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Add membership requests, update approved membership status, record informed absences
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #0E7490;">
                      <i class="fa-solid fa-photo-film" style="color: #06B6D4;"></i>
                      <span>VP-Public Relations</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Publicity</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Meeting schedule, media assignments, approved photos/videos, newsletter
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Assign photographers and videographers, upload media, prepare newsletters
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #6D28D9;">
                      <i class="fa-solid fa-pen-fancy" style="color: #8B5CF6;"></i>
                      <span>Secretary</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Records</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Attendance register, meeting records, EC schedules, minutes
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Record attendance, prepare meeting minutes, update meeting records
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #B91C1C;">
                      <i class="fa-solid fa-shield" style="color: #EF4444;"></i>
                      <span>Sergeant-at-Arms</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Logistics</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Meeting setup checklist, property register, equipment status
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Update equipment inventory, manage setup checklists, record opening and closing status
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SECTION 4: EC CONTACT DIRECTORY (PHONE & EMAIL) -->
      <!-- ================================================================= -->
      <section class="connect-section" id="connect-ec-contacts">
        <div class="section-heading">
          <div><h3>EC Contact Directory</h3><p class="section-note">Direct email &amp; phone contacts for each committee officer.</p></div>
        </div>
        <div class="connect-contact-grid">
          ${contacts.map(contact => `
            <article class="connect-contact-card">
              <div class="connect-icon"><i class="fa-solid ${contact.icon}"></i></div>
              <div class="connect-card-title"><h4>${escapeHtml(contact.name)}</h4><p>${escapeHtml(contact.role)}</p></div>
              <div style="display: flex; gap: 6px; margin-top: 10px;">
                <button type="button" class="btn btn-primary btn-sm ec-quick-chat-btn" data-tag="${escapeHtml(contact.tag)}" style="flex: 1;">
                  <i class="fa-solid fa-comments"></i> Chat
                </button>
                ${contact.phone ? `
                  <a class="btn btn-outline btn-sm" href="tel:${escapeHtml(contact.phone)}" title="Call ${escapeHtml(contact.name)}">
                    <i class="fa-solid fa-phone"></i>
                  </a>
                ` : ''}
                <a class="btn btn-outline btn-sm" href="mailto:${escapeHtml(contact.email)}?subject=${encodeURIComponent('PSS Miyapur Gavel Club')}" title="Email ${escapeHtml(contact.name)}">
                  <i class="fa-solid fa-envelope"></i>
                </a>
              </div>
            </article>
          `).join('') || '<div class="connect-empty">EC contact details have not been added yet.</div>'}
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SECTION 5: SUPPORT TICKETS & FAQS -->
      <!-- ================================================================= -->
      <section class="connect-section connect-support-section" id="connect-support">
        <div class="section-heading"><div><h3>Doubts &amp; Support Tickets</h3><p class="section-note">Quick answers and formal requests tracked by the EC.</p></div></div>
        <div class="connect-faq-list">
          <details class="connect-faq"><summary>Where do I join an online meeting?</summary><p>Choose Join Call on the upcoming meeting card at the top of Club Connect.</p></details>
          <details class="connect-faq"><summary>Where can I see my meeting role or agenda?</summary><p>Open Meetings to review roles, then open Agenda to see the planned activities and timings.</p></details>
          <details class="connect-faq"><summary>How do I contact an officer in private?</summary><p>Use the Live Chat with EC section above and start your message with @ mention (e.g. @President or @VP-Membership). Other members cannot see your messages.</p></details>
        </div>

        <div class="support-ticket-layout">
          <form id="connect-ticket-form" class="connect-card connect-support-form">
            <div><h4>Create support ticket</h4><p class="section-note">Raise an official request for the EC to review.</p></div>
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
      </section>
    </div>
  `;
}

function bindClubConnectEvents(currentUser) {
  const user = currentUser || authService.getCurrentUser() || { name: 'Club Member', email: 'member@pssgavelclub.org', role: 'Member', tier: 3 };
  const userIsLeadership = isLeadershipUser(user);

  // Auto-scroll chat feed to bottom on load
  const messagesContainer = document.getElementById('ec-chat-messages-container');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Quick @mention chips handler
  document.querySelectorAll('.ec-mention-chip, .ec-quick-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      const input = document.getElementById('ec-chat-input');
      if (input && tag) {
        if (!input.value.includes(tag)) {
          input.value = `${tag} ${input.value}`.trimStart();
        }
        input.focus();
        document.getElementById('connect-ec-chat-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Chat message submit handler
  const chatForm = document.getElementById('ec-chat-form');
  chatForm?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('ec-chat-input');
    const rawText = input?.value.trim() || '';

    if (!rawText) return;

    // Check for @mention
    const mentionMatch = rawText.match(/@([a-zA-Z0-9_-]+)/);
    const mentionTag = mentionMatch ? `@${mentionMatch[1]}` : null;

    // In Tier 3, messages MUST start with or contain an @mention
    if (!userIsLeadership && !mentionTag) {
      showToast("In Tier 3, messages must start with '@' mentioning the person/role you are addressing (e.g. @President or @VP-Membership).", "warning");
      input?.focus();
      return;
    }

    // Determine target recipient role if matching known tags
    const tagRoleMap = {
      '@president': 'President',
      '@tm-ajith': 'Club Advisor',
      '@vp-education': 'VP Education',
      '@vp-membership': 'VP Membership',
      '@vp-pr': 'VP Public Relations',
      '@secretary': 'Secretary',
      '@sergeant-at-arms': 'Sergeant-at-Arms'
    };
    const targetRole = mentionTag ? tagRoleMap[mentionTag.toLowerCase()] : null;

    dbService.addECChatMessage({
      senderName: user.name || 'Club Member',
      senderEmail: user.email || '',
      senderRole: user.role || 'Member',
      senderTier: user.tier || (userIsLeadership ? 2 : 3),
      recipientTag: mentionTag || '@EC-Team',
      recipientRole: targetRole || '',
      content: rawText
    });

    if (input) input.value = '';
    showToast('Message sent to EC.', 'success');

    // Update messages stream without full reload
    const updatedAll = dbService.getECChatMessages();
    const updatedVisible = filterECChatMessages(updatedAll, user);

    if (messagesContainer) {
      messagesContainer.innerHTML = updatedVisible.map(msg => {
        const isOwn = (user.email && normalizeEmail(msg.senderEmail) === normalizeEmail(user.email)) ||
                      (user.name && msg.senderName === user.name);
        const senderIsTier1 = msg.senderTier === 1 || msg.senderRole === 'President' || msg.senderRole === 'Club Advisor';
        const senderIsTier2 = msg.senderTier === 2 || ['VP Education', 'VP Membership', 'VP Public Relations', 'Secretary', 'Sergeant-at-Arms', 'EC Officer'].includes(msg.senderRole);
        const badgeBg = senderIsTier1 ? 'rgba(234, 179, 8, 0.15)' : senderIsTier2 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        const badgeColor = senderIsTier1 ? '#B45309' : senderIsTier2 ? '#1D4ED8' : '#047857';
        const badgeIcon = senderIsTier1 ? '👑' : senderIsTier2 ? '🛡️' : '👤';

        return `
          <div class="ec-chat-bubble ${isOwn ? 'own-message' : ''}" style="display: flex; flex-direction: column; max-width: 90%; align-self: ${isOwn ? 'flex-end' : 'flex-start'};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.74rem;">
              <span style="font-weight: 800; color: var(--text-primary);">${escapeHtml(msg.senderName)}</span>
              <span style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; font-size: 0.7rem;">
                <span>${badgeIcon}</span> <span>${escapeHtml(msg.senderRole || 'Member')}</span>
              </span>
              <span style="color: var(--text-muted); font-size: 0.68rem;">${formatChatTimestamp(msg.createdAt)}</span>
            </div>

            <div style="background: ${isOwn ? 'linear-gradient(135deg, var(--teal-primary), var(--teal-deep))' : 'var(--bg-card)'}; color: ${isOwn ? '#FFFFFF' : 'var(--text-primary)'}; padding: 12px 16px; border-radius: 16px; border: 1px solid ${isOwn ? 'transparent' : 'var(--border-color)'}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); word-break: break-word;">
              ${msg.recipientTag ? `
                <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; background: ${isOwn ? 'rgba(255,255,255,0.22)' : 'rgba(69,201,189,0.18)'}; color: ${isOwn ? '#FFFFFF' : 'var(--teal-deep)'}; font-weight: 800; font-size: 0.74rem; margin-bottom: 6px;">
                  ${escapeHtml(msg.recipientTag)}
                </span>
              ` : ''}
              <div style="font-size: 0.88rem; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
            </div>

            ${(isOwn || authService.isPresident()) ? `
              <div style="display: flex; justify-content: ${isOwn ? 'flex-end' : 'flex-start'}; margin-top: 2px;">
                <button type="button" class="ec-chat-del-btn" data-msg-id="${escapeHtml(msg.id)}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.68rem; padding: 2px 6px;" title="Delete message">
                  <i class="fa-regular fa-trash-can"></i> Delete
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      bindDeleteButtons();
    }
  });

  function bindDeleteButtons() {
    document.querySelectorAll('.ec-chat-del-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.msgId;
        if (id && confirm('Delete this message?')) {
          dbService.deleteECChatMessage(id);
          showToast('Message deleted.', 'info');
          btn.closest('.ec-chat-bubble')?.remove();
        }
      };
    });
  }
  bindDeleteButtons();

  // Video call form handler
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

  // Support ticket form handler
  document.getElementById('connect-ticket-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const category = document.getElementById('ticket-category')?.value || 'General Help';
    const title = document.getElementById('ticket-title')?.value.trim();
    const description = document.getElementById('ticket-details')?.value.trim();

    if (!title || !description) {
      showToast('Please fill in the ticket title and details.', 'error');
      return;
    }

    dbService.addSupportTicket({
      title,
      category,
      description,
      status: 'Open',
      submittedBy: user.name || 'Club Member'
    });

    showToast('Support ticket created successfully.', 'success');
    window.location.reload();
  });

  // Support ticket status handler
  document.querySelectorAll('.support-ticket-status').forEach(select => {
    select.addEventListener('change', event => {
      const ticketId = event.target.dataset.ticketId;
      const status = event.target.value;
      if (!ticketId || !status) return;
      dbService.updateSupportTicket(ticketId, { status });
      showToast('Ticket status updated.', 'success');
    });
  });
}