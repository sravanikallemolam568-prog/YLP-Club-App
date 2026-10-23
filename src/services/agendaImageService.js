// Dynamic Agenda Timing Calculation & High-Res Branded Image Card Generator

export class AgendaImageService {
  /**
   * Centralized Color Palette — Strict Blue, Green, Yellow Identity
   */
  static PALETTE = {
    bg: '#FFFFFF',
    textMain: '#1F2937',        // Dark charcoal
    textMuted: '#64748B',       // Muted slate
    navy: '#1E3A8A',            // Dark navy for main headings & table headers
    blue: '#2563EB',            // Confidence Blue for section headings & badges
    blueLight: '#EFF6FF',       // Very light blue for alternating rows
    green: '#166534',           // Dark green for assigned members
    greenDot: '#16A34A',        // Growth Green for active indicators
    yellow: '#FACC15',          // Leadership Yellow for accents
    yellowDark: '#CA8A04',      // Deep yellow/amber for icons & highlights
    border: '#E2E8F0',          // Light grey borders & dividers
    rowAlt: '#EFF6FF',          // Alternating row color
    rowBase: '#FFFFFF',         // Base row color
    unassigned: '#94A3B8'       // Subtle grey for unassigned text
  };

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
        endTime: formatTime(endMin),
        durationMinutes: duration
      };
    });
  }

  /**
   * Generates clean formatted text representation of the meeting agenda
   */
  static generateAgendaText(meetingDate, branch, startMeetingTime, agendaItems) {
    const itemsWithTimes = this.calculateAgendaTimings(startMeetingTime, agendaItems);
    const totalDuration = itemsWithTimes.reduce((sum, item) => sum + (parseInt(item.duration, 10) || 0), 0);
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    const durationSummary = hours > 0 ? `${hours}h ${mins}m` : `${totalDuration} mins`;

    let text = `PSS MIYAPUR GAVEL CLUB\nOfficial Meeting Agenda\n`;
    text += `Date: ${meetingDate} | Time: ${startMeetingTime} | Branch: ${branch}\n`;
    text += `Total Duration: ${durationSummary} (${totalDuration} mins)\n`;
    text += `--------------------------------------------------------\n`;

    itemsWithTimes.forEach(item => {
      const isAssigned = item.member && item.member !== 'TBD' && item.member !== 'Not Assigned';
      const assigned = isAssigned ? item.member : 'Not Assigned';
      text += `#${item.order} | ${item.startTime}–${item.endTime} (${item.duration || 5}m) — ${item.activity} — ${assigned}\n`;
    });

    text += `--------------------------------------------------------\n`;
    text += `Confidence • Growth • Leadership\nAffiliated with Toastmasters International`;
    return text;
  }

  /**
   * Helper to wrap text into multiple lines if exceeding maxWidth
   */
  static wrapText(ctx, text, maxWidth) {
    if (!text) return [''];
    const words = String(text).trim().split(/\s+/);
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const width = ctx.measureText(testLine).width;
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Helper to draw a rounded rectangle on Canvas
   */
  static drawRoundedRect(ctx, x, y, width, height, radius, fillStyle = null, strokeStyle = null, lineWidth = 1) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Helper to draw Toastmasters / Gavel Club Crest Emblem
   */
  static drawClubEmblem(ctx, cx, cy, radius) {
    ctx.save();
    // Outer Circle (Dark Navy)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1E3A8A';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FACC15';
    ctx.stroke();

    // Inner Gold Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4.5, 0, Math.PI * 2);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    ctx.stroke();

    // Microphone capsule (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    const micW = radius * 0.45;
    const micH = radius * 0.7;
    const micX = cx - micW / 2;
    const micY = cy - micH / 2 - 4;
    ctx.roundRect ? ctx.roundRect(micX, micY, micW, micH, micW / 2) : ctx.rect(micX, micY, micW, micH);
    ctx.fill();

    // Mic Grille lines (Blue)
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 5, micY + 8);
    ctx.lineTo(cx + 5, micY + 8);
    ctx.moveTo(cx - 5, micY + 14);
    ctx.lineTo(cx + 5, micY + 14);
    ctx.stroke();

    // Mic Support Arc (Gold)
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, radius * 0.38, 0, Math.PI);
    ctx.stroke();

    // Stand base (White)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + radius * 0.36);
    ctx.lineTo(cx, cy + radius * 0.55);
    ctx.moveTo(cx - 10, cy + radius * 0.55);
    ctx.lineTo(cx + 10, cy + radius * 0.55);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders a clean, professional, readable agenda image with:
   * - White #FFFFFF background
   * - Dark navy #1E3A8A main heading
   * - Dark charcoal #1F2937 club name
   * - Blue #2563EB section headings
   * - Dark blue #1E3A8A table header with white text
   * - Alternating rows (White #FFFFFF & Very Light Blue #EFF6FF)
   * - Dark green #166534 assigned members
   * - Small yellow #FACC15 accents
   * - Light grey #E2E8F0 borders and dividers
   * - Total meeting duration calculated from actual data
   * @returns {HTMLCanvasElement}
   */
  static renderAgendaCanvas(meetingDate, branch, startMeetingTime, agendaItems) {
    const P = this.PALETTE;
    const items = this.calculateAgendaTimings(startMeetingTime, agendaItems);

    // Pre-calculate row heights with text wrapping so long names never overlap
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = '700 15px "Inter", "Roboto", sans-serif';

    const rowData = items.map(item => {
      const actLines = this.wrapText(tempCtx, item.activity, 320);
      const isAssigned = item.member && item.member !== 'TBD' && item.member !== 'Not Assigned';
      const memberName = isAssigned ? item.member : 'Not Assigned';
      const memLines = this.wrapText(tempCtx, memberName, 210);
      const maxLines = Math.max(actLines.length, memLines.length, 1);
      const calculatedHeight = Math.max(50, maxLines * 22 + 18);
      return {
        ...item,
        isAssigned,
        memberName,
        actLines,
        memLines,
        height: calculatedHeight
      };
    });

    const totalTableRowsHeight = rowData.reduce((sum, r) => sum + r.height, 0);

    // Calculate total meeting duration from actual agenda items
    const totalDurationMinutes = items.reduce((sum, item) => sum + (parseInt(item.duration, 10) || 0), 0);
    const durationHours = Math.floor(totalDurationMinutes / 60);
    const durationRemainingMins = totalDurationMinutes % 60;
    const durationText = durationHours > 0
      ? `${durationHours} hr ${durationRemainingMins} mins (${totalDurationMinutes} mins total)`
      : `${totalDurationMinutes} minutes total`;

    // Canvas Dimensions
    const canvas = document.createElement('canvas');
    const canvasWidth = 1040;
    const tableX = 40;
    const tableWidth = canvasWidth - (tableX * 2); // 960px
    const headerHeight = 175;
    const metaBarHeight = 70;
    const tableHeaderHeight = 46;
    const summaryBarHeight = 52;
    const footerHeight = 85;
    const canvasHeight = headerHeight + metaBarHeight + tableHeaderHeight + totalTableRowsHeight + summaryBarHeight + footerHeight + 40;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Clean White Canvas Background
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Crisp Outer Frame with Subtle Grey Border & Royal Blue Top Accent Line
    this.drawRoundedRect(ctx, 16, 16, canvas.width - 32, canvas.height - 32, 20, null, P.border, 1.5);

    // Top Brand Accent Stripe (Blue with small Yellow tick)
    ctx.fillStyle = P.blue;
    ctx.fillRect(40, 16, canvas.width - 80, 4);
    ctx.fillStyle = P.yellow;
    ctx.fillRect(canvas.width / 2 - 50, 16, 100, 4);

    // 3. Header Section (Logo, Club Name, and Main Heading)
    const logoX = 85;
    const logoY = 95;
    this.drawClubEmblem(ctx, logoX, logoY, 38);

    const headerTextX = 145;

    // Affiliation Tag
    ctx.fillStyle = P.blue;
    ctx.font = '800 12px "Inter", "Roboto", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOASTMASTERS INTERNATIONAL AFFILIATE  •  YOUTH LEADERSHIP PROGRAM', headerTextX, 68);

    // Club Name (Dark Charcoal)
    ctx.fillStyle = P.textMain;
    ctx.font = '800 32px "Inter", "Roboto", sans-serif';
    ctx.fillText('PSS MIYAPUR GAVEL CLUB', headerTextX, 104);

    // Main Heading: Meeting Agenda (Dark Navy)
    ctx.fillStyle = P.navy;
    ctx.font = '800 22px "Inter", "Roboto", sans-serif';
    ctx.fillText('MEETING AGENDA', headerTextX, 134);

    // Branch Badge Beside Heading
    const agendaTextWidth = ctx.measureText('MEETING AGENDA').width;
    const branchBadgeX = headerTextX + agendaTextWidth + 16;
    const branchBadgeText = `${(branch || 'MIYAPUR').toUpperCase()} BRANCH`;
    ctx.font = '700 12px "Inter", "Roboto", sans-serif';
    const branchWidth = ctx.measureText(branchBadgeText).width + 20;

    this.drawRoundedRect(ctx, branchBadgeX, 116, branchWidth, 24, 6, P.blueLight, '#BFDBFE', 1);
    ctx.fillStyle = P.blue;
    ctx.fillText(branchBadgeText, branchBadgeX + 10, 132);

    // 4. Meeting Info Meta Bar (3 Clean White Cards with Borders)
    const metaY = 175;
    const colGap = 16;
    const colWidth = (tableWidth - (colGap * 2)) / 3;

    // Card 1: Meeting Date
    this.drawRoundedRect(ctx, tableX, metaY, colWidth, 58, 10, '#FFFFFF', P.border, 1.2);
    ctx.fillStyle = P.blue;
    ctx.font = 'bold 11px "Inter", "Roboto", sans-serif';
    ctx.fillText('MEETING DATE', tableX + 16, metaY + 22);
    ctx.fillStyle = P.textMain;
    ctx.font = '700 16px "Inter", "Roboto", sans-serif';
    ctx.fillText(`📅  ${meetingDate}`, tableX + 16, metaY + 44);

    // Card 2: Start Time
    const card2X = tableX + colWidth + colGap;
    this.drawRoundedRect(ctx, card2X, metaY, colWidth, 58, 10, '#FFFFFF', P.border, 1.2);
    ctx.fillStyle = P.yellowDark;
    ctx.font = 'bold 11px "Inter", "Roboto", sans-serif';
    ctx.fillText('START TIME', card2X + 16, metaY + 22);
    ctx.fillStyle = P.textMain;
    ctx.font = '700 16px "Inter", "Roboto", sans-serif';
    ctx.fillText(`⏰  ${startMeetingTime}`, card2X + 16, metaY + 44);

    // Card 3: Branch / Location
    const card3X = card2X + colWidth + colGap;
    this.drawRoundedRect(ctx, card3X, metaY, colWidth, 58, 10, '#FFFFFF', P.border, 1.2);
    ctx.fillStyle = P.green;
    ctx.font = 'bold 11px "Inter", "Roboto", sans-serif';
    ctx.fillText('CLUB BRANCH', card3X + 16, metaY + 22);
    ctx.fillStyle = P.textMain;
    ctx.font = '700 16px "Inter", "Roboto", sans-serif';
    ctx.fillText(`📍  ${branch} Branch`, card3X + 16, metaY + 44);

    // 5. Table Container & Header Row (Dark Blue #1E3A8A with White Text)
    const tableTop = metaY + 75;

    // Header Background
    this.drawRoundedRect(ctx, tableX, tableTop, tableWidth, tableHeaderHeight, 8, P.navy, null);

    // Small Gold Underline Accent below Header
    ctx.fillStyle = P.yellow;
    ctx.fillRect(tableX, tableTop + tableHeaderHeight - 3, tableWidth, 3);

    // Header Column Labels (Crisp White Text)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px "Inter", "Roboto", sans-serif';
    ctx.textAlign = 'left';

    const colOrderX = tableX + 16;       // Order (#)
    const colTimeX = tableX + 64;        // Time Range
    const colActivityX = tableX + 250;   // Activity
    const colMemberX = tableX + 610;     // Assigned Member
    const colDurationX = tableX + 865;   // Duration

    ctx.fillText('#', colOrderX, tableTop + 28);
    ctx.fillText('TIME RANGE', colTimeX, tableTop + 28);
    ctx.fillText('ACTIVITY / AGENDA ITEM', colActivityX, tableTop + 28);
    ctx.fillText('ASSIGNED MEMBER', colMemberX, tableTop + 28);
    ctx.fillText('DURATION', colDurationX, tableTop + 28);

    // 6. Table Rows (Alternating White & Very Light Blue #EFF6FF)
    let currentY = tableTop + tableHeaderHeight;

    rowData.forEach((item, index) => {
      const isAlt = index % 2 === 1;
      const rowBg = isAlt ? P.rowAlt : P.rowBase;
      const rowH = item.height;

      // Draw Row Background
      ctx.fillStyle = rowBg;
      ctx.fillRect(tableX, currentY, tableWidth, rowH);

      // Light Divider Line Below Row
      ctx.fillStyle = P.border;
      ctx.fillRect(tableX, currentY + rowH - 1, tableWidth, 1);

      // Left Vertical Border & Right Border for Clean Frame
      ctx.fillStyle = P.border;
      ctx.fillRect(tableX, currentY, 1, rowH);
      ctx.fillRect(tableX + tableWidth - 1, currentY, 1, rowH);

      const textBaselineY = currentY + 24;

      // Column 1: Order (#)
      ctx.fillStyle = P.textMuted;
      ctx.font = '700 14px "Inter", "Roboto", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.order}`, colOrderX + 2, textBaselineY);

      // Column 2: Time Range (Dark Charcoal)
      ctx.fillStyle = P.textMain;
      ctx.font = '700 14px "Inter", "Roboto", monospace';
      ctx.fillText(`${item.startTime} – ${item.endTime}`, colTimeX, textBaselineY);

      // Column 3: Activity Name (Dark Charcoal with multi-line wrapping)
      ctx.fillStyle = P.textMain;
      ctx.font = '700 14.5px "Inter", "Roboto", sans-serif';
      item.actLines.forEach((line, lineIdx) => {
        ctx.fillText(line, colActivityX, textBaselineY + (lineIdx * 20));
      });

      // Column 4: Assigned Member
      // Status Dot Indicator (Green for assigned, Grey for unassigned)
      ctx.beginPath();
      ctx.arc(colMemberX + 4, textBaselineY - 5, 4, 0, Math.PI * 2);
      ctx.fillStyle = item.isAssigned ? P.greenDot : P.border;
      ctx.fill();

      // Member Name (Dark green #166534 if assigned, subtle grey italic if not assigned)
      ctx.fillStyle = item.isAssigned ? P.green : P.unassigned;
      ctx.font = item.isAssigned
        ? '700 14.5px "Inter", "Roboto", sans-serif'
        : 'italic 14px "Inter", "Roboto", sans-serif';

      item.memLines.forEach((line, lineIdx) => {
        ctx.fillText(line, colMemberX + 16, textBaselineY + (lineIdx * 20));
      });

      // Column 5: Duration (Clean badge in Dark Charcoal)
      const durText = `${item.durationMinutes}m`;
      this.drawRoundedRect(ctx, colDurationX, textBaselineY - 14, 52, 22, 5, isAlt ? '#FFFFFF' : '#F1F5F9', P.border, 1);
      ctx.fillStyle = P.textMain;
      ctx.font = '700 12.5px "Inter", "Roboto", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(durText, colDurationX + 26, textBaselineY + 2);
      ctx.textAlign = 'left';

      currentY += rowH;
    });

    // 7. Table Total Duration & Summary Bar (Calculated from Actual Data)
    this.drawRoundedRect(ctx, tableX, currentY, tableWidth, summaryBarHeight, 8, '#F8FAFC', P.border, 1);

    // Left: Total Duration
    ctx.fillStyle = P.textMain;
    ctx.font = '600 14px "Inter", "Roboto", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⏱️  Total Meeting Duration:', tableX + 18, currentY + 31);

    ctx.fillStyle = P.navy;
    ctx.font = '800 15px "Inter", "Roboto", sans-serif';
    ctx.fillText(durationText, tableX + 215, currentY + 31);

    // Right: Activities Count Badge
    const itemsCountText = `📋  ${items.length} Agenda Activities`;
    ctx.fillStyle = P.textMuted;
    ctx.font = '700 13px "Inter", "Roboto", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(itemsCountText, tableX + tableWidth - 18, currentY + 31);

    // 8. Footer Section (Club Values & Leadership Accents)
    const footerY = currentY + summaryBarHeight + 24;

    // Divider Line Above Footer
    ctx.fillStyle = P.border;
    ctx.fillRect(tableX, footerY, tableWidth, 1);

    // Leadership Values Ribbon (Centered)
    ctx.textAlign = 'center';
    ctx.font = '800 13px "Inter", "Roboto", sans-serif';

    // Blue Confidence
    ctx.fillStyle = P.blue;
    ctx.fillText('🔵 CONFIDENCE', canvas.width / 2 - 170, footerY + 26);

    // Divider Dot
    ctx.fillStyle = P.textMuted;
    ctx.fillText('•', canvas.width / 2 - 80, footerY + 26);

    // Green Growth
    ctx.fillStyle = P.greenDot;
    ctx.fillText('🟢 GROWTH', canvas.width / 2, footerY + 26);

    // Divider Dot
    ctx.fillStyle = P.textMuted;
    ctx.fillText('•', canvas.width / 2 + 80, footerY + 26);

    // Yellow Leadership
    ctx.fillStyle = P.yellowDark;
    ctx.fillText('🟡 LEADERSHIP', canvas.width / 2 + 170, footerY + 26);

    // Footer Subtitle
    ctx.fillStyle = P.textMuted;
    ctx.font = '500 12px "Inter", "Roboto", sans-serif';
    ctx.fillText('PSS Miyapur Gavel Club  •  Youth Leadership Program  •  Where Leaders Are Made', canvas.width / 2, footerY + 48);

    return canvas;
  }
}
