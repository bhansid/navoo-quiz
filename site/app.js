/* Navoo quiz landing - quiz flow, snapshot, report + waitlist forms, tracking. */
import { QUESTIONS, buildSnapshot, validateAnswers } from '/engine.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const push = o => { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); };
const store = (() => { try { return window.sessionStorage; } catch { return null; } })();
const sget = k => { try { return JSON.parse((store && store.getItem(k)) || 'null'); } catch { return null; } };
const sset = (k, v) => { try { store && store.setItem(k, JSON.stringify(v)); } catch {} };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
const cookie = n => { const m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; };

/* ---------- Attribution (first touch, this session) ---------- */
let attribution = sget('navoo_attr') || {};
if (!attribution.landing_page) {
  const p = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach(k => { const v = p.get(k); if (v) attribution[k] = v.slice(0, 200); });
  attribution.landing_page = location.pathname + location.search;
  attribution.referrer = document.referrer || '';
  sset('navoo_attr', attribution);
}
const fbc = () => cookie('_fbc') || (attribution.fbclid ? 'fb.1.' + Date.now() + '.' + attribution.fbclid : '');
function track(eventId, where, type) {
  if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: type === 'report' ? 'Navoo quiz report' : 'Navoo waitlist' }, { eventID: eventId });
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', { form_location: where });
    if (window.NAVOO_ADS_SEND_TO) window.gtag('event', 'conversion', { send_to: window.NAVOO_ADS_SEND_TO, transaction_id: eventId });
  }
}

/* ---------- Quiz ---------- */
const LETTERS = 'ABCDEFG';
let answers = sget('navoo_answers') || {};
let step = 0;
const body = $('#quizBody');

function renderQ(i, animate = true) {
  step = i;
  const q = QUESTIONS[i];
  $('#qCount').textContent = `Question ${i + 1} of ${QUESTIONS.length}`;
  $('#qBar').style.width = ((i + 1) / QUESTIONS.length * 100) + '%';
  $('.progress .bar').setAttribute('aria-valuenow', i + 1);
  $('#qText').textContent = q.text;
  $('#qOpts').innerHTML = q.options.map((o, j) =>
    `<label class="opt"><input type="radio" name="q_${q.id}" value="${o.id}"${answers[q.id] === o.id ? ' checked' : ''}><span class="letter" aria-hidden="true">${LETTERS[j]}</span><span>${o.text}</span></label>`).join('');
  $('#qNext').disabled = !answers[q.id];
  $('#qNext').textContent = i === QUESTIONS.length - 1 ? 'See my results' : 'Next';
  $('#qBack').hidden = i === 0;
  if (animate) { const f = $('.q', body); f.classList.remove('fade-in'); void f.offsetWidth; f.classList.add('fade-in'); }
}
$('#qOpts').addEventListener('change', e => {
  const q = QUESTIONS[step];
  answers[q.id] = e.target.value; sset('navoo_answers', answers);
  $('#qNext').disabled = false;
  if (step === 0 && !sget('navoo_started')) { sset('navoo_started', 1); push({ event: 'quiz_start' }); }
  push({ event: 'quiz_answer', question: q.id, answer: e.target.value, step: step + 1 });
});
$('#qNext').addEventListener('click', () => {
  if (!answers[QUESTIONS[step].id]) return;
  if (step < QUESTIONS.length - 1) { renderQ(step + 1); focusQuiz(); }
  else finishQuiz();
});
$('#qBack').addEventListener('click', () => { if (step > 0) { renderQ(step - 1); focusQuiz(); } });
function focusQuiz() {
  const r = $('#quiz .quiz-card').getBoundingClientRect();
  if (r.top < 60 || r.top > innerHeight * 0.4) $('#quiz .quiz-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => { const first = $('#qOpts input:checked') || $('#qOpts input'); if (first) first.focus({ preventScroll: true }); }, 60);
}

function finishQuiz(scroll = true) {
  if (!validateAnswers(answers)) return;
  const snap = buildSnapshot(answers);
  const paras = snap.paragraphs.slice();
  paras[paras.length - 1] += ' <strong>For full results enter your email below.</strong>';
  $('#snapText').innerHTML = paras.map(p => `<p>${p}</p>`).join('');
  $('#snapFocus').textContent = 'Your 30-day focus: ' + snap.focus;
  $('#rmFocusText').textContent = snap.focus; $('#rmFocus').hidden = false;
  $('#result').hidden = false;
  $('#quiz .quiz-card').classList.add('done');
  body.innerHTML = `<p class="eyebrow dark">Quiz complete</p><h3 class="q-title serif" style="margin-top:14px">Thanks! Your snapshot is ready.</h3>
    <p style="color:var(--muted);font-size:1.1rem">We’ve matched your answers to the behaviour-science strategies most likely to help you.</p>
    <div class="q-nav"><button class="btn btn-berry btn-lg" type="button" id="qGetReport">Get my free report</button><button class="link-btn" type="button" id="qRestart">Retake the quiz</button></div>`;
  $('#qGetReport').addEventListener('click', () => openModal('quiz_card'));
  $('#qRestart').addEventListener('click', () => { answers = {}; sset('navoo_answers', {}); location.hash = ''; location.reload(); });
  setWaitlistLabel();
  if (scroll) {
    push({ event: 'quiz_complete', focus: snap.focus, top_blocker: snap.profile.top[0] });
    if (typeof window.fbq === 'function') window.fbq('trackCustom', 'QuizComplete', { focus: snap.focus });
    openModal('quiz_complete');
  }
}

/* ---------- Forms ---------- */
function base(where) {
  return { form_location: where, event_id: uuid(), page_url: location.href, fbp: cookie('_fbp'), fbc: fbc(), attribution };
}
async function post(url, payload) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
  return j;
}
function invalid(input, msgEl, text) { input.setAttribute('aria-invalid', 'true'); msgEl.textContent = text; input.focus(); }
$$('input').forEach(i => i.addEventListener('input', () => { i.removeAttribute('aria-invalid'); const m = i.form && i.form.querySelector('.form-msg'); if (m) m.textContent = ''; }));

/* ---------- Report: shared by the popup and the on-page form ----------
   The PDF has its own link (/api/pdf). On the click we open that link in a new tab
   immediately (so no browser blocks it) and start a download. Saving to the Sheet and
   emailing run separately, so they can never stop the report from loading. */
let pdfUrl = null, pdfName = 'Navoo-report.pdf';
const pdfLink = (name, dl) => '/api/pdf?a=' + QUESTIONS.map(q => answers[q.id]).join('.') + '&n=' + encodeURIComponent(name || '') + (dl ? '&dl=1' : '');
function downloadPdf(url) {
  const a = document.createElement('a'); a.href = url || pdfLink(sget('navoo_name'), true); a.download = pdfName; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
function fillReportLinks(name, email, emailed) {
  pdfName = 'Navoo-report' + (name ? '-' + name.replace(/[^A-Za-z0-9-]/g, '') : '') + '.pdf';
  pdfUrl = pdfLink(name, false);
  const dl = pdfLink(name, true);
  ['#dlBtn', '#rmDl'].forEach(sel => { const a = $(sel); a.href = dl; a.download = pdfName; });
  $('#rmOpen').href = pdfUrl;
  const mailNote = emailed === false ? '' : ` We’re also emailing a copy to ${email}.`;
  $('#doneText').textContent = 'Your report has opened in a new tab. You can download it again below.' + mailNote;
  $('#rmDoneText').textContent = 'It’s opening in a new tab and downloading now.' + mailNote;
  $('#reportForm').hidden = true; $('#reportDone').hidden = false;
}
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function requestReport({ name, email, company, where, msg }) {
  if (!validateAnswers(answers)) { msg.textContent = 'Please complete the quiz first.'; return false; }
  const event_id = uuid();
  // 1. Open the PDF right now, inside the click (new tab), and download a copy
  const tab = window.open(pdfLink(name, false), '_blank');
  try { if (tab) tab.opener = null; } catch {}
  // iOS Safari switches to the new tab and shows the PDF there with its own Save/Share button,
  // so a second automatic download would just interrupt it.
  if (!isIOS || !tab) setTimeout(() => downloadPdf(pdfLink(name, true)), tab ? 400 : 0);
  // 2. Save + email in the background (keepalive lets it finish even if the page changes)
  const p = { ...base(where), event_id, name, email, answers, company };
  fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), keepalive: true })
    .then(r => r.json().catch(() => ({}))).then(res => { if (res && res.emailed === false && !res.ok) fillReportLinks(name, email, false); })
    .catch(() => {});
  track(event_id, where, 'report'); push({ event: 'report_requested', event_id, form_location: where });
  fillReportLinks(name, email, true);
  sset('navoo_email', email); sset('navoo_name', name); sset('navoo_reported', 1); setWaitlistLabel();
  return true;
}

$('#reportForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget, msg = f.querySelector('.form-msg'), btn = f.querySelector('button');
  const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase();
  if (!name) return invalid(f.name, msg, 'Please enter your first name.');
  if (!EMAIL_RE.test(email)) return invalid(f.email, msg, 'Please enter a valid email address.');
  requestReport({ name, email, company: f.company.value, where: 'report_band', msg });
});

/* ---------- Popup ---------- */
const modal = $('#reportModal');
function openModal(source) {
  if (!modal || modal.open) return;
  const done = !!sget('navoo_reported') && !!pdfUrl;
  $('#rmStart').hidden = done; $('#rmDone').hidden = !done;
  const f = $('#rmForm');
  if (!f.name.value && sget('navoo_name')) f.name.value = sget('navoo_name');
  if (!f.email.value && sget('navoo_email')) f.email.value = sget('navoo_email');
  if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  document.documentElement.classList.add('modal-open');
  push({ event: 'report_popup_open', source });
  // Don't pop the phone keyboard up over the popup; focus the first field only on larger screens
  if (!done && matchMedia('(min-width: 640px)').matches) setTimeout(() => f.name.focus(), 80);
}
function closeModal() {
  if (modal.open) { if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open'); }
}
modal.addEventListener('close', () => {
  document.documentElement.classList.remove('modal-open');
  $('#result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); }); // tap outside the box
$('#rmClose').addEventListener('click', closeModal);
$('#rmBack').addEventListener('click', closeModal);
$('#rmForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget, msg = f.querySelector('.form-msg'), btn = f.querySelector('button');
  const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase();
  if (!name) return invalid(f.name, msg, 'Please enter your first name.');
  if (!EMAIL_RE.test(email)) return invalid(f.email, msg, 'Please enter a valid email address.');
  const ok = requestReport({ name, email, company: f.company.value, where: 'popup', msg });
  if (ok) { $('#rmStart').hidden = true; $('#rmDone').hidden = false; }
});

function setWaitlistLabel() {
  const has = validateAnswers(answers) && !sget('navoo_reported');
  $('#wlForm .btn-label').textContent = has ? 'Send me my full report' : 'Join the waitlist';
}
setWaitlistLabel();
$('#wlForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, msg = f.querySelector('.form-msg'), btn = f.querySelector('button'), label = btn.querySelector('.btn-label');
  const email = f.email.value.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return invalid(f.email, msg, 'Please enter a valid email address.');
  const withReport = validateAnswers(answers) && !sget('navoo_reported');
  const p = { ...base('waitlist'), email, company: f.company.value, ...(withReport ? { answers, name: ($('#reportForm').name.value || sget('navoo_name') || '').trim() } : {}) };
  btn.disabled = true; const old = label.textContent; label.textContent = 'Sending…';
  try {
    const res = await post(withReport && p.name ? '/api/report' : '/api/waitlist', p);
    if (!res.duplicate) track(p.event_id, 'waitlist', withReport ? 'report' : 'waitlist');
    push({ event: 'waitlist_signup', event_id: p.event_id, duplicate: !!res.duplicate });
    f.outerHTML = `<p class="wl-done"><svg style="width:20px;height:20px"><use href="#i-check"/></svg>${res.duplicate ? 'You’re already on the list. We’ll be in touch!' : res.emailed ? 'You’re on the list! Your report is on its way to your inbox.' : 'You’re on the list! We’ll keep you posted.'}</p>`;
    if (withReport && p.name) { fillReportLinks(p.name, email, res.emailed !== false); }
  } catch (err) { msg.textContent = err.message; btn.disabled = false; label.textContent = old; }
});

/* ---------- Smooth jumps ---------- */
$$('[data-goto]').forEach(a => a.addEventListener('click', e => {
  const t = document.getElementById(a.dataset.goto); if (!t) return;
  e.preventDefault(); push({ event: 'cta_click', target: a.dataset.goto });
  t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  if (a.dataset.goto === 'waitlist') setTimeout(() => { const i = $('#wlEmail'); if (i) i.focus({ preventScroll: true }); }, 500);
}));
const header = $('.site-header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Keep each phone's content inside its 9:16 frame ---------- */
function fitPhones() {
  $$('.phone').forEach(ph => {
    let fs = 1; ph.style.setProperty('--fs', fs);
    const fits = () => ph.scrollHeight <= ph.clientHeight + 1 && [...ph.querySelectorAll('.chat,.plan')].every(c => c.scrollHeight <= c.clientHeight + 1 || c.classList.contains('plan'));
    while (!fits() && fs > 0.7) { fs = Math.round((fs - 0.03) * 100) / 100; ph.style.setProperty('--fs', fs); }
  });
}
fitPhones();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhones);
addEventListener('load', fitPhones);
let ft; addEventListener('resize', () => { clearTimeout(ft); ft = setTimeout(fitPhones, 150); });

/* ---------- Image focus points from /admin ---------- */
fetch('/api/images/config').then(r => r.ok ? r.json() : {}).then(cfg => {
  Object.entries(cfg || {}).forEach(([slot, v]) => {
    if (!v || !v.pos || !/^[\d.]+% [\d.]+%$/.test(v.pos)) return;
    $$(`img[data-img="${slot}"]`).forEach(img => { img.style.objectPosition = v.pos; });
  });
}).catch(() => {});

/* ---------- Gentle reveal ---------- */
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.struggle-copy, .snap-card, .about-copy, .about-phones, .features li, .wl-inner').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add('reveal'); io.observe(el);
  });
}
const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

// Restore progress if they refresh
const firstUnanswered = QUESTIONS.findIndex(q => !answers[q.id]);
if (firstUnanswered === -1 && validateAnswers(answers)) { renderQ(QUESTIONS.length - 1, false); finishQuiz(false); }
else renderQ(Math.max(0, firstUnanswered), false);
if (sget('navoo_reported') && validateAnswers(answers)) fillReportLinks(sget('navoo_name') || '', sget('navoo_email') || '', true);
