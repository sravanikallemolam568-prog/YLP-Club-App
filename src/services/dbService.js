// Data Access Object for Cloud Firestore with Local Storage Synchronization Fallback

const STORAGE_KEYS = {
  MEMBERS: 'pssgavel_members',
  MEETINGS: 'pssgavel_meetings',
  ATTENDANCE: 'pssgavel_attendance',
  SPEECHES: 'pssgavel_speeches',
  ROLES: 'pssgavel_roles',
  MENTORS: 'pssgavel_mentors',
  EC_COMMITTEE: 'pssgavel_ec',
  AGENDA_TEMPLATES: 'pssgavel_agenda_templates',
  MEDIA: 'pssgavel_media'
};

// Initial Seed Data for immediate demonstration of all 34 requirements
const DEFAULT_MEMBERS = [
  { id: 'M-101', name: 'Rahul Sharma', mobile: '9876543210', classYear: '10th / 2026', schoolCollege: 'Delhi Public School', branch: 'Miyapur', mentor: 'Priya Varma', speechesCompleted: 4, speechProgressPct: 40, regDate: '2026-01-15', status: 'Active' },
  { id: 'M-102', name: 'Sravani Reddy', mobile: '9812345678', classYear: '9th / 2027', schoolCollege: 'Oakridge International', branch: 'Miyapur', mentor: 'Kiran Kumar', speechesCompleted: 6, speechProgressPct: 60, regDate: '2026-02-01', status: 'Active' },
  { id: 'M-103', name: 'Anjali Rao', mobile: '9765432109', classYear: '11th / 2025', schoolCollege: 'Narayana Junior College', branch: 'GHMC', mentor: 'Rahul Sharma', speechesCompleted: 2, speechProgressPct: 20, regDate: '2026-02-10', status: 'Active' },
  { id: 'M-104', name: 'Kiran Kumar', mobile: '9654321098', classYear: '12th / 2025', schoolCollege: 'Chaitanya College', branch: 'MKR', mentor: 'Priya Varma', speechesCompleted: 10, speechProgressPct: 100, regDate: '2025-11-20', status: 'Active' },
  { id: 'M-105', name: 'Priya Varma', mobile: '9543210987', classYear: 'Degree / 2024', schoolCollege: 'Hyderabad University', branch: 'Miyapur', mentor: 'None', speechesCompleted: 10, speechProgressPct: 100, regDate: '2025-08-10', status: 'Active' }
];

const DEFAULT_MEDIA = [
  {
    id: 'MED-101',
    title: 'Youth Leadership & Speech Contest 2026',
    category: 'Events',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80',
    description: 'Annual Speech Contest held at PSS Miyapur Gavel Club with over 50 enthusiastic participants.',
    date: '2026-08-15',
    uploadedBy: 'Priya Varma',
    meetingId: 'MTG-2026-0818'
  },
  {
    id: 'MED-102',
    title: 'Table Topics & Impromptu Speaking Workshop',
    category: 'Meetings',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    description: 'Interactive session training gaveliers on fast critical thinking and structured spontaneous responses.',
    date: '2026-08-18',
    uploadedBy: 'Kiran Kumar',
    meetingId: 'MTG-2026-0818'
  },
  {
    id: 'MED-103',
    title: 'Prepared Speech 6 - Vocal Variety Highlight',
    category: 'Speeches',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
    description: 'Sravani Reddy delivering Speech 6: Vocal Variety with excellent modulation and posture.',
    date: '2026-08-20',
    uploadedBy: 'Rahul Sharma',
    meetingId: 'MTG-2026-0818'
  },
  {
    id: 'MED-104',
    title: 'Best Speaker & Evaluator Awards Ceremony',
    category: 'Events',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80',
    description: 'Award distribution for Meeting #42 winners - Best Speaker, Best Evaluator, and Best Role Player.',
    date: '2026-08-22',
    uploadedBy: 'Priya Varma',
    meetingId: 'MTG-2026-0818'
  },
  {
    id: 'MED-105',
    title: 'Mentor & Mentee Orientation Session',
    category: 'Meetings',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    description: 'Special 1-on-1 mentorship allocation session guiding junior gaveliers through their CC path.',
    date: '2026-08-25',
    uploadedBy: 'Anjali Rao',
    meetingId: 'MTG-2026-0828'
  },
  {
    id: 'MED-106',
    title: 'Gavelier Presidential Keynote Address',
    category: 'Speeches',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80',
    description: 'Presidential speech delivered during the inaugural meeting session of the quarter.',
    date: '2026-08-28',
    uploadedBy: 'Priya Varma',
    meetingId: 'MTG-2026-0828'
  }
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
  { id: 'MNT-1', juniorId: 'M-101', juniorName: 'Rahul Sharma', juniorMobile: '9876543210', mentorId: 'M-105', mentorName: 'Priya Varma', mentorMobile: '9543210987', speechScope: 'All Speeches', assignedDate: '2026-01-20', assignedBy: 'President' },
  { id: 'MNT-2', juniorId: 'M-102', juniorName: 'Sravani Reddy', juniorMobile: '9812345678', mentorId: 'M-104', mentorName: 'Kiran Kumar', mentorMobile: '9654321098', speechScope: 'Speech 6', assignedDate: '2026-02-05', assignedBy: 'President' }
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
    if (!localStorage.getItem(STORAGE_KEYS.MEDIA)) {
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(DEFAULT_MEDIA));
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

  deleteMember(id) {
    let members = this.getMembers();
    members = members.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return true;
  }

  // Media Hub CRUD
  getMedia() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDIA) || '[]');
  }

  addMedia(mediaItem) {
    const mediaList = this.getMedia();
    const newMedia = {
      id: `MED-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: 'EC Officer',
      ...mediaItem
    };
    mediaList.unshift(newMedia);
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(mediaList));
    return newMedia;
  }

  deleteMedia(id) {
    let mediaList = this.getMedia();
    mediaList = mediaList.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(mediaList));
    return true;
  }

  // Meetings CRUD
  getMeetings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
  }

  saveMeetings(meetings) {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  }

  addMeeting(meetingData) {
    const meetings = this.getMeetings();
    const newId = `MTG-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random()*100)}`;
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
