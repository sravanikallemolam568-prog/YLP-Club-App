/**
 * ============================================================================
 * PSS MIYAPUR GAVEL CLUB - LEADERSHIP CREDENTIALS & HIERARCHY CONFIGURATION
 * ============================================================================
 * 
 * Edit this file to add or update the emails, phone numbers, names, and passwords
 * of the upper two main blocks (Tier 1 Master Block & Tier 2 EC Team Block).
 * 
 * Default password for all leadership accounts is: 123456
 */

export const DEFAULT_CLUB_LEADERSHIP = {
  // ==========================================================================
  // TIER 1: MASTER BLOCK (2 People)
  // Super Admin Powers, Full access, can start/host video calls.
  // President has exclusive authority to edit Master Person 2 and all 5 ECs.
  // ==========================================================================
  president: {
    name: 'Sravani Kallemolam',
    email: 'sravanikallemolam568@gmail.com',
    phone: '9014231403',
    password: '123456'
  },
  master2: {
    name: 'TM Ajith',
    email: 'tmajiit@gmail.com',
    phone: '9391756155',
    password: '123456',
    role: 'Club Advisor & Mentor'
  },

  // ==========================================================================
  // TIER 2: EC TEAM BLOCK (5 People)
  // Executive Committee Officers: Can manage role areas and start video calls.
  // ==========================================================================
  vpEducation: {
    name: 'VP Education',
    email: 'vpeducation@pssgavelclub.org',
    phone: '9876543212',
    password: '123456'
  },
  vpMembership: {
    name: 'VP Membership',
    email: 'vpmembership@pssgavelclub.org',
    phone: '9876543213',
    password: '123456'
  },
  vpPR: {
    name: 'VP Public Relations',
    email: 'vppr@pssgavelclub.org',
    phone: '9876543214',
    password: '123456'
  },
  secretary: {
    name: 'Secretary',
    email: 'secretary@pssgavelclub.org',
    phone: '9876543215',
    password: '123456'
  },
  sergeant: {
    name: 'Sergeant-at-Arms',
    email: 'sergeant@pssgavelclub.org',
    phone: '9876543216',
    password: '123456'
  }
};

/**
 * Returns the default flattened committee object used for storage synchronization.
 */
export function getDefaultECCommittee() {
  return {
    // Tier 1: Master Block (2 People)
    president: DEFAULT_CLUB_LEADERSHIP.president.name,
    presidentEmail: DEFAULT_CLUB_LEADERSHIP.president.email,
    presidentPhone: DEFAULT_CLUB_LEADERSHIP.president.phone,
    presidentPassword: DEFAULT_CLUB_LEADERSHIP.president.password,

    master2Name: DEFAULT_CLUB_LEADERSHIP.master2.name,
    master2Email: DEFAULT_CLUB_LEADERSHIP.master2.email,
    master2Phone: DEFAULT_CLUB_LEADERSHIP.master2.phone,
    master2Password: DEFAULT_CLUB_LEADERSHIP.master2.password,
    master2Role: DEFAULT_CLUB_LEADERSHIP.master2.role,

    // Legacy aliases for backward compatibility with existing templates
    ajithSir: DEFAULT_CLUB_LEADERSHIP.master2.name,
    ajithSirEmail: DEFAULT_CLUB_LEADERSHIP.master2.email,
    ajithSirPhone: DEFAULT_CLUB_LEADERSHIP.master2.phone,
    ajithSirRole: DEFAULT_CLUB_LEADERSHIP.master2.role,

    // Tier 2: EC Team Block (5 People)
    vpEducation: DEFAULT_CLUB_LEADERSHIP.vpEducation.name,
    vpEducationEmail: DEFAULT_CLUB_LEADERSHIP.vpEducation.email,
    vpEducationPhone: DEFAULT_CLUB_LEADERSHIP.vpEducation.phone,
    vpEducationPassword: DEFAULT_CLUB_LEADERSHIP.vpEducation.password,

    vpMembership: DEFAULT_CLUB_LEADERSHIP.vpMembership.name,
    vpMembershipEmail: DEFAULT_CLUB_LEADERSHIP.vpMembership.email,
    vpMembershipPhone: DEFAULT_CLUB_LEADERSHIP.vpMembership.phone,
    vpMembershipPassword: DEFAULT_CLUB_LEADERSHIP.vpMembership.password,

    vpPR: DEFAULT_CLUB_LEADERSHIP.vpPR.name,
    vpPREmail: DEFAULT_CLUB_LEADERSHIP.vpPR.email,
    vpPRPhone: DEFAULT_CLUB_LEADERSHIP.vpPR.phone,
    vpPRPassword: DEFAULT_CLUB_LEADERSHIP.vpPR.password,

    secretary: DEFAULT_CLUB_LEADERSHIP.secretary.name,
    secretaryEmail: DEFAULT_CLUB_LEADERSHIP.secretary.email,
    secretaryPhone: DEFAULT_CLUB_LEADERSHIP.secretary.phone,
    secretaryPassword: DEFAULT_CLUB_LEADERSHIP.secretary.password,

    sergeant: DEFAULT_CLUB_LEADERSHIP.sergeant.name,
    sergeantEmail: DEFAULT_CLUB_LEADERSHIP.sergeant.email,
    sergeantPhone: DEFAULT_CLUB_LEADERSHIP.sergeant.phone,
    sergeantPassword: DEFAULT_CLUB_LEADERSHIP.sergeant.password
  };
}
