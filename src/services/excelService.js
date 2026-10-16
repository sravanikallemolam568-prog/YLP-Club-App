// Excel Export Service using SheetJS XLSX

import * as XLSX from 'xlsx';

export class ExcelService {
  /**
   * Export Members to XLSX file
   * @param {Array} memberList List of members to export (respects active search/filters)
   */
  static exportMembersToExcel(memberList) {
    const dataRows = memberList.map(m => ({
      'Member ID': m.id,
      'Full Name': m.name,
      'Mobile Number': m.mobile,
      'Class / Year': m.classYear,
      'School / College': m.schoolCollege,
      'Branch': m.branch,
      'Mentor': m.mentor || 'None',
      'Speeches Completed': m.speechesCompleted || 0,
      'Speech Progress %': `${(m.speechesCompleted || 0) * 10}%`,
      'Registration Date': m.regDate || 'N/A',
      'Membership Status': m.status || 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    // Auto-fit column widths
    const max_width = dataRows.reduce((w, r) => Math.max(w, r['Full Name'] ? r['Full Name'].length : 10), 12);
    worksheet['!cols'] = [{ wch: 12 }, { wch: max_width + 4 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `PSS_Miyapur_Gavel_Club_Members_${todayStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Export Attendance Records to XLSX file
   * @param {Array} attendanceList Attendance list matching active meeting/branch filters
   */
  static exportAttendanceToExcel(attendanceList) {
    const dataRows = attendanceList.map(a => ({
      'Meeting Date': a.date,
      'Branch': a.branch,
      'Member ID': a.memberId,
      'Member Name': a.memberName,
      'Attendance Status': a.status,
      'Meeting Start Time': a.startTime || '10:00 AM'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    worksheet['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `PSS_Miyapur_Gavel_Club_Attendance_${todayStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
