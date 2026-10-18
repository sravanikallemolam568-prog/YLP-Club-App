import { notifyLocalDataChanged } from './cloudDataService.js';
import { getDefaultECCommittee } from '../config/clubLeadership.js';

function saveLocalData(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
  notifyLocalDataChanged(storageKey, value);
}

function createRecordId(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
}

const STORAGE_KEYS = {
  MEMBERS: 'pssgavel_members',
  MEETINGS: 'pssgavel_meetings',
  ATTENDANCE: 'pssgavel_attendance',
  SPEECHES: 'pssgavel_speeches',
  ROLES: 'pssgavel_roles',
  MENTORS: 'pssgavel_mentors',
  EC_COMMITTEE: 'pssgavel_ec',
  AGENDA_TEMPLATES: 'pssgavel_agenda_templates',
  MEDIA: 'pssgavel_media',
  ELECTIONS: 'pssgavel_elections',
  SUPPORT_TICKETS: 'pssgavel_support_tickets',
  REMINDERS: 'pssgavel_reminders',
  EC_CHAT: 'pssgavel_ec_chat'
};

const DEFAULT_SPEECHES = [
  { id: 1, title: 'Ice Breaker', desc: 'Introduce yourself to the club' },
  { id: 2, title: 'Organizing Your Speech', desc: 'Structure your speech with clear intro, body, conclusion' },
  { id: 3, title: 'Get to the Point', desc: 'Focus on a clear general and specific purpose' },
  { id: 4, title: 'How to Say It', desc: 'Use clear, concise, and vivid language' },
  { id: 5, title: 'Your Body Speaks', desc: 'Use body language, posture, and facial expressions' },
  { id: 6, title: 'Vocal Variety', desc: 'Use voice volume, pitch, rate, and pauses' },
  { id: 7, title: 'Research Your Topic', desc: 'Collect information and present facts with impact' },
  { id: 8, title: 'Get Comfortable with Visual Aids', desc: 'Select and use visual aids effectively' },
  { id: 9, title: 'Persuade with Power', desc: 'Persuade your audience to adopt your view' },
  { id: 10, title: 'Inspire Your Audience', desc: 'Inspire the audience to achieve higher goals' }
];

class DBService {
  clearLegacyDemoData() {
    const legacyIds = {
      [STORAGE_KEYS.MEMBERS]: ['M-101', 'M-102', 'M-103', 'M-104', 'M-105'],
      [STORAGE_KEYS.MEETINGS]: ['MTG-2026-0818', 'MTG-2026-0828'],
      [STORAGE_KEYS.MEDIA]: ['MED-101', 'MED-102', 'MED-103', 'MED-104', 'MED-105', 'MED-106'],
      [STORAGE_KEYS.MENTORS]: ['MNT-1', 'MNT-2'],
      [STORAGE_KEYS.SUPPORT_TICKETS]: ['TKT-1001', 'TKT-1002'],
      [STORAGE_KEYS.REMINDERS]: ['REM-1001', 'REM-1002']
    };

    Object.entries(legacyIds).forEach(([key, ids]) => {
      try {
        const records = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(records)) {
          localStorage.setItem(key, JSON.stringify(records.filter(record => !ids.includes(record.id))));
        }
      } catch {
        localStorage.removeItem(key);
      }
    });

    try {
      const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
      if (Array.isArray(attendance)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance.filter(record =>
          !['MTG-2026-0818', 'MTG-2026-0828'].includes(record.meetingId)
        )));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    }

    localStorage.removeItem('pssgavel_auth_user');
  }

  // Member CRUD
  getMembers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
  }

  addMember(memberData) {
    const members = this.getMembers();
    const newId = createRecordId('M');
    const newMember = {
      id: newId,
      ...memberData,
      speechesCompleted: memberData.speechesCompleted || 0,
      speechProgressPct: (memberData.speechesCompleted || 0) * 10,
      regDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    members.push(newMember);
    saveLocalData(STORAGE_KEYS.MEMBERS, members);
    return newMember;
  }

  updateMember(idOrData, updatedData) {
    const memberId = typeof idOrData === 'object' ? idOrData.id : idOrData;
    const memberUpdates = typeof idOrData === 'object' ? idOrData : updatedData;
    let members = this.getMembers();
    members = members.map(m => m.id === memberId ? { ...m, ...memberUpdates } : m);
    saveLocalData(STORAGE_KEYS.MEMBERS, members);
  }

  deleteMember(id) {
    let members = this.getMembers();
    members = members.filter(m => m.id !== id);
    saveLocalData(STORAGE_KEYS.MEMBERS, members);
    return true;
  }

  // Media Hub CRUD
  getMedia() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDIA) || '[]');
  }

  addMedia(mediaItem) {
    const mediaList = this.getMedia();
    const newMedia = {
      id: createRecordId('MED'),
      date: new Date().toISOString().split('T')[0],
      uploadedBy: 'EC Officer',
      ...mediaItem
    };
    mediaList.unshift(newMedia);
    saveLocalData(STORAGE_KEYS.MEDIA, mediaList);
    return newMedia;
  }

  deleteMedia(id) {
    let mediaList = this.getMedia();
    mediaList = mediaList.filter(m => m.id !== id);
    saveLocalData(STORAGE_KEYS.MEDIA, mediaList);
    return true;
  }

  // Meetings CRUD
  getMeetings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
  }

  saveMeetings(meetings) {
    saveLocalData(STORAGE_KEYS.MEETINGS, meetings);
  }

  addMeeting(meetingData) {
    const meetings = this.getMeetings();
    const newId = createRecordId('MTG');
    const newMeeting = { id: newId, ...meetingData };
    meetings.unshift(newMeeting);
    this.saveMeetings(meetings);
    return newMeeting;
  }

  updateMeeting(id, updatedData) {
    let meetings = this.getMeetings();
    meetings = meetings.map(mtg => mtg.id === id ? { ...mtg, ...updatedData } : mtg);
    this.saveMeetings(meetings);
  }

  // Mentors (100% MANUAL)
  getMentors() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENTORS) || '[]');
  }

  addMentorAssignment(assignment) {
    const mentors = this.getMentors();
    const newAssignment = {
      id: createRecordId('MNT'),
      ...assignment,
      assignedDate: new Date().toISOString().split('T')[0]
    };
    mentors.unshift(newAssignment);
    saveLocalData(STORAGE_KEYS.MENTORS, mentors);
    return newAssignment;
  }

  removeMentorAssignment(id) {
    let mentors = this.getMentors();
    mentors = mentors.filter(m => m.id !== id);
    saveLocalData(STORAGE_KEYS.MENTORS, mentors);
  }

  // Attendance
  getAttendance() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  }

  saveAttendance(attendanceRecords) {
    let allRecords = this.getAttendance();
    // Replace records for the matching meetingId
    const meetingId = attendanceRecords[0]?.meetingId;
    if (meetingId) {
      allRecords = allRecords.filter(r => r.meetingId !== meetingId);
    }
    allRecords.push(...attendanceRecords.map(record => ({
      ...record,
      id: record.id || `ATT-${encodeURIComponent(record.meetingId)}-${encodeURIComponent(record.memberId)}`
    })));
    saveLocalData(STORAGE_KEYS.ATTENDANCE, allRecords);
  }

  // EC Committee & Leadership Roster (Tier 1 & Tier 2)
  getECCommittee() {
    const defaults = getDefaultECCommittee();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.EC_COMMITTEE) || '{}');
      if (stored.presidentEmail === 'president@pssgavelclub.org' && defaults.presidentEmail !== 'president@pssgavelclub.org') {
        stored.president = defaults.president;
        stored.presidentEmail = defaults.presidentEmail;
        stored.presidentPhone = defaults.presidentPhone;
        stored.presidentPassword = defaults.presidentPassword;
      }
      if ((stored.master2Email === 'ajith@pssgavelclub.org' || stored.ajithSirEmail === 'ajith@pssgavelclub.org') && defaults.master2Email !== 'ajith@pssgavelclub.org') {
        stored.master2Name = defaults.master2Name;
        stored.master2Email = defaults.master2Email;
        stored.master2Phone = defaults.master2Phone;
        stored.master2Password = defaults.master2Password;
        stored.ajithSir = defaults.master2Name;
        stored.ajithSirEmail = defaults.master2Email;
        stored.ajithSirPhone = defaults.master2Phone;
      }
      // Migrate old president email typo (567 → 568)
      if (stored.presidentEmail === 'sravanikallemolam567@gmail.com') {
        stored.presidentEmail = 'sravanikallemolam568@gmail.com';
      }
      return { ...defaults, ...stored };
    } catch {
      return defaults;
    }
  }

  updateECCommittee(ecData) {
    const current = this.getECCommittee();
    const merged = { ...current, ...ecData };
    // Synchronize legacy aliases for Master 2 / Ajith Sir
    if (merged.master2Name) merged.ajithSir = merged.master2Name;
    if (merged.master2Email) merged.ajithSirEmail = merged.master2Email;
    if (merged.master2Phone) merged.ajithSirPhone = merged.master2Phone;
    if (merged.master2Role) merged.ajithSirRole = merged.master2Role;
    saveLocalData(STORAGE_KEYS.EC_COMMITTEE, merged);
    return merged;
  }

  // Speeches List
  getSpeechList() {
    return DEFAULT_SPEECHES;
  }

  // EC elections
  getElections() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ELECTIONS) || '[]');
  }

  saveElections(elections) {
    saveLocalData(STORAGE_KEYS.ELECTIONS, elections);
  }

  addElection(electionData) {
    const elections = this.getElections();
    const election = {
      id: createRecordId('ELE'),
      createdAt: new Date().toISOString(),
      positions: [],
      votes: [],
      ...electionData
    };
    elections.unshift(election);
    this.saveElections(elections);
    return election;
  }

  updateElection(id, updates) {
    const elections = this.getElections().map(election =>
      election.id === id ? { ...election, ...updates } : election
    );
    this.saveElections(elections);
  }

  // Support Tickets
  getSupportTickets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS) || '[]');
  }

  addSupportTicket(ticketData) {
    const tickets = this.getSupportTickets();
    const ticket = {
      id: createRecordId('TKT'),
      createdAt: new Date().toISOString(),
      status: 'Open',
      ...ticketData
    };
    tickets.unshift(ticket);
    saveLocalData(STORAGE_KEYS.SUPPORT_TICKETS, tickets);
    return ticket;
  }

  updateSupportTicket(id, updates) {
    const tickets = this.getSupportTickets().map(ticket =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    );
    saveLocalData(STORAGE_KEYS.SUPPORT_TICKETS, tickets);
  }

  // Reminders
  getReminders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REMINDERS) || '[]');
  }

  saveReminders(reminders) {
    saveLocalData(STORAGE_KEYS.REMINDERS, reminders);
  }

  addReminder(reminderData) {
    const reminders = this.getReminders();
    const reminder = {
      id: createRecordId('REM'),
      createdAt: new Date().toISOString(),
      done: false,
      ...reminderData
    };
    reminders.unshift(reminder);
    this.saveReminders(reminders);
    return reminder;
  }

  toggleReminder(id) {
    const reminders = this.getReminders().map(reminder =>
      reminder.id === id ? { ...reminder, done: !reminder.done } : reminder
    );
    this.saveReminders(reminders);
  }

  deleteReminder(id) {
    const reminders = this.getReminders().filter(reminder => reminder.id !== id);
    this.saveReminders(reminders);
  }

  // EC Chat Messages (Hierarchical & @Mention-Enforced)
  getECChatMessages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EC_CHAT) || '[]');
  }

  addECChatMessage(messageData) {
    const messages = this.getECChatMessages();
    const newId = createRecordId('CHAT');
    const newMessage = {
      id: newId,
      ...messageData,
      createdAt: messageData.createdAt || new Date().toISOString()
    };
    messages.push(newMessage);
    saveLocalData(STORAGE_KEYS.EC_CHAT, messages);
    return newMessage;
  }

  deleteECChatMessage(id) {
    let messages = this.getECChatMessages();
    messages = messages.filter(m => m.id !== id);
    saveLocalData(STORAGE_KEYS.EC_CHAT, messages);
    return true;
  }
}

export const dbService = new DBService();
