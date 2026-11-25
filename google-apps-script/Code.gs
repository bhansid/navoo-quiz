/**
 * Navoo quiz -> Google Sheets + email the PDF report
 *
 * 1. Paste into Extensions -> Apps Script of your Google Sheet.
 * 2. Set SECRET below to the same value as SHEETS_SECRET in Netlify.
 * 3. Run "setup" once (authorise: Sheets + send email as you).
 * 4. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone.
 *    Copy the /exec URL into Netlify as SHEETS_WEBHOOK_URL.
 *
 * Email limits: a free Gmail account can send about 100 emails/day from Apps Script
 * (Google Workspace: about 1,500/day). Rows are always saved even if the limit is hit.
 */

const SECRET = 'PASTE-THE-SAME-SECRET-AS-NETLIFY';
const SEND_EMAIL = true;
const FROM_NAME = 'Navoo';
const REPLY_TO = '';          // optional, e.g. 'hello@navoo.app'

const SHEET_NAME = 'Quiz';
const COLUMNS = [
  ['created_at', 'Date'], ['type', 'Type'], ['name', 'First name'], ['email', 'Email'],
  ['focus', '30-day focus'], ['blockers', 'Top blockers'], ['cheat_codes', 'Brain cheat codes'],
  ['q_goal', 'Q1 Goal'], ['q_domain', 'Q2 Biggest change'], ['q_moment', 'Q3 Hardest moment'], ['q_barrier', 'Q4 What gets in the way'],
  ['q_pattern', 'Q5 Past pattern'], ['q_helper', 'Q6 What helps'], ['q_recovery', 'Q7 When things go wrong'],
  ['emailed', 'Report emailed'], ['form_location', 'Form'],
  ['utm_source', 'UTM source'], ['utm_medium', 'UTM medium'], ['utm_campaign', 'UTM campaign'], ['utm_content', 'UTM content'], ['utm_term', 'UTM term'],
  ['fbclid', 'fbclid'], ['gclid', 'gclid'], ['referrer', 'Referrer'], ['landing_page', 'Landing page'],
  ['device', 'Device'], ['country', 'Country'], ['event_id', 'Event ID'], ['repeat_count', 'Times submitted'], ['last_seen', 'Last submitted'],
];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!SECRET || SECRET.indexOf('PASTE-') === 0) return out({ ok: false, error: 'SECRET not set in Apps Script' });
    if (body.secret !== SECRET) return out({ ok: false, error: 'unauthorised' });
    const row = body.row || {};
    const email = String(row.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return out({ ok: false, error: 'invalid email' });

    let newRow = 0;
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      const now = new Date();
      const a = row.answers || {};
      const values = {
        created_at: now, email: email, emailed: (SEND_EMAIL && body.emailReport) ? 'sending' : 'no',
        q_goal: a.goal, q_domain: a.domain, q_moment: a.moment, q_barrier: a.barrier, q_pattern: a.pattern, q_helper: a.helper, q_recovery: a.recovery,
        repeat_count: 1, last_seen: now,
      };
      // Waitlist-only sign-ups: if the email already exists, just bump the counter
      const lastRow = sheet.getLastRow();
      if (row.type === 'waitlist' && lastRow > 1) {
        const found = sheet.getRange(2, colIndex('email'), lastRow - 1, 1).createTextFinder(email).matchEntireCell(true).findNext();
        if (found) {
          const r = found.getRow(), rc = colIndex('repeat_count');
          const cur = Number(sheet.getRange(r, rc).getValue()) || 1;
          sheet.getRange(r, rc, 1, 2).setValues([[cur + 1, now]]);
          return out({ ok: true, duplicate: true, emailed: false });
        }
      }
      sheet.appendRow(COLUMNS.map(function (c) { var k = c[0]; return k in values ? safe(values[k]) : safe(row[k]); }));
      newRow = sheet.getLastRow();
    } finally { lock.releaseLock(); }

    // Then email the PDF and record the result on the row
    let emailed = false, emailError = '';
    if (SEND_EMAIL && body.emailReport && body.pdf) {
      try { sendReport(email, row.name, row.focus, body.pdf, body.filename); emailed = true; }
      catch (err) { emailError = String(err && err.message || err); }
      getSheet().getRange(newRow, colIndex('emailed')).setValue(emailed ? 'yes' : 'failed: ' + emailError.slice(0, 80));
    }
    return out({ ok: true, duplicate: false, emailed: emailed });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  }
}

function sendReport(email, name, focus, pdfB64, filename) {
  const blob = Utilities.newBlob(Utilities.base64Decode(pdfB64), 'application/pdf', filename || 'Navoo-report.pdf');
  const first = name ? String(name).replace(/[<>]/g, '') : '';
  const subject = (first ? first + ', your' : 'Your') + ' personalised Navoo report';
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#0B3C41;max-width:560px;line-height:1.5">' +
    '<p style="font-size:16px">Hi ' + (first || 'there') + ',</p>' +
    '<p style="font-size:16px">Thanks for taking the Navoo quiz. Your personalised report is attached.</p>' +
    (focus ? '<p style="font-size:16px;background:#FCF1EE;border-radius:10px;padding:12px 16px"><strong>Your 30-day focus:</strong> ' + String(focus).replace(/[<>]/g, '') + '</p>' : '') +
    '<p style="font-size:16px">Inside you’ll find what may be getting in your way, your 3 personalised brain cheat codes, and one small first step you can take this week.</p>' +
    '<p style="font-size:16px">We’ll be in touch when Navoo launches.</p>' +
    '<p style="font-size:16px">The Navoo team</p>' +
    '<p style="font-size:12px;color:#59717F">This report gives general wellbeing guidance based on your answers. It isn’t medical advice.</p></div>';
  const opts = { name: FROM_NAME, htmlBody: html, attachments: [blob] };
  if (REPLY_TO) opts.replyTo = REPLY_TO;
  MailApp.sendEmail(email, subject, 'Your personalised Navoo report is attached.', opts);
}

function doGet() { return out({ ok: true, service: 'navoo-quiz', sheet: SHEET_NAME, emailsLeftToday: MailApp.getRemainingDailyQuota() }); }

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#77182D').setFontColor('#FFFFFF');
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(2, colIndex('last_seen'), sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  }
  return sheet;
}
function colIndex(key) { for (var i = 0; i < COLUMNS.length; i++) if (COLUMNS[i][0] === key) return i + 1; throw new Error('unknown column ' + key); }
function safe(v) { if (v instanceof Date) return v; var s = v == null ? '' : String(v).slice(0, 500); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// Run once from the editor: creates the sheet and asks for permission to send email.
function setup() { getSheet(); Logger.log('Emails left today: ' + MailApp.getRemainingDailyQuota()); }
