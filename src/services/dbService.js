// Data Access Object for Cloud Firestore with Local Storage Synchronization Fallback

const STORAGE_KEYS = {
  MEMBERS: 'pssgavel_members',
  MEETINGS: 'pssgavel_meetings',
  ATTENDANCE: 'pssgavel_attendance',
  SPEECHES: 'pssgavel_speeches',
  ROLES: 'pssgavel_roles',
  MENTORS: 'pssgavel_mentors',
  EC_COMMITTEE: 'pssgavel_ec',
  AGENDA_TEMPLATES: 'pssgavel_agenda_templates'
};

// Initial Seed Data for immediate demonstration of all 34 requirements
const DEFAULT_MEMBERS = [
  { id: 'M-101', name: 'Rahul Sharma', mobile: '9876543210', classYear: '10th / 2026', schoolCollege: 'Delhi Public School', branch: 'Miyapur', mentor: 'Priya Varma', speechesCompleted: 4, speechProgressPct: 40, regDate: '2026-01-15', status: 'Active' },
  { id: 'M-102', name: 'Sravani Reddy', mobile: '9812345678', classYear: '9th / 2027', schoolCollege: 'Oakridge International', branch: 'Miyapur', mentor: 'Kiran Kumar', speechesCompleted: 6, speechProgressPct: 60, regDate: '2026-02-01', status: 'Active' },
  { id: 'M-103', name: 'Anjali Rao', mobile: '9765432109', classYear: '11th / 2025', schoolCollege: 'Narayana Junior College', branch: 'GHMC', mentor: 'Rahul Sharma', speechesCompleted: 2, speechProgressPct: 20, regDate: '2026-02-10', status: 'Active' },
  { id: 'M-104', name: 'Kiran Kumar', mobile: '9654321098', classYear: '12th / 2025', schoolCollege: 'Chaitanya College', branch: 'MKR', mentor: 'Priya Varma', speechesCompleted: 10, speechProgressPct: 100, regDate: '2025-11-20', status: 'Active' },
  { id: 'M-105', name: 'Priya Varma', mobile: '9543210987', classYear: 'Degree / 2024', schoolCollege: 'Hyderabad University', branch: 'Miyapur', mentor: 'None', speechesCompleted: 10, speechProgressPct: 100, regDate: '2025-08-10', status: 'Active' }
];

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

const DEFAULT_MEETINGS = [
  {
    id: 'MTG-2026-0818',
    date: '2026-08-18',
    branch: 'Miyapur',
    startTime: '10:00 AM',
    status: 'Completed',
    roles: {
      'Sergeant': 'Rahul Sharma',
      'Gavelier': 'Priya Varma',
      'Topic Master': 'Kiran Kumar',
      'Evaluator': 'Sravani Reddy',
      'Timer': 'Anjali Rao',
      'Ah-Counter': 'Rahul Sharma',
      'Listener': 'Sravani Reddy',
      'Videographer': 'Anjali Rao',
      'General Evaluator': 'Priya Varma',
      'Activity Master': 'Kiran Kumar'
    },
    agenda: [
      { order: 1, activity: 'Opening & Sergeant Call', member: 'Rahul Sharma', duration: 5, startTime: '10:00 AM', endTime: '10:05 AM' },
      { order: 2, activity: 'Presidential Address', member: 'Priya Varma', duration: 10, startTime: '10:05 AM', endTime: '10:15 AM' },
      { order: 3, activity: 'Prepared Speech 1', member: 'Sravani Reddy', duration: 10, startTime: '10:15 AM', endTime: '10:25 AM' },
      { order: 4, activity: 'Table Topics Session', member: 'Kiran Kumar', duration: 15, startTime: '10:25 AM', endTime: '10:40 AM' },
      { order: 5, activity: 'Evaluations & Awards', member: 'Anjali Rao', duration: 10, startTime: '10:40 AM', endTime: '10:50 AM' }
    ]
  },
  {
    id: 'MTG-2026-0828',
    date: '2026-08-28',
    branch: 'Miyapur',
    startTime: '10:00 AM',
    status: 'Upcoming',
    roles: {
      'Sergeant': 'Rahul Sharma',
      'Gavelier': 'Sravani Reddy',
      'Topic Master': 'Kiran Kumar',
      'Evaluator': 'Priya Varma',
      'Timer': 'Anjali Rao',
      'Ah-Counter': 'Rahul Sharma',
      'Listener': 'Sravani Reddy',
      'Videographer': 'Anjali Rao',
      'General Evaluator': 'Priya Varma',
      'Activity Master': 'Kiran Kumar'
    },
    agenda: [
      { order: 1, activity: 'Opening & Sergeant Call', member: 'Rahul Sharma', duration: 5, startTime: '10:00 AM', endTime: '10:05 AM' },
      { order: 2, activity: 'Prepared Speech 2', member: 'Anjali Rao', duration: 10, startTime: '10:05 AM', endTime: '10:15 AM' },
      { order: 3, activity: 'Table Topics', member: 'Kiran Kumar', duration: 15, startTime: '10:15 AM', endTime: '10:30 AM' },
      { order: 4, activity: 'Evaluation', member: 'Priya Varma', duration: 10, startTime: '10:30 AM', endTime: '10:40 AM' }
    ]
  }
];

const DEFAULT_EC_COMMITTEE = {
  president: 'Priya Varma',
  vpEducation: 'Kiran Kumar',
  vpMembership: 'Sravani Reddy',
  vpPR: 'Rahul Sharma',
  secretary: 'Anjali Rao',
  jointSecretary: 'Kiran Kumar',
  sergeant: 'Rahul Sharma'
};

const DEFAULT_MENTORS = [
  { id: 'MNT-1', juniorId: 'M-101', juniorName: 'Rahul Sharma', mentorName: 'Priya Varma', speechScope: 'All Speeches', assignedDate: '2026-01-20', assignedBy: 'President' },
  { id: 'MNT-2', juniorId: 'M-102', juniorName: 'Sravani Reddy', mentorName: 'Kiran Kumar', speechScope: 'Speech 6', assignedDate: '2026-02-05', assignedBy: 'President' }
];

const DEFAULT_ATTENDANCE = [
  { meetingId: 'MTG-2026-0818', date: '2026-08-18', branch: 'Miyapur', memberId: 'M-101', memberName: 'Rahul Sharma', status: 'Present', startTime: '10:00 AM' },
  { meetingId: 'MTG-2026-0818', date: '2026-08-18', branch: 'Miyapur', memberId: 'M-102', memberName: 'Sravani Reddy', status: 'Present', startTime: '10:00 AM' },
  { meetingId: 'MTG-2026-0818', date: '2026-08-18', branch: 'Miyapur', memberId: 'M-103', memberName: 'Anjali Rao', status: 'Informed Absent', startTime: '10:00 AM' },
  { meetingId: 'MTG-2026-0818', date: '2026-08-18', branch: 'Miyapur', memberId: 'M-104', memberName: 'Kiran Kumar', status: 'Present', startTime: '10:00 AM' },
  { meetingId: 'MTG-2026-0818', date: '2026-08-18', branch: 'Miyapur', memberId: 'M-105', memberName: 'Priya Varma', status: 'Present', startTime: '10:00 AM' }
];

class DBService {
  constructor() {
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEETINGS)) {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(DEFAULT_MEETINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EC_COMMITTEE)) {
      localStorage.setItem(STORAGE_KEYS.EC_COMMITTEE, JSON.stringify(DEFAULT_EC_COMMITTEE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MENTORS)) {
      localStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(DEFAULT_MENTORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE));
    }
  }

  // Member CRUD
  getMembers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
  }

  addMember(memberData) {
    const members = this.getMembers();
    const newId = `M-${100 + members.length + 1}`;
    const newMember = {
      id: newId,
      ...memberData,
      speechesCompleted: memberData.speechesCompleted || 0,
      speechProgressPct: (memberData.speechesCompleted || 0) * 10,
      regDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    members.push(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  }

  updateMember(id, updatedData) {
    let members = this.getMembers();
    members = members.map(m => m.id === id ? { ...m, ...updatedData } : m);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }

  // Meetings CRUD
  getMeetings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
  }

  addMeeting(meetingData) {
    const meetings = this.getMeetings();
    const newId = `MTG-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random()*100)}`;
    const newMeeting = { id: newId, ...meetingData };
    meetings.unshift(newMeeting);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    return newMeeting;
  }

  updateMeeting(id, updatedData) {
    let meetings = this.getMeetings();
    meetings = meetings.map(mtg => mtg.id === id ? { ...mtg, ...updatedData } : mtg);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  }

  // Mentors (100% MANUAL)
  getMentors() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENTORS) || '[]');
  }

  addMentorAssignment(assignment) {
    const mentors = this.getMentors();
    const newAssignment = {
      id: `MNT-${Date.now()}`,
      ...assignment,
      assignedDate: new Date().toISOString().split('T')[0]
    };
    mentors.unshift(newAssignment);
    localStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors));
    return newAssignment;
  }

  removeMentorAssignment(id) {
    let mentors = this.getMentors();
    mentors = mentors.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors));
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
    allRecords.push(...attendanceRecords);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allRecords));
  }

  // EC Committee
  getECCommittee() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EC_COMMITTEE) || '{}');
  }

  updateECCommittee(ecData) {
    localStorage.setItem(STORAGE_KEYS.EC_COMMITTEE, JSON.stringify(ecData));
  }

  // Speeches List
  getSpeechList() {
    return DEFAULT_SPEECHES;
  }
}

export const dbService = new DBService();
