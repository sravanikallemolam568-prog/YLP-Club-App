import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { videoService } from '../services/videoService.js';
import { notificationService } from '../services/notificationService.js';
import { showToast } from '../components/Modal.js';

// State for active tab, active conversation, search, pagination, and listeners
let activeTab = 'chat'; // 'chat' | 'meetings' | 'contacts' | 'support'
let activeConversationId = 'general'; // 'general' | 'ec-leadership' | 'dm_...'
let chatSearchQuery = '';
let contactSearchQuery = '';
let messageLimit = 35;
let cleanUpListeners = null;

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
 * Filter messages based on 3-tier privacy boundaries:
 * - Tier 1 & 2 (Leadership): Can see general, ec-leadership, and all direct EC chats.
 * - Tier 3 (Club Members): Can see general chat and ONLY their own 1-on-1 direct conversations.
 *   The ec-leadership chamber and other members' private direct conversations are strictly hidden.
 */
export function filterECChatMessages(messages = [], currentUser) {
  if (!currentUser) return [];

  const isLeader = isLeadershipUser(currentUser);
  const userEmail = normalizeEmail(currentUser.email);
  const userName = (currentUser.name || '').trim().toLowerCase();

  return messages.filter(msg => {
    const convId = msg.conversationId || 'general';

    // 1. General Club Chat: open to everyone
    if (convId === 'general') {
      return true;
    }

    // 2. EC Leadership Chamber: strictly for Tier 1 and Tier 2
    if (convId === 'ec-leadership') {
      return isLeader;
    }

    // 3. Direct 1-on-1 conversations
    if (convId.startsWith('dm_')) {
      if (isLeader) return true; // Leaders oversee EC communications
      const senderEmail = normalizeEmail(msg.senderEmail);
      const recipientEmail = normalizeEmail(msg.recipientEmail);
      const senderName = (msg.senderName || '').trim().toLowerCase();
      const recipientTag = (msg.recipientTag || '').trim().toLowerCase();
      const content = (msg.content || '').toLowerCase();

      const isSender = (userEmail && senderEmail === userEmail) || (userName && senderName === userName);
      const isRecipient = (userEmail && recipientEmail === userEmail) ||
                          (userName && recipientTag.includes(userName)) ||
                          (userName && content.includes(`@${userName}`));

      return isSender || isRecipient;
    }

    return isLeader;
  });
}

function getEcOfficers() {
  const committee = dbService.getECCommittee();
  return [
    { role: 'President', name: committee.president || 'Sravani Kallemolam', email: committee.presidentEmail || 'sravanikallemolam568@gmail.com', phone: committee.presidentPhone || '9014231403', icon: 'fa-crown', tag: '@President', tier: 1, avatarBg: '#FEFCE8', avatarColor: '#CA8A04', desc: 'Overall club oversight, meeting reports, governance & leadership.' },
    { role: committee.master2Role || committee.ajithSirRole || 'Club Advisor & Mentor', name: committee.master2Name || committee.ajithSir || 'TM Ajith', email: committee.master2Email || committee.ajithSirEmail || 'tmajiit@gmail.com', phone: committee.master2Phone || committee.ajithSirPhone || '9391756155', icon: 'fa-user-graduate', tag: '@TM-Ajith', tier: 1, avatarBg: '#EFF6FF', avatarColor: '#2563EB', desc: 'Educational guidance, mentor assignments & speech quality review.' },
    { role: 'VP Education', name: committee.vpEducation || 'VP Education', email: committee.vpEducationEmail || 'vpeducation@pssgavelclub.org', phone: committee.vpEducationPhone || '9876543212', icon: 'fa-graduation-cap', tag: '@VP-Education', tier: 2, avatarBg: '#EFF6FF', avatarColor: '#2563EB', desc: 'Meeting agendas, speech tracking, role allocations & evaluations.' },
    { role: 'VP Membership', name: committee.vpMembership || 'VP Membership', email: committee.vpMembershipEmail || 'vpmembership@pssgavelclub.org', phone: committee.vpMembershipPhone || '9876543213', icon: 'fa-users', tag: '@VP-Membership', tier: 2, avatarBg: '#F0FDF4', avatarColor: '#16A34A', desc: 'Member enrollment, guest relations, attendance summaries & inductions.' },
    { role: 'VP Public Relations', name: committee.vpPR || 'VP Public Relations', email: committee.vpPREmail || 'vppr@pssgavelclub.org', phone: committee.vpPRPhone || '9876543214', icon: 'fa-photo-film', tag: '@VP-PR', tier: 2, avatarBg: '#FEFCE8', avatarColor: '#CA8A04', desc: 'Social media, flyers, meeting photography, video recording & newsletters.' },
    { role: 'Secretary', name: committee.secretary || 'Secretary', email: committee.secretaryEmail || 'secretary@pssgavelclub.org', phone: committee.secretaryPhone || '9876543215', icon: 'fa-pen-fancy', tag: '@Secretary', tier: 2, avatarBg: '#EFF6FF', avatarColor: '#2563EB', desc: 'Meeting minutes, attendance records, official correspondence & rosters.' },
    { role: 'Sergeant-at-Arms', name: committee.sergeant || 'Sergeant-at-Arms', email: committee.sergeantEmail || 'sergeant@pssgavelclub.org', phone: committee.sergeantPhone || '9876543216', icon: 'fa-shield', tag: '@Sergeant-at-Arms', tier: 2, avatarBg: '#F0FDF4', avatarColor: '#16A34A', desc: 'Meeting room setup, equipment logistics, online call preparation & timing flags.' }
  ].filter(c => c.name && (c.email || c.phone));
}

function getConversationIdForDM(userAEmail, userBEmail) {
  const cleanA = normalizeEmail(userAEmail) || 'user1';
  const cleanB = normalizeEmail(userBEmail) || 'user2';
  return cleanA < cleanB ? `dm_${cleanA}_${cleanB}` : `dm_${cleanB}_${cleanA}`;
}

function formatChatTimestamp(isoDateStr) {
  try {
    const date = new Date(isoDateStr);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Main View Renderer
 */
export function renderClubConnectView(branchFilter = 'All') {
  const currentUser = authService.getCurrentUser() || { name: 'Club Member', email: 'member@pssgavelclub.org', role: 'Member', tier: 3 };
  const isLeader = isLeadershipUser(currentUser);
  const officers = getEcOfficers();
  const allMessages = dbService.getECChatMessages();
  const visibleMessages = filterECChatMessages(allMessages, currentUser);

  const meetings = dbService.getMeetings()
    .filter(m => m.status === 'Upcoming')
    .filter(m => branchFilter === 'All' || m.branch === branchFilter)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const supportTickets = dbService.getSupportTickets()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Determine unread message counts
  const unreadCountGeneral = computeUnreadCount('general', currentUser, visibleMessages);
  const unreadCountLeadership = computeUnreadCount('ec-leadership', currentUser, visibleMessages);
  const totalUnread = unreadCountGeneral + (isLeader ? unreadCountLeadership : 0);

  // Set timeout to bind all reactive events
  setTimeout(() => {
    bindClubConnectController(currentUser, branchFilter);
  }, 40);

  return `
    <div class="animate-fade-in cc-container" id="club-connect-root">
      
      <!-- Top Branding & Status Header -->
      <header class="cc-header">
        <div class="cc-header-title">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #EFF6FF; color: #2563EB; display: grid; place-items: center; font-size: 1.3rem;">
            <i class="fa-solid fa-comments"></i>
          </div>
          <div>
            <h2>Club Connect</h2>
            <p>Unified communication, live EC messaging, in-app video calls, and officer directory.</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge ${isLeader ? 'badge-gold' : 'badge-info'}" style="font-weight: 700; font-size: 0.78rem;">
            ${isLeader ? '🛡️ EC Leadership Access' : '👤 Club Member Access'}
          </span>
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #16A34A; font-weight: 700; background: #F0FDF4; padding: 4px 10px; border-radius: 999px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #16A34A;"></span> Live Sync
          </span>
        </div>
      </header>

      <!-- Primary 4-Tab Navigation Bar -->
      <nav class="cc-tab-bar" aria-label="Club Connect Navigation">
        <button type="button" class="cc-nav-tab ${activeTab === 'chat' ? 'active' : ''}" data-target-tab="chat">
          <i class="fa-solid fa-paper-plane"></i>
          <span>Chat</span>
          ${totalUnread > 0 ? `<span class="cc-tab-badge">${totalUnread}</span>` : ''}
        </button>
        <button type="button" class="cc-nav-tab ${activeTab === 'meetings' ? 'active' : ''}" data-target-tab="meetings">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Meetings</span>
          ${meetings.length > 0 ? `<span class="badge" style="background: #EFF6FF; color: #2563EB; font-size: 0.72rem; padding: 2px 7px;">${meetings.length}</span>` : ''}
        </button>
        <button type="button" class="cc-nav-tab ${activeTab === 'contacts' ? 'active' : ''}" data-target-tab="contacts">
          <i class="fa-solid fa-address-book"></i>
          <span>EC Contacts</span>
          <span class="badge" style="background: #F0FDF4; color: #16A34A; font-size: 0.72rem; padding: 2px 7px;">${officers.length}</span>
        </button>
        <button type="button" class="cc-nav-tab ${activeTab === 'support' ? 'active' : ''}" data-target-tab="support">
          <i class="fa-solid fa-circle-question"></i>
          <span>Support &amp; Handbook</span>
        </button>
      </nav>

      <!-- TAB CONTENT PANELS -->

      <!-- 1. CHAT TAB (DEFAULT SCREEN) -->
      <section id="cc-tab-chat" class="cc-tab-panel" style="${activeTab === 'chat' ? '' : 'display: none;'}">
        <div class="cc-chat-layout" id="cc-chat-layout-container">
          
          <!-- LEFT SIDEBAR: CONVERSATIONS LIST -->
          <aside class="cc-sidebar">
            <div class="cc-sidebar-search">
              <i class="fa-solid fa-magnifying-glass cc-search-icon"></i>
              <input type="text" id="cc-chat-search" class="cc-search-input" placeholder="Search conversations or officers..." value="${escapeHtml(chatSearchQuery)}" />
            </div>

            <div class="cc-conversations-list" id="cc-conversations-list">
              <!-- Rendered via renderConversationsList() -->
            </div>
          </aside>

          <!-- RIGHT CHAT PANE: ACTIVE CONVERSATION -->
          <main class="cc-chat-pane" id="cc-chat-pane">
            <!-- Rendered via renderActiveChatPane() -->
          </main>

        </div>
      </section>

      <!-- 2. MEETINGS TAB -->
      <section id="cc-tab-meetings" class="cc-tab-panel" style="${activeTab === 'meetings' ? '' : 'display: none;'}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0;">Club Meetings &amp; Video Sessions</h3>
            <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 2px 0 0;">Launch in-app video calls or join online sessions directly.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="cc-quick-call-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 7px;">
              <i class="fa-solid fa-video"></i> Start In-App Call
            </button>
            <a href="#agenda" class="btn btn-outline" style="display: flex; align-items: center; gap: 7px;">
              <i class="fa-solid fa-list-check"></i> Agenda
            </a>
          </div>
        </div>

        <div class="connect-card-list" id="cc-meetings-list">
          ${renderMeetingsListHtml(meetings, authService.canStartVideoCall())}
        </div>
      </section>

      <!-- 3. EC CONTACTS DIRECTORY TAB -->
      <section id="cc-tab-contacts" class="cc-tab-panel" style="${activeTab === 'contacts' ? '' : 'display: none;'}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0;">Executive Committee Directory</h3>
            <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 2px 0 0;">Direct communication channels and roles of elected club officers.</p>
          </div>
          <div style="position: relative; width: 260px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.8rem;"></i>
            <input type="text" id="cc-contacts-search" class="form-input" style="padding-left: 32px; height: 38px; border-radius: 10px; font-size: 0.84rem;" placeholder="Search officer or role..." value="${escapeHtml(contactSearchQuery)}" />
          </div>
        </div>

        <div class="connect-contact-grid" id="cc-contacts-grid">
          ${renderContactsGridHtml(officers, contactSearchQuery)}
        </div>
      </section>

      <!-- 4. SUPPORT & ROLE HANDBOOK TAB -->
      <section id="cc-tab-support" class="cc-tab-panel" style="${activeTab === 'support' ? '' : 'display: none;'}">
        
        <!-- Support Navigation Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 6px;">
          <button type="button" class="btn-sm cc-support-subtab-btn active" data-subtab="tickets" style="font-weight: 700; border: none; background: none; color: #2563EB; border-bottom: 3px solid #2563EB; padding: 8px 14px; cursor: pointer;">
            <i class="fa-solid fa-ticket"></i> Support Tickets (${supportTickets.length})
          </button>
          <button type="button" class="btn-sm cc-support-subtab-btn" data-subtab="faq" style="font-weight: 700; border: none; background: none; color: var(--text-secondary); padding: 8px 14px; cursor: pointer;">
            <i class="fa-solid fa-circle-question"></i> FAQs
          </button>
          <button type="button" class="btn-sm cc-support-subtab-btn" data-subtab="handbook" style="font-weight: 700; border: none; background: none; color: var(--text-secondary); padding: 8px 14px; cursor: pointer;">
            <i class="fa-solid fa-table-list"></i> Role Handbook &amp; Permissions
          </button>
        </div>

        <!-- Subtab 1: Support Tickets -->
        <div id="cc-subtab-tickets" class="cc-support-subtab-content">
          <div class="support-ticket-layout">
            <form id="cc-ticket-form" class="connect-card connect-support-form">
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">Raise Support Ticket</h4>
                <p class="section-note">Submit an official question or request for the EC to review.</p>
              </div>
              <label>
                <span>Category</span>
                <select id="cc-ticket-category" class="form-select">
                  <option value="Meeting Access">Meeting Access</option>
                  <option value="Mentoring">Mentoring</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Event Query">Event Query</option>
                  <option value="General Help">General Help</option>
                </select>
              </label>
              <label>
                <span>Title</span>
                <input id="cc-ticket-title" class="form-input" maxlength="100" placeholder="Brief summary of your query" required />
              </label>
              <label>
                <span>Details</span>
                <textarea id="cc-ticket-details" class="form-input" rows="4" maxlength="1200" placeholder="Describe what you need assistance with..." required></textarea>
              </label>
              <div class="support-ticket-form-footer">
                <button class="btn btn-primary" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit Ticket</button>
                <span class="support-ticket-user">Submitted by: <strong>${escapeHtml(currentUser.name || 'Member')}</strong></span>
              </div>
            </form>

            <div class="connect-card support-ticket-panel">
              <div class="support-ticket-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">Recent Tickets</h4>
                  <p class="section-note" style="margin: 2px 0 0;">Live tracking of club inquiries.</p>
                </div>
                <span class="badge badge-info" style="font-weight: 800;">${supportTickets.length} total</span>
              </div>
              <div class="support-ticket-list" id="cc-support-ticket-list" style="max-height: 480px; overflow-y: auto;">
                ${renderSupportTicketsHtml(supportTickets, currentUser, isLeader)}
              </div>
            </div>
          </div>
        </div>

        <!-- Subtab 2: FAQs -->
        <div id="cc-subtab-faq" class="cc-support-subtab-content" style="display: none;">
          <div class="connect-faq-list">
            <details class="connect-faq" open>
              <summary><i class="fa-solid fa-video" style="color: #2563EB; margin-right: 6px;"></i> How do I join the live club video call?</summary>
              <p>You can join directly inside Club Connect! Switch to the <strong>Meetings</strong> tab or click <strong>Start / Join In-App Call</strong> inside the Chat tab. No external Zoom or Google Meet app installation is needed.</p>
            </details>
            <details class="connect-faq">
              <summary><i class="fa-solid fa-lock" style="color: #16A34A; margin-right: 6px;"></i> Who can see my chat messages?</summary>
              <p>In <strong>General Club Discussion</strong>, all members can participate. In direct <strong>EC Officer 1-on-1 chats</strong>, only you and the club leadership team have access. Other club members cannot see your private messages.</p>
            </details>
            <details class="connect-faq">
              <summary><i class="fa-solid fa-calendar-check" style="color: #2563EB; margin-right: 6px;"></i> Where can I view my scheduled speech or meeting role?</summary>
              <p>Navigate to <strong>Meetings</strong> or <strong>Agenda</strong> in the main navigation bar. The agenda lists the complete schedule, speakers, evaluators, and timer roles.</p>
            </details>
            <details class="connect-faq">
              <summary><i class="fa-solid fa-crown" style="color: #EAB308; margin-right: 6px;"></i> Who has authority to start in-app video calls?</summary>
              <p>Video call sessions can be started by <strong>Tier 1 (President &amp; Club Advisor)</strong> and <strong>Tier 2 (EC Officers)</strong>. All club members (Tier 3) can join active calls at any time.</p>
            </details>
          </div>
        </div>

        <!-- Subtab 3: Role Handbook & Permissions Matrix -->
        <div id="cc-subtab-handbook" class="cc-support-subtab-content" style="display: none;">
          ${renderRoleHandbookTableHtml()}
        </div>

      </section>

      <!-- IN-APP VIDEO CALLING MODAL OVERLAY -->
      <div id="cc-video-overlay" class="cc-video-overlay" style="display: none;">
        <div class="cc-video-box">
          <div class="cc-video-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #16A34A; animation: pulse 1.5s infinite;"></span>
              <div>
                <strong id="cc-video-room-title" style="font-size: 0.95rem;">PSS Gavel Club Live Room</strong>
                <div style="font-size: 0.72rem; color: #94A3B8;">WebRTC In-App Video Call</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" id="cc-video-leave-btn" class="btn btn-sm" style="background: #854D0E; color: #FFFFFF; font-weight: 700; border: none; border-radius: 8px; padding: 6px 14px;">
                <i class="fa-solid fa-phone-slash"></i> Leave Call
              </button>
            </div>
          </div>
          <div id="cc-video-stage-container" class="cc-video-stage">
            <!-- Jitsi Meet WebRTC IFrame is mounted here dynamically -->
          </div>
        </div>
      </div>

    </div>
  `;
}

function computeUnreadCount(conversationId, user, allMessages) {
  if (!user || !user.email) return 0;
  const lastRead = notificationService.getLastRead(conversationId, user.email);
  const cutoff = lastRead ? new Date(lastRead) : new Date(0);
  const userEmail = normalizeEmail(user.email);

  return allMessages.filter(m => {
    if ((m.conversationId || 'general') !== conversationId) return false;
    if (normalizeEmail(m.senderEmail) === userEmail) return false;
    return new Date(m.createdAt || 0) > cutoff;
  }).length;
}

/**
 * Renders the left sidebar list of conversations (General, Leadership Chamber, and 1-on-1s)
 */
function renderConversationsList(currentUser) {
  const isLeader = isLeadershipUser(currentUser);
  const userEmail = normalizeEmail(currentUser.email);
  const officers = getEcOfficers();
  const allMessages = dbService.getECChatMessages();
  const visibleMessages = filterECChatMessages(allMessages, currentUser);

  // Channels section
  const channels = [
    {
      id: 'general',
      name: 'General Club Discussion',
      subtitle: 'Open discussion with all members & EC',
      icon: 'fa-comments',
      iconBg: 'rgba(13, 148, 136, 0.15)',
      iconColor: '#2563EB',
      isChannel: true
    }
  ];

  if (isLeader) {
    channels.push({
      id: 'ec-leadership',
      name: 'EC Executive Chamber',
      subtitle: 'Supervisory leadership channel (Tier 1 & 2)',
      icon: 'fa-shield-halved',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#1D4ED8',
      isChannel: true,
      badge: '👑 Leadership'
    });
  }

  // Filter conversations by search term
  const query = chatSearchQuery.trim().toLowerCase();
  const filteredChannels = channels.filter(ch => !query || ch.name.toLowerCase().includes(query) || ch.subtitle.toLowerCase().includes(query));

  // Direct 1-on-1 conversations with officers
  const directConvs = officers.map(officer => {
    const dmId = getConversationIdForDM(userEmail, officer.email);
    const dmMessages = visibleMessages.filter(m => m.conversationId === dmId);
    const lastMsg = dmMessages[dmMessages.length - 1];

    return {
      id: dmId,
      name: officer.name,
      role: officer.role,
      officer,
      lastMsg,
      unreadCount: computeUnreadCount(dmId, currentUser, visibleMessages)
    };
  }).filter(dm => !query || dm.name.toLowerCase().includes(query) || dm.role.toLowerCase().includes(query));

  let html = `
    <div class="cc-conv-group-title">Channels</div>
  `;

  filteredChannels.forEach(ch => {
    const chMessages = visibleMessages.filter(m => (m.conversationId || 'general') === ch.id);
    const lastMsg = chMessages[chMessages.length - 1];
    const unread = computeUnreadCount(ch.id, currentUser, visibleMessages);
    const isActive = activeConversationId === ch.id;

    html += `
      <div class="cc-conv-item ${isActive ? 'active' : ''}" data-conv-id="${escapeHtml(ch.id)}">
        <div class="cc-conv-avatar" style="background: ${ch.iconBg}; color: ${ch.iconColor};">
          <i class="fa-solid ${ch.icon}"></i>
        </div>
        <div class="cc-conv-meta">
          <div class="cc-conv-top">
            <span class="cc-conv-name">${escapeHtml(ch.name)}</span>
            <span class="cc-conv-time">${lastMsg ? formatChatTimestamp(lastMsg.createdAt) : ''}</span>
          </div>
          <div class="cc-conv-bottom">
            <span class="cc-conv-snippet">${lastMsg ? `${escapeHtml(lastMsg.senderName)}: ${escapeHtml(lastMsg.content)}` : escapeHtml(ch.subtitle)}</span>
            ${unread > 0 ? `<span class="cc-unread-badge">${unread}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += `<div class="cc-conv-group-title" style="margin-top: 14px;">Direct with EC Officers</div>`;

  directConvs.forEach(dm => {
    const isActive = activeConversationId === dm.id;
    html += `
      <div class="cc-conv-item ${isActive ? 'active' : ''}" data-conv-id="${escapeHtml(dm.id)}" data-recipient-email="${escapeHtml(dm.officer.email)}" data-recipient-tag="${escapeHtml(dm.officer.tag)}" data-recipient-name="${escapeHtml(dm.officer.name)}">
        <div class="cc-conv-avatar" style="background: ${dm.officer.avatarBg}; color: ${dm.officer.avatarColor};">
          <i class="fa-solid ${dm.officer.icon}"></i>
        </div>
        <div class="cc-conv-meta">
          <div class="cc-conv-top">
            <span class="cc-conv-name">${escapeHtml(dm.name)}</span>
            <span class="cc-conv-time">${dm.lastMsg ? formatChatTimestamp(dm.lastMsg.createdAt) : ''}</span>
          </div>
          <div class="cc-conv-bottom">
            <span class="cc-conv-snippet">${dm.lastMsg ? escapeHtml(dm.lastMsg.content) : escapeHtml(dm.role)}</span>
            ${dm.unreadCount > 0 ? `<span class="cc-unread-badge">${dm.unreadCount}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Renders the active chat window (header, messages stream, mention chips, and input)
 */
function renderActiveChatPane(currentUser) {
  const isLeader = isLeadershipUser(currentUser);
  const officers = getEcOfficers();
  const allMessages = dbService.getECChatMessages();
  const visibleMessages = filterECChatMessages(allMessages, currentUser);

  // Mark conversation read
  notificationService.markConversationRead(activeConversationId, currentUser.email);

  // Identify conversation details
  let title = 'General Club Discussion';
  let subtitle = 'All club members and leadership';
  let icon = 'fa-comments';
  let isLeadershipRoom = false;
  let targetTag = '';

  if (activeConversationId === 'ec-leadership') {
    title = 'EC Executive Chamber';
    subtitle = 'Tier 1 & Tier 2 Officers Leadership Forum';
    icon = 'fa-shield-halved';
    isLeadershipRoom = true;
  } else if (activeConversationId.startsWith('dm_')) {
    const matchedOfficer = officers.find(o => activeConversationId.includes(normalizeEmail(o.email)));
    if (matchedOfficer) {
      title = `${matchedOfficer.name} (${matchedOfficer.role})`;
      subtitle = `Confidential direct message channel with ${matchedOfficer.role}`;
      icon = matchedOfficer.icon;
      targetTag = matchedOfficer.tag;
    } else {
      title = 'Direct Conversation';
      subtitle = 'Private 1-on-1 channel';
      icon = 'fa-user';
    }
  }

  // Get messages for current conversation
  const convMessages = visibleMessages.filter(m => (m.conversationId || 'general') === activeConversationId);
  const totalCount = convMessages.length;
  const displayedMessages = convMessages.slice(Math.max(0, totalCount - messageLimit));
  const hasMore = totalCount > messageLimit;

  return `
    <!-- Chat Header -->
    <div class="cc-chat-header">
      <div class="cc-chat-header-info">
        <button type="button" class="cc-chat-back-btn" id="cc-mobile-back-btn" aria-label="Back to conversations">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div style="width: 38px; height: 38px; border-radius: 12px; background: #EFF6FF; color: #2563EB; display: grid; place-items: center; font-size: 1rem; flex-shrink: 0;">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div class="cc-chat-header-details">
          <h3>
            <span>${escapeHtml(title)}</span>
            ${isLeadershipRoom ? '<span class="badge badge-gold" style="font-size: 0.68rem; padding: 2px 7px;">EC Only</span>' : ''}
          </h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
      </div>
      <div class="cc-chat-actions">
        <button type="button" id="cc-start-room-call-btn" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px; font-weight: 700;">
          <i class="fa-solid fa-video"></i>
          <span class="desktop-only">Video Call</span>
        </button>
      </div>
    </div>

    <!-- Messages Scroll Container -->
    <div class="cc-messages-scroll" id="cc-messages-container">
      ${hasMore ? `
        <button type="button" class="cc-load-earlier-btn" id="cc-load-earlier-btn">
          <i class="fa-solid fa-clock-rotate-left"></i> Load earlier messages (${totalCount - messageLimit} more)
        </button>
      ` : ''}

      ${displayedMessages.length === 0 ? `
        <div style="text-align: center; margin: auto; padding: 40px 16px; color: var(--text-muted);">
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #EFF6FF; color: #2563EB; display: grid; place-items: center; font-size: 1.5rem; margin: 0 auto 12px;">
            <i class="fa-regular fa-comment-dots"></i>
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.96rem;">No messages in this conversation yet</div>
          <p style="margin: 4px 0 0; font-size: 0.82rem;">Start the conversation below.</p>
        </div>
      ` : displayedMessages.map(msg => renderMessageBubbleHtml(msg, currentUser)).join('')}
    </div>

    <!-- Quick Mentions Chips Bar -->
    <div class="cc-mention-chips-bar" aria-label="Quick Mentions">
      <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
        <i class="fa-solid fa-at" style="color: #2563EB;"></i> Mention:
      </span>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@President">👑 @President</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@TM-Ajith">🎓 @TM-Ajith</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@VP-Education">📚 @VP-Education</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@VP-Membership">👥 @VP-Membership</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@VP-PR">📢 @VP-PR</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@Secretary">📝 @Secretary</button>
      <button type="button" class="cc-chip cc-mention-chip" data-tag="@Sergeant-at-Arms">🛡️ @Sergeant-at-Arms</button>
    </div>

    <!-- Message Input Bar -->
    <form id="cc-chat-form" class="cc-input-bar">
      <input 
        type="text" 
        id="cc-chat-input" 
        class="cc-input-field" 
        placeholder="${!isLeader && activeConversationId === 'general' ? 'Type @ to mention an officer (e.g. @President hello)...' : (targetTag ? `${targetTag} Type your message...` : 'Type a message...')}" 
        autocomplete="off"
        required 
      />
      <button type="submit" id="cc-send-btn" class="cc-send-btn" aria-label="Send message">
        <span>Send</span>
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </form>
  `;
}

function renderMessageBubbleHtml(msg, currentUser) {
  const isOwn = (currentUser.email && normalizeEmail(msg.senderEmail) === normalizeEmail(currentUser.email)) ||
                (currentUser.name && msg.senderName === currentUser.name);

  const senderIsTier1 = msg.senderTier === 1 || msg.senderRole === 'President' || msg.senderRole === 'Club Advisor';
  const senderIsTier2 = msg.senderTier === 2 || ['VP Education', 'VP Membership', 'VP Public Relations', 'Secretary', 'Sergeant-at-Arms', 'EC Officer'].includes(msg.senderRole);

  const badgeBg = senderIsTier1 ? 'rgba(234, 179, 8, 0.16)' : senderIsTier2 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  const badgeColor = senderIsTier1 ? '#B45309' : senderIsTier2 ? '#1D4ED8' : '#047857';
  const badgeIcon = senderIsTier1 ? '👑' : senderIsTier2 ? '🛡️' : '👤';

  const status = msg.status || 'sent';

  return `
    <div class="cc-bubble-wrapper ${isOwn ? 'own' : 'incoming'}" data-msg-id="${escapeHtml(msg.id)}">
      <div class="cc-msg-meta">
        <span style="font-weight: 800; color: var(--text-primary);">${escapeHtml(msg.senderName)}</span>
        <span style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; font-size: 0.68rem;">
          <span>${badgeIcon}</span> <span>${escapeHtml(msg.senderRole || 'Member')}</span>
        </span>
        <span style="color: var(--text-muted); font-size: 0.68rem;">${formatChatTimestamp(msg.createdAt)}</span>
      </div>

      <div class="cc-msg-bubble">
        ${msg.recipientTag ? `
          <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; background: ${isOwn ? 'rgba(255,255,255,0.24)' : 'rgba(13, 148, 136, 0.15)'}; color: ${isOwn ? '#FFFFFF' : 'var(--teal-deep, #0F766E)'}; font-weight: 800; font-size: 0.74rem; margin-bottom: 5px;">
            ${escapeHtml(msg.recipientTag)}
          </span>
        ` : ''}
        <div style="font-size: 0.88rem; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
      </div>

      <div class="cc-msg-footer">
        ${isOwn ? `
          ${status === 'sending' ? `
            <span class="cc-status-icon" title="Sending..."><i class="fa-solid fa-clock"></i></span>
          ` : status === 'failed' ? `
            <span class="cc-status-icon" style="color: #854D0E;" title="Failed to deliver"><i class="fa-solid fa-triangle-exclamation"></i></span>
            <button type="button" class="cc-retry-btn" data-retry-id="${escapeHtml(msg.id)}">Retry</button>
          ` : `
            <span class="cc-status-icon" title="Delivered"><i class="fa-solid fa-check"></i></span>
          `}
          ${(isOwn || authService.isPresident()) ? `
            <button type="button" class="cc-msg-del-btn" data-del-id="${escapeHtml(msg.id)}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.68rem; margin-left: 6px; padding: 0;" title="Delete message">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : ''}
        ` : ''}
      </div>
    </div>
  `;
}

function renderMeetingsListHtml(meetings = [], canStartCall = false) {
  if (meetings.length === 0) {
    return `
      <div class="connect-empty">
        <i class="fa-regular fa-calendar"></i>
        <h4>No upcoming meetings</h4>
        <p>Scheduled online sessions will appear here with instant join links.</p>
      </div>
    `;
  }

  return meetings.map(meeting => {
    const safeLink = safeHttpUrl(meeting.videoLink);
    return `
      <article class="connect-meeting-card" data-meeting-id="${escapeHtml(meeting.id)}">
        <div class="connect-meeting-main">
          <div class="connect-feature-icon" style="background: #EFF6FF; color: #2563EB;">
            <i class="fa-solid fa-video"></i>
          </div>
          <div class="connect-card-title">
            <span class="connect-meeting-label">Upcoming Club Session</span>
            <h4>${escapeHtml(meeting.date)} · ${escapeHtml(meeting.branch)}</h4>
            <p>${escapeHtml(meeting.startTime)} ${meeting.description ? `— ${escapeHtml(meeting.description)}` : ''}</p>
          </div>
        </div>

        <div class="connect-meeting-platform">
          <span>Platform</span>
          <strong>${escapeHtml(meeting.videoPlatform || 'In-App WebRTC')}</strong>
        </div>

        <div class="connect-meeting-actions" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <button type="button" class="btn btn-primary cc-join-meeting-call-btn" data-room-id="${escapeHtml(meeting.id)}">
            <i class="fa-solid fa-video"></i> Join In-App Call
          </button>
          ${safeLink ? `
            <a class="btn btn-outline" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer" title="Open external meeting link">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> External Link
            </a>
          ` : ''}
        </div>

        ${canStartCall ? `
          <details class="connect-meeting-settings" style="margin-top: 10px;">
            <summary style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); cursor: pointer;">
              <i class="fa-solid fa-gear"></i> Meeting Call Settings (Tier 1 &amp; Tier 2 Authority)
            </summary>
            <form class="connect-link-form cc-meeting-config-form" data-meeting-id="${escapeHtml(meeting.id)}" style="margin-top: 10px;">
              <label>
                <span>Meeting Platform</span>
                <select class="form-select cc-meeting-platform" aria-label="Meeting Platform">
                  <option value="In-App WebRTC" ${meeting.videoPlatform === 'In-App WebRTC' || !meeting.videoPlatform ? 'selected' : ''}>In-App WebRTC</option>
                  <option value="Google Meet" ${meeting.videoPlatform === 'Google Meet' ? 'selected' : ''}>Google Meet</option>
                  <option value="Zoom" ${meeting.videoPlatform === 'Zoom' ? 'selected' : ''}>Zoom</option>
                  <option value="Microsoft Teams" ${meeting.videoPlatform === 'Microsoft Teams' ? 'selected' : ''}>Microsoft Teams</option>
                </select>
              </label>
              <label class="connect-link-field">
                <span>External Link (Optional)</span>
                <input class="form-input cc-meeting-link" type="url" value="${escapeHtml(meeting.videoLink || '')}" placeholder="https://meet.google.com/..." />
              </label>
              <button class="btn btn-primary" type="submit"><i class="fa-solid fa-check"></i> Save Settings</button>
            </form>
          </details>
        ` : ''}
      </article>
    `;
  }).join('');
}

function renderContactsGridHtml(officers = [], searchQuery = '') {
  const query = searchQuery.trim().toLowerCase();
  const filtered = officers.filter(o => !query || o.name.toLowerCase().includes(query) || o.role.toLowerCase().includes(query));

  if (filtered.length === 0) {
    return `<div class="connect-empty" style="grid-column: 1 / -1;">No officers match your search term.</div>`;
  }

  return filtered.map(contact => `
    <article class="connect-contact-card" style="padding: 16px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; align-items: stretch; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="connect-icon" style="background: ${contact.avatarBg}; color: ${contact.avatarColor}; width: 44px; height: 44px; font-size: 1.1rem; border-radius: 12px; display: grid; place-items: center;">
          <i class="fa-solid ${contact.icon}"></i>
        </div>
        <div class="connect-card-title">
          <div style="display: flex; align-items: center; gap: 6px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; margin: 0; color: var(--text-primary);">${escapeHtml(contact.name)}</h4>
            <span class="badge ${contact.tier === 1 ? 'badge-gold' : 'badge-info'}" style="font-size: 0.66rem; padding: 2px 6px;">Tier ${contact.tier}</span>
          </div>
          <p style="margin: 2px 0 0; color: #2563EB; font-weight: 700; font-size: 0.78rem;">${escapeHtml(contact.role)}</p>
        </div>
      </div>

      <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">${escapeHtml(contact.desc || '')}</p>

      <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border-color);">
        <button type="button" class="btn btn-primary btn-sm cc-contact-message-btn" data-officer-email="${escapeHtml(contact.email)}" data-officer-tag="${escapeHtml(contact.tag)}" data-officer-name="${escapeHtml(contact.name)}" style="flex: 1; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="fa-solid fa-paper-plane"></i> Message
        </button>
        ${contact.phone ? `
          <a class="btn btn-outline btn-sm" href="tel:${escapeHtml(contact.phone)}" title="Call ${escapeHtml(contact.name)}" style="padding: 6px 12px;">
            <i class="fa-solid fa-phone"></i>
          </a>
        ` : ''}
        <a class="btn btn-outline btn-sm" href="mailto:${escapeHtml(contact.email)}?subject=${encodeURIComponent('PSS Miyapur Gavel Club')}" title="Email ${escapeHtml(contact.name)}" style="padding: 6px 12px;">
          <i class="fa-solid fa-envelope"></i>
        </a>
      </div>
    </article>
  `).join('');
}

function renderSupportTicketsHtml(tickets = [], currentUser, isLeader) {
  if (tickets.length === 0) {
    return `
      <div class="connect-empty">
        <i class="fa-regular fa-clipboard"></i>
        <h4>No tickets yet</h4>
        <p>Support inquiries created by members will appear here.</p>
      </div>
    `;
  }

  return tickets.map(ticket => `
    <article class="support-ticket-item" data-ticket-id="${escapeHtml(ticket.id)}" style="padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 8px; background: var(--bg-main);">
      <div class="support-ticket-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div>
          <h5 style="margin: 0; font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(ticket.title)}</h5>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">${escapeHtml(ticket.category)}</span>
        </div>
        <span class="support-status status-${escapeHtml(ticket.status).toLowerCase().replace(/\s+/g, '-')}" style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
          ${escapeHtml(ticket.status)}
        </span>
      </div>
      <p class="support-ticket-description" style="margin: 6px 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(ticket.description)}</p>
      <div class="support-ticket-meta" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">
        <span>By ${escapeHtml(ticket.submittedBy || 'Member')}</span>
        <span>${new Date(ticket.createdAt).toLocaleDateString()}</span>
      </div>
      ${isLeader ? `
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
          <select class="form-select cc-support-status-select" data-ticket-id="${escapeHtml(ticket.id)}" style="font-size: 0.74rem; height: 30px; width: 130px; padding: 2px 8px;">
            <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
            <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
      ` : ''}
    </article>
  `).join('');
}

function renderRoleHandbookTableHtml() {
  return `
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
                Full executive control: View and monitor all club activities, track progress, review reports, manage leadership updates and action items
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
                  <i class="fa-solid fa-users" style="color: #16A34A;"></i>
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
                <div style="display: flex; align-items: center; gap: 7px; color: #854D0E;">
                  <i class="fa-solid fa-photo-film" style="color: #FACC15;"></i>
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
                <div style="display: flex; align-items: center; gap: 7px; color: #1E3A8A;">
                  <i class="fa-solid fa-pen-fancy" style="color: #2563EB;"></i>
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
                <div style="display: flex; align-items: center; gap: 7px; color: #854D0E;">
                  <i class="fa-solid fa-shield" style="color: #FACC15;"></i>
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
  `;
}

/**
 * Controller: Binds tab events, real-time subscriptions, chat input, video calling, and tickets
 */
function bindClubConnectController(currentUser, branchFilter) {
  // Clean up any previous listeners
  if (typeof cleanUpListeners === 'function') {
    cleanUpListeners();
  }

  const isLeader = isLeadershipUser(currentUser);
  notificationService.requestPermission().catch(() => {});

  // 1. Initial render of conversations and active chat
  renderChatViewComponents(currentUser);

  // 2. Tab Navigation clicks
  document.querySelectorAll('.cc-nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const target = tabBtn.dataset.targetTab;
      if (!target || target === activeTab) return;

      activeTab = target;
      document.querySelectorAll('.cc-nav-tab').forEach(b => b.classList.toggle('active', b.dataset.targetTab === activeTab));
      document.querySelectorAll('.cc-tab-panel').forEach(panel => {
        panel.style.display = panel.id === `cc-tab-${activeTab}` ? '' : 'none';
      });

      if (activeTab === 'chat') {
        renderChatViewComponents(currentUser);
      }
    });
  });

  // 3. Support subtabs
  document.querySelectorAll('.cc-support-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const subtab = btn.dataset.subtab;
      document.querySelectorAll('.cc-support-subtab-btn').forEach(b => {
        const isCurrent = b.dataset.subtab === subtab;
        b.classList.toggle('active', isCurrent);
        b.style.color = isCurrent ? '#2563EB' : 'var(--text-secondary)';
        b.style.borderBottom = isCurrent ? '3px solid #2563EB' : 'none';
      });
      document.querySelectorAll('.cc-support-subtab-content').forEach(c => {
        c.style.display = c.id === `cc-subtab-${subtab}` ? '' : 'none';
      });
    });
  });

  // 4. Contact search
  const contactSearchInput = document.getElementById('cc-contacts-search');
  contactSearchInput?.addEventListener('input', e => {
    contactSearchQuery = e.target.value;
    const grid = document.getElementById('cc-contacts-grid');
    if (grid) {
      grid.innerHTML = renderContactsGridHtml(getEcOfficers(), contactSearchQuery);
      bindContactMessageButtons(currentUser);
    }
  });

  // 5. Contact "Message" buttons -> Switch to Chat tab & open that officer's 1-on-1
  bindContactMessageButtons(currentUser);

  // 6. Video Call: Quick Call and Meeting Call Buttons
  document.getElementById('cc-quick-call-btn')?.addEventListener('click', () => {
    openInAppVideoCall('PSSGavelClub_Live_Call', currentUser);
  });

  document.querySelectorAll('.cc-join-meeting-call-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.dataset.roomId || 'GeneralSession';
      openInAppVideoCall(`Meeting_${roomId}`, currentUser);
    });
  });

  // 7. Video Leave button
  document.getElementById('cc-video-leave-btn')?.addEventListener('click', () => {
    closeInAppVideoCall();
  });

  // 8. Meeting config form handler
  document.querySelectorAll('.cc-meeting-config-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const meetingId = form.dataset.meetingId;
      const platform = form.querySelector('.cc-meeting-platform')?.value || 'In-App WebRTC';
      const link = form.querySelector('.cc-meeting-link')?.value.trim() || '';
      if (link && !safeHttpUrl(link)) {
        showToast('Please enter a valid HTTP or HTTPS meeting URL.', 'error');
        return;
      }
      dbService.updateMeeting(meetingId, { videoPlatform: platform, videoLink: link });
      showToast('Meeting call settings updated.', 'success');
    });
  });

  // 9. Support ticket form submission
  const ticketForm = document.getElementById('cc-ticket-form');
  ticketForm?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('cc-ticket-title')?.value.trim();
    const category = document.getElementById('cc-ticket-category')?.value || 'General Help';
    const description = document.getElementById('cc-ticket-details')?.value.trim();

    if (!title || !description) {
      showToast('Please provide a ticket title and description.', 'error');
      return;
    }

    dbService.addSupportTicket({
      title,
      category,
      description,
      status: 'Open',
      submittedBy: currentUser.name || 'Member'
    });

    showToast('Support ticket submitted successfully.', 'success');
    ticketForm.reset();

    const ticketListContainer = document.getElementById('cc-support-ticket-list');
    if (ticketListContainer) {
      const updatedTickets = dbService.getSupportTickets().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      ticketListContainer.innerHTML = renderSupportTicketsHtml(updatedTickets, currentUser, isLeader);
      bindSupportTicketStatusListeners();
    }
  });

  bindSupportTicketStatusListeners();

  // 10. REAL-TIME EVENT LISTENERS (BroadcastChannel, Cloud Sync, Custom Events)
  const onIncomingBroadcast = (event) => {
    if (event.data?.type === 'NEW_MESSAGE' || event.data?.type === 'DELETE_MESSAGE') {
      onNewMessageReceived(event.data.message, currentUser);
    }
  };

  let broadcastChannel = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('pssgavel_chat_channel');
      broadcastChannel.addEventListener('message', onIncomingBroadcast);
    }
  } catch {}

  const onLocalMessageAdded = (e) => {
    onNewMessageReceived(e.detail, currentUser);
  };

  const onCloudDataChanged = () => {
    // Cloud sync updated local storage: refresh conversation list and active chat
    renderChatViewComponents(currentUser);
  };

  window.addEventListener('club:chat-message-added', onLocalMessageAdded);
  window.addEventListener('club:cloud-data-changed', onCloudDataChanged);

  cleanUpListeners = () => {
    try {
      broadcastChannel?.removeEventListener('message', onIncomingBroadcast);
      broadcastChannel?.close();
    } catch {}
    window.removeEventListener('club:chat-message-added', onLocalMessageAdded);
    window.removeEventListener('club:cloud-data-changed', onCloudDataChanged);
    videoService.leaveCall();
  };
}

function bindContactMessageButtons(currentUser) {
  document.querySelectorAll('.cc-contact-message-btn').forEach(btn => {
    btn.onclick = () => {
      const email = btn.dataset.officerEmail;
      const tag = btn.dataset.officerTag;
      if (!email) return;

      activeConversationId = getConversationIdForDM(currentUser.email, email);
      activeTab = 'chat';

      // Switch to Chat tab in UI
      document.querySelectorAll('.cc-nav-tab').forEach(b => b.classList.toggle('active', b.dataset.targetTab === 'chat'));
      document.querySelectorAll('.cc-tab-panel').forEach(panel => {
        panel.style.display = panel.id === 'cc-tab-chat' ? '' : 'none';
      });

      renderChatViewComponents(currentUser);

      // Pre-fill tag in input
      const input = document.getElementById('cc-chat-input');
      if (input && tag && !input.value.includes(tag)) {
        input.value = `${tag} `;
        input.focus();
      }
    };
  });
}

function bindSupportTicketStatusListeners() {
  document.querySelectorAll('.cc-support-status-select').forEach(select => {
    select.onchange = e => {
      const id = select.dataset.ticketId;
      const status = e.target.value;
      if (id && status) {
        dbService.updateSupportTicket(id, { status });
        showToast('Ticket status updated.', 'success');
      }
    };
  });
}

/**
 * Handles real-time incoming messages
 */
function onNewMessageReceived(message, currentUser) {
  if (!message) return;

  const convId = message.conversationId || 'general';

  // If message belongs to active conversation, append it immediately to the DOM!
  if (convId === activeConversationId) {
    const container = document.getElementById('cc-messages-container');
    if (container) {
      // Check if message is already rendered by clientTempId or id
      const existing = container.querySelector(`[data-msg-id="${message.id}"]`) ||
                       (message.clientTempId && container.querySelector(`[data-msg-id="${message.clientTempId}"]`));
      if (existing) {
        existing.replaceWith(createBubbleElement(message, currentUser));
      } else {
        container.insertAdjacentHTML('beforeend', renderMessageBubbleHtml(message, currentUser));
        container.scrollTop = container.scrollHeight;
        bindBubbleActions(currentUser);
      }
    }
  }

  // If incoming from another user, play chime and notify
  const isOwn = (currentUser.email && normalizeEmail(message.senderEmail) === normalizeEmail(currentUser.email));
  if (!isOwn) {
    notificationService.notify({
      title: `${message.senderName || 'Club Officer'} (${message.senderRole || 'EC'})`,
      body: message.content,
      tag: `msg-${message.id}`,
      onClick: () => {
        activeConversationId = convId;
        renderChatViewComponents(currentUser);
      }
    });
  }

  // Update conversation sidebar snippets and unread badges
  const listContainer = document.getElementById('cc-conversations-list');
  if (listContainer) {
    listContainer.innerHTML = renderConversationsList(currentUser);
    bindSidebarConversationClicks(currentUser);
  }
}

function createBubbleElement(message, currentUser) {
  const temp = document.createElement('div');
  temp.innerHTML = renderMessageBubbleHtml(message, currentUser);
  return temp.firstElementChild;
}

/**
 * Renders both sidebar conversations list and the active chat pane
 */
function renderChatViewComponents(currentUser) {
  const listContainer = document.getElementById('cc-conversations-list');
  if (listContainer) {
    listContainer.innerHTML = renderConversationsList(currentUser);
    bindSidebarConversationClicks(currentUser);
  }

  const paneContainer = document.getElementById('cc-chat-pane');
  if (paneContainer) {
    paneContainer.innerHTML = renderActiveChatPane(currentUser);
    bindChatPaneEvents(currentUser);
  }

  // Search input handler
  const searchInput = document.getElementById('cc-chat-search');
  searchInput?.addEventListener('input', e => {
    chatSearchQuery = e.target.value;
    if (listContainer) {
      listContainer.innerHTML = renderConversationsList(currentUser);
      bindSidebarConversationClicks(currentUser);
    }
  });

  // Mobile Back button
  document.getElementById('cc-mobile-back-btn')?.addEventListener('click', () => {
    document.getElementById('cc-chat-layout-container')?.classList.remove('mobile-in-chat');
  });
}

function bindSidebarConversationClicks(currentUser) {
  document.querySelectorAll('.cc-conv-item').forEach(item => {
    item.onclick = () => {
      const convId = item.dataset.convId;
      if (!convId) return;

      activeConversationId = convId;
      messageLimit = 35; // Reset pagination limit on switch

      // Mark mobile state
      document.getElementById('cc-chat-layout-container')?.classList.add('mobile-in-chat');

      // Update active highlight in sidebar
      document.querySelectorAll('.cc-conv-item').forEach(i => i.classList.toggle('active', i.dataset.convId === activeConversationId));

      // Re-render chat pane
      const paneContainer = document.getElementById('cc-chat-pane');
      if (paneContainer) {
        paneContainer.innerHTML = renderActiveChatPane(currentUser);
        bindChatPaneEvents(currentUser);
      }
    };
  });
}

function bindChatPaneEvents(currentUser) {
  const isLeader = isLeadershipUser(currentUser);
  const container = document.getElementById('cc-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }

  // Start Video Call from Chat Header
  document.getElementById('cc-start-room-call-btn')?.addEventListener('click', () => {
    const roomName = activeConversationId === 'general' ? 'Club_General' : activeConversationId;
    openInAppVideoCall(roomName, currentUser);
  });

  // Load earlier messages button
  document.getElementById('cc-load-earlier-btn')?.addEventListener('click', () => {
    messageLimit += 35;
    const paneContainer = document.getElementById('cc-chat-pane');
    if (paneContainer) {
      paneContainer.innerHTML = renderActiveChatPane(currentUser);
      bindChatPaneEvents(currentUser);
    }
  });

  // Mention chips
  document.querySelectorAll('.cc-mention-chip').forEach(chip => {
    chip.onclick = () => {
      const tag = chip.dataset.tag;
      const input = document.getElementById('cc-chat-input');
      if (input && tag) {
        if (!input.value.includes(tag)) {
          input.value = `${tag} ${input.value}`.trimStart();
        }
        input.focus();
      }
    };
  });

  // Chat message submit form
  const chatForm = document.getElementById('cc-chat-form');
  chatForm?.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('cc-chat-input');
    const rawText = input?.value.trim() || '';

    if (!rawText) return;

    // Check for @mention
    const mentionMatch = rawText.match(/@([a-zA-Z0-9_-]+)/);
    const mentionTag = mentionMatch ? `@${mentionMatch[1]}` : null;

    // In Tier 3 for General chat, messages MUST start with or contain an @mention
    if (!isLeader && activeConversationId === 'general' && !mentionTag) {
      showToast("In Tier 3, messages must tag an EC officer using '@' (e.g. @President or @VP-Membership).", "warning");
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
    const targetRole = mentionTag ? tagRoleMap[mentionTag.toLowerCase()] : '';

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const messagePayload = {
      conversationId: activeConversationId,
      senderName: currentUser.name || 'Club Member',
      senderEmail: currentUser.email || '',
      senderRole: currentUser.role || 'Member',
      senderTier: currentUser.tier || (isLeader ? 2 : 3),
      recipientTag: mentionTag || '',
      recipientRole: targetRole || '',
      content: rawText,
      clientTempId: tempId,
      status: 'sending'
    };

    // Optimistic UI Append
    if (input) input.value = '';
    const messagesBox = document.getElementById('cc-messages-container');
    if (messagesBox) {
      messagesBox.insertAdjacentHTML('beforeend', renderMessageBubbleHtml(messagePayload, currentUser));
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    try {
      const savedMsg = dbService.addECChatMessage({ ...messagePayload, status: 'sent' });
      // Update bubble state to sent
      const bubbleEl = messagesBox?.querySelector(`[data-msg-id="${tempId}"]`);
      if (bubbleEl) {
        bubbleEl.replaceWith(createBubbleElement(savedMsg, currentUser));
      }
      notificationService.playChime();
      bindBubbleActions(currentUser);
    } catch (err) {
      dbService.updateECChatMessageStatus(tempId, 'failed');
      showToast('Could not save message. Click retry.', 'error');
      const bubbleEl = messagesBox?.querySelector(`[data-msg-id="${tempId}"]`);
      if (bubbleEl) {
        bubbleEl.replaceWith(createBubbleElement({ ...messagePayload, status: 'failed' }, currentUser));
      }
      bindBubbleActions(currentUser);
    }
  });

  bindBubbleActions(currentUser);
}

function bindBubbleActions(currentUser) {
  // Retry button for failed messages
  document.querySelectorAll('.cc-retry-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.retryId;
      if (id) {
        dbService.updateECChatMessageStatus(id, 'sent');
        showToast('Message resent successfully.', 'success');
        renderChatViewComponents(currentUser);
      }
    };
  });

  // Delete button
  document.querySelectorAll('.cc-msg-del-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.delId;
      if (id && confirm('Delete this message?')) {
        dbService.deleteECChatMessage(id);
        showToast('Message deleted.', 'info');
        btn.closest('.cc-bubble-wrapper')?.remove();
      }
    };
  });
}

/**
 * Open In-App WebRTC Video Call Modal
 */
async function openInAppVideoCall(roomName = 'ClubRoom', currentUser) {
  const overlay = document.getElementById('cc-video-overlay');
  const stage = document.getElementById('cc-video-stage-container');
  const titleEl = document.getElementById('cc-video-room-title');

  if (!overlay || !stage) return;

  const user = currentUser || authService.getCurrentUser() || { name: 'Member', role: 'Member' };
  overlay.style.display = 'flex';
  if (titleEl) titleEl.textContent = `Live Session: ${roomName.replace(/_/g, ' ')}`;

  stage.innerHTML = `
    <div id="cc-video-loading" style="color: #FFFFFF; font-weight: 700; text-align: center; padding: 40px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #2563EB; margin-bottom: 12px;"></i>
      <div>Connecting to secure video session...</div>
      <p style="font-size: 0.8rem; color: #94A3B8; margin-top: 6px;">Initializing microphone and camera permissions</p>
    </div>
  `;

  try {
    await videoService.startCall({
      roomName,
      containerElement: stage,
      currentUser: user,
      onCallEnded: () => {
        closeInAppVideoCall();
        showToast('Call ended.', 'info');
      },
      onError: (err) => {
        showToast(err.message || 'Could not connect to video session.', 'error');
        closeInAppVideoCall();
      }
    });

    const loadingEl = document.getElementById('cc-video-loading');
    if (loadingEl) loadingEl.remove();
  } catch (err) {
    showToast(err.message || 'Failed to start video call.', 'error');
    closeInAppVideoCall();
  }
}

/**
 * Close and clean up In-App Video Call
 */
function closeInAppVideoCall() {
  const overlay = document.getElementById('cc-video-overlay');
  const stage = document.getElementById('cc-video-stage-container');
  videoService.leaveCall();
  if (stage) stage.innerHTML = '';
  if (overlay) overlay.style.display = 'none';
}