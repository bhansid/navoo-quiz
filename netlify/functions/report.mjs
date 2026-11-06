/*
 * POST /api/report
 *   { answers, name, email, form_location, event_id, page_url, fbp, fbc, attribution, company(honeypot) }
 * 1. Validates the quiz answers + email
 * 2. Builds the personalised report (scoring engine, no AI) and renders the PDF
 * 3. Sends the row + PDF to Google Apps Script (saves to the Sheet, emails the PDF)
 * 4. Sends a "Lead" to Meta Conversions API (same event_id as the browser Pixel)
 * Returns the PDF (base64) so the visitor can download it immediately.
 *
 * POST /api/waitlist   { email, ... }  (waitlist only, no quiz answers)
 *
 * Env: SHEETS_WEBHOOK_URL, SHEETS_SECRET, META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE (optional)
 */
import { createHash, randomUUID } from 'node:crypto';
import { buildReport, validateAnswers, cleanName, QUESTIONS } from '../../site/engine.mjs';
import { renderReportPdf } from '../../lib/pdf.mjs';

const env = k => ((globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || '').trim();
const META_API_VERSION = 'v21.0';
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const clip = (v, n = 300) => (typeof v === 'string' ? v.slice(0, n) : '');
const sha256 = s => createHash('sha256').update(s).digest('hex');
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const hits = new Map();
function limited(ip) {
  const now = Date.now(), b = hits.get(ip);
  if (!b || now > b.reset) { hits.set(ip, { n: 1, reset: now + 10 * 60_000 }); return false; }
  return ++b.n > 10;
}

const answerText = a => Object.fromEntries(QUESTIONS.map(q => [q.id, (q.options.find(o => o.id === a[q.id]) || {}).text || '']));

async function toSheet(payload) {
  const url = env('SHEETS_WEBHOOK_URL');
  if (!url) throw new Error('SHEETS_WEBHOOK_URL not configured');
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: env('SHEETS_SECRET'), ...payload }), redirect: 'follow', signal: AbortSignal.timeout(8000),
  });
  const text = await r.text();
  let out; try { out = JSON.parse(text); } catch { throw new Error('Sheet script returned non-JSON (check the deployment access is "Anyone"): ' + text.slice(0, 120)); }
  if (!out.ok) throw new Error('Sheet script: ' + (out.error || 'unknown error'));
  return out;
}

async function metaLead(row, ip, ua) {
  const pixel = env('META_PIXEL_ID'), token = env('META_CAPI_TOKEN');
  if (!pixel || !token) return 'off';
  const payload = { data: [{
    event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: row.event_id, action_source: 'website',
    event_source_url: row.page_url || undefined,
    user_data: { em: [sha256(row.email)], fn: row.name ? [sha256(row.name.toLowerCase())] : undefined, client_ip_address: ip || undefined, client_user_agent: ua || undefined, fbp: row.fbp || undefined, fbc: row.fbc || undefined },
    custom_data: { content_name: row.type === 'report' ? 'Navoo quiz report' : 'Navoo waitlist', form_location: row.form_location || undefined },
  }] };
  if (env('META_TEST_EVENT_CODE')) payload.test_event_code = env('META_TEST_EVENT_CODE');
  const r = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error((b.error && b.error.message) || 'HTTP ' + r.status); }
  return 'sent';
}

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const path = new URL(req.url).pathname;
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || '';
  if (limited(ip)) return json(429, { error: 'Too many attempts. Please try again in a few minutes.' });

  const raw = await req.text();
  if (raw.length > 20_000) return json(413, { error: 'Payload too large' });
  let b; try { b = JSON.parse(raw || '{}'); } catch { return json(400, { error: 'Invalid request' }); }
  if (b.company) return json(200, { ok: true, pdf: null }); // honeypot

  const email = clip(String(b.email || '').trim().toLowerCase(), 254);
  if (!EMAIL_RE.test(email)) return json(400, { error: 'Please enter a valid email address.' });
  const name = cleanName(b.name);
  const isReport = path.endsWith('/report');
  const answers = b.answers && typeof b.answers === 'object' ? b.answers : null;
  if (isReport && !validateAnswers(answers)) return json(400, { error: 'Please complete the quiz first.' });
  if (isReport && !name) return json(400, { error: 'Please enter your first name.' });

  const ua = req.headers.get('user-agent') || '';
  const a = (b.attribution && typeof b.attribution === 'object') ? b.attribution : {};
  const row = {
    type: isReport ? 'report' : 'waitlist', email, name,
    form_location: clip(b.form_location, 30),
    utm_source: clip(a.utm_source, 120), utm_medium: clip(a.utm_medium, 120), utm_campaign: clip(a.utm_campaign, 200),
    utm_content: clip(a.utm_content, 200), utm_term: clip(a.utm_term, 200), fbclid: clip(a.fbclid, 300), gclid: clip(a.gclid, 300),
    referrer: clip(a.referrer, 500), landing_page: clip(a.landing_page, 500), page_url: clip(b.page_url, 500),
    device: /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop',
    country: clip(context && context.geo && context.geo.country && context.geo.country.code, 4),
    event_id: /^[A-Za-z0-9-]{8,64}$/.test(b.event_id || '') ? b.event_id : randomUUID(),
    fbp: clip(b.fbp, 120), fbc: clip(b.fbc, 400),
  };

  let pdfB64 = null, filename = null, report = null;
  if (isReport || validateAnswers(answers)) {
    report = buildReport(answers, name);
    const { bytes } = await renderReportPdf(report);
    pdfB64 = Buffer.from(bytes).toString('base64');
    filename = `Navoo-report${name ? '-' + name.replace(/[^A-Za-z0-9-]/g, '') : ''}.pdf`;
    Object.assign(row, {
      focus: report.focus.title,
      blockers: report.profile.top.join(', '),
      cheat_codes: report.codes.map(c => c.title).join(' | '),
      answers: answerText(answers),
    });
  }

  // Save + email (via Apps Script). Saving must succeed; the email is best-effort inside the script.
  let emailed = false, duplicate = false;
  try {
    const out = await toSheet({ row, pdf: pdfB64, filename, emailReport: !!pdfB64 });
    emailed = !!out.emailed; duplicate = !!out.duplicate;
  } catch (err) {
    // A timeout here usually means Google is still working (it keeps running after we stop waiting).
    console.error('[sheet]', err.name === 'TimeoutError' ? 'timed out waiting for Apps Script (it continues in the background)' : err.message);
    if (!pdfB64 && err.name !== 'TimeoutError') return json(502, { error: 'We couldn’t save your details just now. Please try again in a moment.' });
    emailed = pdfB64 ? null : false; // unknown
  }

  const capi = metaLead(row, ip, ua).catch(err => console.error('[capi]', err.message));
  if (context && typeof context.waitUntil === 'function') context.waitUntil(capi); else await capi;

  // The visitor gets the PDF from /api/pdf, so it isn't sent back here
  return json(200, { ok: true, duplicate, emailed, filename, focus: report ? report.focus.title : null });
};

export const config = { path: ['/api/report', '/api/waitlist'] };
