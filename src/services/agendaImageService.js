// Dynamic Agenda Timing Calculation & High-Res Branded Image Card Generator

export class AgendaImageService {
  /**
   * Automatically calculates Start Time and End Time for each agenda item sequentially.
   * @param {string} startMeetingTime Base meeting start time e.g. "10:00 AM"
   * @param {Array} agendaItems Array of items with duration in minutes
   */
  static calculateAgendaTimings(startMeetingTime, agendaItems) {
    if (!startMeetingTime || !agendaItems || agendaItems.length === 0) return agendaItems;

    let [timeStr, modifier] = startMeetingTime.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    let currentTotalMinutes = hours * 60 + (minutes || 0);

    return agendaItems.map((item, idx) => {
      const startMin = currentTotalMinutes;
      const duration = parseInt(item.duration, 10) || 5;
      const endMin = startMin + duration;
      currentTotalMinutes = endMin;

      const formatTime = (totalMins) => {
        let h = Math.floor(totalMins / 60) % 24;
        let m = totalMins % 60;
        let ampm = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        let mStr = m < 10 ? `0${m}` : `${m}`;
        return `${h12}:${mStr} ${ampm}`;
      };

      return {
        ...item,
        order: idx + 1,
        startTime: formatTime(startMin),
        endTime: formatTime(endMin)
      };
    });
  }

  /**
   * Generates clean formatted text representation of the meeting agenda
   */
  static generateAgendaText(meetingDate, branch, startMeetingTime, agendaItems) {
    const itemsWithTimes = this.calculateAgendaTimings(startMeetingTime, agendaItems);
    let text = `PSS MIYAPUR GAVEL CLUB\nMeeting Agenda\nDate: ${meetingDate} | Branch: ${branch} | Start Time: ${startMeetingTime}\n----------------------------------------\n`;

    itemsWithTimes.forEach(item => {
      text += `${item.startTime}–${item.endTime} — ${item.activity} — ${item.member || 'TBD'}\n`;
    });

    return text;
  }

  /**
   * Renders a branded meeting agenda card to HTML5 Canvas
   * @returns {HTMLCanvasElement}
   */
  static renderAgendaCanvas(meetingDate, branch, startMeetingTime, agendaItems) {
    const items = this.calculateAgendaTimings(startMeetingTime, agendaItems);
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 360 + items.length * 54;
    const ctx = canvas.getContext('2d');

    // Background Gradient (Navy Theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0B192C');
    bgGrad.addColorStop(1, '#1E3E62');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border Frame
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // Header Badge
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(40, 40, canvas.width - 80, 110);

    ctx.fillStyle = '#0B192C';
    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PSS MIYAPUR GAVEL CLUB', canvas.width / 2, 85);

    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`OFFICIAL MEETING AGENDA • ${branch.toUpperCase()} BRANCH`, canvas.width / 2, 122);

    // Meeting Details Subheader
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📅 Date: ${meetingDate}`, 50, 185);
    ctx.fillText(`⏰ Start Time: ${startMeetingTime}`, 400, 185);
    ctx.fillText(`📍 Branch: ${branch}`, 700, 185);

    // Divider Line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 205);
    ctx.lineTo(canvas.width - 50, 205);
    ctx.stroke();

    // Agenda Table Header
    ctx.fillStyle = '#152A45';
    ctx.fillRect(50, 220, canvas.width - 100, 45);

    ctx.fillStyle = '#F6C90E';
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.fillText('TIME RANGE', 70, 248);
    ctx.fillText('ACTIVITY / AGENDA ITEM', 300, 248);
    ctx.fillText('ASSIGNED MEMBER', 650, 248);

    // Agenda Rows
    let yPos = 285;
    items.forEach((item, index) => {
      // Row Background
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(50, yPos - 22, canvas.width - 100, 46);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${item.startTime} – ${item.endTime}`, 70, yPos + 6);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.activity, 300, yPos + 6);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.member || 'TBD', 650, yPos + 6);

      yPos += 52;
    });

    // Footer Branded Ribbon
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.fillRect(50, canvas.height - 65, canvas.width - 100, 40);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PSS MIYAPUR GAVEL CLUB — BUILDING CONFIDENT SPEAKERS & FUTURE LEADERS', canvas.width / 2, canvas.height - 40);

    return canvas;
  }
}
