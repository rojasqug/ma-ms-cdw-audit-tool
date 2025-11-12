/**
 * PDF Generator Service
 * Creates PDF reports for GDPR issues with parent and child tasks
 */

import PDFDocument from 'pdfkit';

export async function generateGDPRReport(parentIssue, subtasks) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 30, right: 30 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Footers are added as a final overlay using buffered pages. No live footer drawing
      // to avoid any chance of altering page flow as content is generated.

      // Header
      drawReportHeader(doc, parentIssue);

      // Parent details
      drawSectionTitle(doc, 'Parent Issue Details');
      drawIssueDetailsTable(doc, parentIssue);

      // Parent changelog
      drawSectionTitle(doc, 'Parent Issue Changelog');
      const parentActivities = Array.isArray(parentIssue?.activity) ? parentIssue.activity : [];
      if (parentActivities.length > 0) {
        drawChangelogTable(doc, parentActivities);
      } else {
        drawEmptyNote(doc, 'No changelog entries');
      }

      // Parent comments
      drawSectionTitle(doc, 'Parent Issue Comments');
      const parentComments = Array.isArray(parentIssue?.comments) ? parentIssue.comments : [];
      if (parentComments.length > 0) {
        drawCommentsTable(doc, parentComments);
      } else {
        drawEmptyNote(doc, 'No comments');
      }

      // Children
      const children = Array.isArray(subtasks) ? subtasks : [];
      if (children.length > 0) {
        drawSectionTitle(doc, 'Related GDPR Tasks');
        children.forEach((task, i) => {
          ensureSpace(doc, 120, true);
          drawSubtaskHeader(doc, task, i + 1);
          drawMiniMeta(doc, task);

          drawSubsectionTitle(doc, 'Changelog');
          const acts = Array.isArray(task.activity) ? task.activity : [];
          if (acts.length > 0) {
            drawChangelogTable(doc, acts);
          } else {
            drawEmptyNote(doc, 'No changelog entries');
          }

          drawSubsectionTitle(doc, 'Comments');
          const comms = Array.isArray(task.comments) ? task.comments : [];
          if (comms.length > 0) {
            drawCommentsTable(doc, comms);
          } else {
            drawEmptyNote(doc, 'No comments');
          }
        });
      }

      // Footers
      addFooters(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===== Theme & Utilities =====
function theme() {
  return {
    text: '#172B4D',
    subtleText: '#6B778C',
    border: '#DFE1E6',
    headerBg: '#F4F5F7',
    rowAlt: '#FAFBFC',
  };
}

function availableWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc, needed, addDivider = false) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 10;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
  } else if (addDivider) {
    // Only draw divider if not at very top and with enough room below
    const atTop = Math.abs(doc.y - doc.page.margins.top) < 2;
    const enoughBelow = (bottomLimit - doc.y) > 24;
    if (!atTop && enoughBelow) {
      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const y = doc.y;
      doc
        .moveTo(left, y)
        .lineTo(right, y)
        .lineWidth(0.5)
        .strokeColor(theme().border)
        .stroke();
      doc.moveDown(0.4);
    }
  }
}

function addFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    const pageIndex = range.start + i;
    doc.switchToPage(pageIndex);
    drawFooterAbsolute(doc, `Page ${i + 1} of ${range.count}`);
  }
}

// Draw a footer label at an absolute position without affecting flow
function drawFooterAbsolute(doc, label) {
  doc.save();
  const prevBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const bottomY = doc.page.height - 18;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#999999')
    .text(label, 0, bottomY, {
      width: doc.page.width,
      align: 'center',
      lineBreak: false,
      continued: false,
      paragraphGap: 0,
    });
  doc.page.margins.bottom = prevBottom;
  doc.restore();
}

// Initialize live footers so pages created during generation also get a counter
function initLiveFooters(doc) {
  let pageNo = 1;
  // First page is created automatically; add provisional footer
  drawFooterAbsolute(doc, `Page ${pageNo}`);
  doc.on('pageAdded', () => {
    pageNo += 1;
    drawFooterAbsolute(doc, `Page ${pageNo}`);
  });
}

function formatDate(v) {
  if (!v) return 'N/A';
  try {
    const d = new Date(v);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return String(v);
  }
}

// ===== Header & Titles =====
function drawReportHeader(doc, issue) {
  const t = theme();
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(t.text)
    .text('GDPR Data Rights Request — Audit Report', { align: 'center' });

  doc.moveDown(0.3);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#333333')
    .text(`${issue?.key || ''} — ${issue?.summary || ''}`, { align: 'center' });

  doc.moveDown(0.2);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(t.subtleText)
    .text(
      `Assignee: ${issue?.assignee?.name || 'Unassigned'} | Status: ${issue?.status || 'N/A'} | Resolved: ${formatDate(issue?.resolutiondate)} | Priority: ${issue?.priority || 'None'}`,
      { align: 'center' }
    );

  doc.moveDown(0.6);
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const y = doc.y;
  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .lineWidth(1)
    .strokeColor(theme().border)
    .stroke();
  doc.moveDown(0.8);
}

function drawSectionTitle(doc, text) {
  ensureSpace(doc, 28, true);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(theme().text).text(text);
  doc.moveDown(0.2);
}

function drawSubsectionTitle(doc, text) {
  ensureSpace(doc, 24, true);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(text);
  doc.moveDown(0.1);
}

function drawEmptyNote(doc, text) {
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(theme().subtleText).text(text);
  doc.fillColor(theme().text);
  doc.moveDown(0.3);
}

// ===== Parent & Subtask blocks =====
function drawMiniMeta(doc, task) {
  ensureSpace(doc, 20, true);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(theme().subtleText)
    .text(
      `Status: ${task?.status || 'N/A'} | Assignee: ${task?.assignee?.name || 'Unassigned'} | Closed: ${formatDate(task?.resolutiondate)}`
    );
  doc.fillColor(theme().text);
  doc.moveDown(0.2);
}

function drawSubtaskHeader(doc, task, index) {
  const t = theme();
  ensureSpace(doc, 36, true);
  const left = doc.page.margins.left;
  const width = availableWidth(doc);
  const y = doc.y;
  doc.rect(left, y, width, 24).fill(t.headerBg);
  doc
    .fillColor(t.text)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`Task ${index}: ${task?.key || ''} — ${task?.summary || ''}`, left + 8, y + 6, {
      width: width - 16,
    });
  doc.y = y + 26;
}

function drawIssueDetailsTable(doc, issue) {
  const rows = [
    { field: 'Key', value: issue?.key || 'N/A' },
    { field: 'Summary', value: issue?.summary || 'N/A' },
    { field: 'Type', value: issue?.type || 'GDPR' },
    { field: 'Assignee', value: issue?.assignee?.name || 'Unassigned' },
    { field: 'Status', value: issue?.status || 'N/A' },
    { field: 'Priority', value: issue?.priority || 'None' },
    { field: 'Closed Date', value: formatDate(issue?.resolutiondate) },
  ];

  const columns = [
    { header: 'Field', key: 'field', width: 130 },
    { header: 'Value', key: 'value', width: availableWidth(doc) - 130 },
  ];

  drawTable(doc, columns, rows, { zebra: true });
}

// ===== Tables =====
function drawChangelogTable(doc, activities) {
  const columns = [
    { header: 'Author', key: 'author', width: 100 },
    { header: 'Field', key: 'field', width: 100 },
    { header: 'From', key: 'fromString', width: 170 },
    { header: 'To', key: 'toString', width: 170 },
    { header: 'Date', key: 'created', width: 90, render: (v) => formatDate(v) },
  ];

  const rows = activities.map((a) => ({
    author: String(a?.author || ''),
    field: String(a?.field || ''),
    fromString: String(a?.fromString || ''),
    toString: String(a?.toString || ''),
    created: a?.created,
  }));

  drawTable(doc, columns, rows, { zebra: true });
}

function drawCommentsTable(doc, comments) {
  const columns = [
    { header: 'Author', key: 'author', width: 120 },
    { header: 'Created', key: 'created', width: 90, render: (v) => formatDate(v) },
    { header: 'Comment', key: 'body', width: availableWidth(doc) - 210 },
  ];

  const rows = comments.map((c) => ({
    author: String(c?.author || 'Unknown'),
    created: c?.created,
    body: String(c?.body || ''),
  }));

  drawTable(doc, columns, rows, { zebra: true });
}

function drawTable(doc, columns, rows, opts = {}) {
  const t = theme();
  const left = doc.page.margins.left;
  const maxWidth = availableWidth(doc);
  const cols = normalizeColumns(columns, maxWidth);

  const padX = 6;
  const padY = 4;
  const headerPadY = 6;
  const borderColor = t.border;
  const headerBg = t.headerBg;
  const headerText = t.text;
  const zebra = !!opts.zebra;

  ensureSpace(doc, 28, true);

  let x = left;
  let y = doc.y;

  // Header block
  const headerHeights = cols.map((c) =>
    doc.heightOfString(String(c.header || ''), { width: c.width - padX * 2 })
  );
  const headerH = Math.max(20, Math.max(...headerHeights) + headerPadY * 2);

  doc.rect(x, y, maxWidth, headerH).fill(headerBg);
  doc.strokeColor(borderColor).lineWidth(0.5).rect(x, y, maxWidth, headerH).stroke();
  doc.fillColor(headerText).font('Helvetica-Bold').fontSize(8);

  let cursorX = x;
  cols.forEach((c) => {
    doc.text(String(c.header || ''), cursorX + padX, y + headerPadY, {
      width: c.width - padX * 2,
    });
    cursorX += c.width;
  });

  y += headerH;
  doc.font('Helvetica').fontSize(8).fillColor(t.text);

  // Maximum row height that can fit on a fresh page body (header included)
  const maxRowHeightOnFreshPage =
    (doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 20) - headerH - 2;

  rows.forEach((row, idx) => {
    const cellTexts = cols.map((c) => {
      const raw = c.render ? c.render(row[c.key]) : row[c.key];
      return String(raw == null ? '' : raw);
    });

    let cellHeights = cellTexts.map((text, i) =>
      doc.heightOfString(text, { width: cols[i].width - padX * 2 })
    );
    let rowH = Math.max(18, Math.max(...cellHeights) + padY * 2);

    // If a single row would exceed a page body even on a fresh page, truncate the tallest cell to fit
    if (rowH > maxRowHeightOnFreshPage) {
      const targetMax = Math.max(18, maxRowHeightOnFreshPage);
      const adjustedTexts = fitRowTextsToHeight(doc, cols, cellTexts, padX, targetMax - padY * 2);
      // Recalculate with adjusted texts
      cellHeights = adjustedTexts.map((text, i) =>
        doc.heightOfString(text, { width: cols[i].width - padX * 2 })
      );
      rowH = Math.max(18, Math.max(...cellHeights) + padY * 2);
      for (let i = 0; i < cellTexts.length; i++) cellTexts[i] = adjustedTexts[i];
    }

    // Pagination with repeating header
    if (y + rowH > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;

      doc.rect(x, y, maxWidth, headerH).fill(headerBg);
      doc.strokeColor(borderColor).lineWidth(0.5).rect(x, y, maxWidth, headerH).stroke();
      doc.fillColor(headerText).font('Helvetica-Bold').fontSize(8);
      cursorX = x;
      cols.forEach((c) => {
        doc.text(String(c.header || ''), cursorX + padX, y + headerPadY, {
          width: c.width - padX * 2,
        });
        cursorX += c.width;
      });
      y += headerH;
      doc.font('Helvetica').fontSize(8).fillColor(t.text);
    }

    if (zebra && idx % 2 === 1) {
      doc.rect(x, y, maxWidth, rowH).fill(t.rowAlt);
    }

    doc
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .moveTo(x, y + rowH)
      .lineTo(x + maxWidth, y + rowH)
      .stroke();

    cursorX = x;
    cellTexts.forEach((text, i) => {
      doc.fillColor(t.text).text(text, cursorX + padX, y + padY, {
        width: cols[i].width - padX * 2,
      });
      cursorX += cols[i].width;
    });

    y += rowH;
  });

  doc.y = y + 6;
}

// Truncate row cell texts so that their combined height fits within maxHeight
function fitRowTextsToHeight(doc, cols, texts, padX, maxHeight) {
  const adjusted = texts.slice();
  // Work on the tallest cell repeatedly until it fits
  let safety = 12; // prevent infinite loops
  while (safety-- > 0) {
    const heights = adjusted.map((t, i) =>
      doc.heightOfString(t, { width: cols[i].width - padX * 2 })
    );
    const current = Math.max(...heights);
    if (current <= maxHeight) break;
    const maxIndex = heights.indexOf(current);
    adjusted[maxIndex] = truncateToHeight(
      doc,
      adjusted[maxIndex],
      cols[maxIndex].width - padX * 2,
      maxHeight
    );
  }
  return adjusted;
}

// Binary-search truncate a string to fit within the given width/height
function truncateToHeight(doc, text, width, maxHeight) {
  const original = String(text || '');
  if (doc.heightOfString(original, { width }) <= maxHeight) return original;
  let lo = 0;
  let hi = original.length;
  let best = '';
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = original.slice(0, mid).trimEnd() + '…';
    const h = doc.heightOfString(candidate, { width });
    if (h <= maxHeight) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best || '…';
}

function normalizeColumns(columns, available) {
  const sum = columns.reduce((acc, c) => acc + (c.width || 0), 0);
  if (sum <= available) return columns;
  const scale = available / sum;
  return columns.map((c) => ({ ...c, width: Math.floor((c.width || 0) * scale) }));
}
