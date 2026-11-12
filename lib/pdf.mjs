/*
 * Builds the 5-page personalised report PDF from buildReport() output.
 * Pure pdf-lib with built-in Helvetica (no font files, no native deps).
 * Layout follows "Report Design" (US Letter, 612 x 792 pt).
 */
import { PDFDocument, StandardFonts, rgb, LineCapStyle } from 'pdf-lib';
import { LOGO_PNG_B64, LOGO_RATIO } from './logo.mjs';

const W = 612, H = 792, M = 40, CW = W - M * 2;
const hex = h => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  navy: hex('#0F1F5C'), body: hex('#2A3558'), muted: hex('#6E7AA3'), label: hex('#7A86A8'), white: hex('#FFFFFF'),
  logo: hex('#0C326A'), leaf: hex('#89B252'), line: hex('#E3E8F2'),
  blueBg: hex('#EBF4FE'), blueIcon: hex('#D5E9FE'), blue: hex('#1E7BE6'), blueBadge: hex('#4AA6F7'),
  greenBg: hex('#EDF7F1'), greenIcon: hex('#DCF0E4'), green: hex('#2E9A5C'), greenBadge: hex('#3DAA6B'),
  yellowBg: hex('#FEF8E6'), yellowIcon: hex('#FFEFC2'), yellow: hex('#F2A22C'), yellowBadge: hex('#F6B03E'),
  purpleBg: hex('#F3EFFD'), purpleIcon: hex('#E4DAFD'), purple: hex('#7B4FD6'),
  redBg: hex('#FDEFEA'), red: hex('#F0682A'),
};
const THEMES = [
  { bg: C.yellowBg, icon: C.yellowIcon, accent: C.yellow, badge: C.yellowBadge },
  { bg: C.blueBg, icon: C.blueIcon, accent: C.blue, badge: C.blueBadge },
  { bg: C.greenBg, icon: C.greenIcon, accent: C.green, badge: C.greenBadge },
];

/* ---------- icons (24x24 stroke paths, Lucide-style) ---------- */
const circ = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`;
const rr = (x, y, w, h, r) => `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
const ICON = {
  target: [circ(12, 12, 9.5), circ(12, 12, 5.5), circ(12, 12, 1.5), 'M12 12 L20 4', 'M16.5 3.5 H20.5 V7.5'].join(' '),
  bulb: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4',
  calendar: ['M8 2v4 M16 2v4', rr(3, 4, 18, 18, 2), 'M3 10h18'].join(' '),
  refresh: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M8 16H3v5',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  seed: 'M7 20h10 M10 20c5.5-2.5.8-6.4 3-10 M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  sun: [circ(12, 12, 4), 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41'].join(' '),
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circ(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'].join(' '),
  chart: [rr(4, 12, 4, 8, 1), rr(10, 7, 4, 13, 1), rr(16, 3, 4, 17, 1)].join(' '),
  star: 'M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z',
  chat: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z M8 12h.01 M12 12h.01 M16 12h.01',
  clock: [circ(12, 12, 10), 'M12 6v6l4 2'].join(' '),
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  user: [circ(12, 8, 4), 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1'].join(' '),
  battery: [rr(2, 7, 16, 10, 2), 'M22 11v2 M6 11v2'].join(' '),
  shuffle: 'M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22 M18 2l4 4-4 4 M2 6h1.9c1.5 0 2.9.9 3.6 2.2 M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8 M18 14l4 4-4 4',
  check: 'M20 6L9 17l-5-5',
  brain: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z M12 5v13',
};

/* ---------- text helpers ---------- */
const TYPO = s => String(s)
  .replace(/(^|[\s(“])'/g, '$1‘').replace(/'/g, '’')
  .replace(/"([^"]*)"/g, '“$1”').replace(/—/g, '-').replace(/ /g, ' ');

function makeKit(page, F) {
  const safe = (font, s) => {
    let out = '';
    for (const ch of TYPO(s)) { try { font.encodeText(ch); out += ch; } catch { out += ch === '\t' ? ' ' : ''; } }
    return out;
  };
  const width = (font, s, size) => font.widthOfTextAtSize(safe(font, s), size);
  // Rich text: **bold** segments. Returns lines of [{t, bold}]
  function layout(text, size, maxW, bold = false) {
    const parts = [];
    String(text).split(/(\*\*[^*]+\*\*)/).forEach(seg => {
      if (!seg) return;
      const b = seg.startsWith('**') ? true : bold;
      const t = seg.replace(/^\*\*|\*\*$/g, '');
      t.split(/(\s+)/).forEach(w => { if (w) parts.push({ t: w, bold: b }); });
    });
    const lines = []; let line = [], lw = 0;
    for (const p of parts) {
      const f = p.bold ? F.bold : F.reg;
      const isSpace = /^\s+$/.test(p.t);
      const ww = width(f, isSpace ? ' ' : p.t, size);
      if (!isSpace && lw + ww > maxW && line.length) { while (line.length && /^\s+$/.test(line[line.length - 1].t)) line.pop(); lines.push(line); line = []; lw = 0; }
      if (isSpace && !line.length) continue;
      line.push({ t: isSpace ? ' ' : p.t, bold: p.bold }); lw += ww;
    }
    if (line.length) lines.push(line);
    return lines;
  }
  function text(str, x, top, o = {}) {
    const size = o.size || 10, lh = o.lh || size * 1.38, color = o.color || C.body, maxW = o.w || CW;
    const lines = layout(str, size, maxW, !!o.bold);
    lines.forEach((line, i) => {
      let cx = x;
      const lineW = line.reduce((s, p) => s + width(p.bold ? F.bold : F.reg, p.t, size), 0);
      if (o.align === 'right') cx = x + maxW - lineW;
      // merge consecutive tokens with the same weight into one run, so viewers space words natively
      const runs = [];
      for (const p of line) { const last = runs[runs.length - 1]; if (last && last.bold === p.bold) last.t += p.t; else runs.push({ t: p.t, bold: p.bold }); }
      for (const p of runs) {
        const f = p.bold ? F.bold : F.reg;
        const t = safe(f, p.t);
        page.drawText(t, { x: cx, y: H - top - size * 0.86 - i * lh, size, font: f, color: (p.bold && o.boldColor) || color });
        cx += f.widthOfTextAtSize(t, size);
      }
    });
    return lines.length ? (lines.length - 1) * lh + size * 1.12 : 0;
  }
  const measure = (str, o = {}) => { const size = o.size || 10, lh = o.lh || size * 1.38; const n = layout(str, size, o.w || CW, !!o.bold).length; return n ? (n - 1) * lh + size * 1.12 : 0; };
  function caps(str, x, top, o = {}) {
    const size = o.size || 7.5, sp = o.spacing ?? 1.4, f = o.bold === false ? F.reg : F.bold;
    const s = safe(f, String(str).toUpperCase());
    let cx = x;
    if (o.align === 'right') { const tw = [...s].reduce((a, ch) => a + f.widthOfTextAtSize(ch, size) + sp, -sp); cx = x - tw; }
    for (const ch of s) { page.drawText(ch, { x: cx, y: H - top - size * 0.86, size, font: f, color: o.color || C.label }); cx += f.widthOfTextAtSize(ch, size) + sp; }
    return size * 1.2;
  }
  const box = (x, top, w, h, color, r = 10, border) => page.drawSvgPath(rr(0, 0, w, h, Math.min(r, h / 2, w / 2)), { x, y: H - top, color, borderColor: border, borderWidth: border ? 0.8 : 0 });
  const dot = (cx, cy, r, color) => page.drawCircle({ x: cx, y: H - cy, size: r, color });
  const icon = (name, cx, cy, size, color, sw = 1.8) => page.drawSvgPath(ICON[name], { x: cx - size / 2, y: H - (cy - size / 2), scale: size / 24, borderColor: color, borderWidth: sw, borderLineCap: LineCapStyle.Round });
  const badge = (n, cx, cy, r, fill, color = C.white, size) => { dot(cx, cy, r, fill); const s = size || r * 1.05; const t = String(n); page.drawText(t, { x: cx - F.bold.widthOfTextAtSize(t, s) / 2, y: H - cy - s * 0.36, size: s, font: F.bold, color }); };
  const vline = (x, top, h, color, w = 1) => page.drawLine({ start: { x, y: H - top }, end: { x, y: H - top - h }, thickness: w, color });
  const hline = (x, top, w, color, th = 0.6, dash) => page.drawLine({ start: { x, y: H - top }, end: { x: x + w, y: H - top }, thickness: th, color, dashArray: dash });
  return { text, measure, caps, box, dot, icon, badge, vline, hline, width: (s, size, bold) => width(bold ? F.bold : F.reg, s, size), safe };
}

function header(k, page, F, n) {
  const lh = 22; page.drawImage(F.logo, { x: M, y: H - 30 - lh, width: lh * LOGO_RATIO, height: lh });
  k.caps('Your personalised report', W - M, 36, { align: 'right', size: 7, spacing: 1.3 });
  if (n) k.caps(`Page ${n} of 5`, W - M, 47, { align: 'right', size: 7, spacing: 1.3 });
}

/* ---------------------------------------------------------------- */
export async function renderReportPdf(r) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${r.name ? r.name + ', your' : 'Your'} Navoo personalised report`);
  doc.setAuthor('Navoo'); doc.setCreator('Navoo'); doc.setProducer('Navoo');
  const F = { reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), logo: await doc.embedPng(Buffer.from(LOGO_PNG_B64, 'base64')) };
  // A name that Helvetica can't draw (e.g. non-Latin script) is left out rather than shown broken
  let name = r.name || '';
  try { F.bold.encodeText(name); } catch { name = ''; }
  if (name === 'Friend') name = '';
  const overflow = [];
  const check = (top, label) => { if (top > H - 28) overflow.push(`${label} ${Math.round(top)}`); };

  /* ================= PAGE 1 ================= */
  {
    const page = doc.addPage([W, H]); const k = makeKit(page, F); header(k, page, F);
    let y = 84;
    if (name) y += k.text(`${name},`, M, y, { size: 26, bold: true, color: C.navy, w: 470 }) + 4;
    y += k.text(name ? 'here’s what we’ve learned about you.' : 'Here’s what we’ve learned about you.', M, y, { size: 26, bold: true, color: C.navy, lh: 30, w: 520 }) + 10;
    y += k.text('Based on your answers, this report shows what may be getting in the way of your goals, and how to make progress easier for you.', M, y, { size: 12, color: C.muted, lh: 16, w: 470 }) + 18;
    // 30-day focus
    const fh = 92; k.box(M, y, CW, fh, C.blueBg, 12);
    k.dot(M + 52, y + fh / 2, 30, C.blueIcon); k.icon('target', M + 52, y + fh / 2, 30, C.blue, 2);
    const fx = M + 102, fw = CW - 120;
    let fy = y + 16; fy += k.caps('Your 30-day focus', fx, fy, { color: C.muted }) + 6;
    fy += k.text(r.focus.title, fx, fy, { size: 19, bold: true, color: C.navy, w: fw }) + 5;
    k.text(r.focus.desc, fx, fy, { size: 10.5, color: C.muted, lh: 14, w: fw });
    y += fh + 22;
    // Left column: big picture
    const lx = M, lw = 300, rx = M + 318, rw = CW - 318;
    let ly = y;
    ly += k.text('The big picture', lx, ly, { size: 20, bold: true, color: C.navy }) + 12;
    r.bigPicture.forEach(p => { ly += k.text(p, lx, ly, { size: 10.5, lh: 15, w: lw, boldColor: C.navy }) + 10; });
    const ch = k.measure(r.callout, { size: 10.5, bold: true, lh: 14.5, w: lw - 78 }) + 30;
    k.box(lx, ly, lw, ch, C.yellowBg, 10); k.dot(lx + 30, ly + ch / 2, 18, C.yellowIcon); k.icon('bulb', lx + 30, ly + ch / 2, 20, C.yellow, 1.8);
    k.vline(lx + 58, ly + 14, ch - 28, hex('#F3D79A'));
    k.text(r.callout, lx + 68, ly + 15, { size: 10.5, bold: true, color: C.navy, lh: 14.5, w: lw - 78 });
    ly += ch + 12;
    ly += k.text(r.closing, lx, ly, { size: 10.5, lh: 15, w: lw });
    check(ly, 'p1 left');
    // Right column: current pattern
    const stepH = r.pattern.map(s => Math.max(26, k.measure(s, { size: 9.5, lh: 12, w: rw - 74 }) + 14));
    const ph = 50 + stepH.reduce((a, b) => a + b, 0) + (r.pattern.length - 1) * 12 + 14;
    k.box(rx, y, rw, ph, C.greenBg, 12);
    k.caps('Your current pattern', rx + 14, y + 16, { color: C.muted });
    k.text('Here’s what tends to happen.', rx + 14, y + 30, { size: 11, bold: true, color: C.navy, w: rw - 28 });
    let sy = y + 52;
    r.pattern.forEach((s, i) => {
      const h = stepH[i];
      k.badge(i + 1, rx + 28, sy + h / 2, 11, C.greenIcon, C.green, 11);
      k.box(rx + 50, sy, rw - 62, h, C.white, 7);
      k.text(s, rx + 60, sy + (h - k.measure(s, { size: 9.5, lh: 12, w: rw - 74 })) / 2, { size: 9.5, lh: 12, w: rw - 74, color: C.body });
      sy += h;
      if (i < r.pattern.length - 1) { page.drawSvgPath('M0 0 V7 M-3 4 L0 7 L3 4', { x: rx + 28, y: H - (sy + 2), borderColor: C.muted, borderWidth: 0.9 }); sy += 12; }
    });
    check(y + ph, 'p1 right');
  }

  /* ================= PAGE 2 ================= */
  {
    const page = doc.addPage([W, H]); const k = makeKit(page, F); header(k, page, F, 2);
    let y = 80;
    y += k.text('What’s really getting in your way?', M, y, { size: 26, bold: true, color: C.navy, w: 420, lh: 30 }) + 8;
    y += k.text('Based on your answers, we can see three main things that are making it harder for you to follow through.', M, y, { size: 12, color: C.muted, lh: 16, w: 460 }) + 18;
    const gap = 12, cw = (CW - gap * 2) / 3;
    const hs = r.blockers.map(b => 50 + k.measure(b.title, { size: 11.5, bold: true, lh: 14, w: cw - 28 }) + 8 + k.measure(b.text, { size: 9.5, lh: 13, w: cw - 28 }) + 16);
    const bh = Math.max(...hs);
    r.blockers.forEach((b, i) => {
      const x = M + i * (cw + gap), t = THEMES[i];
      k.box(x, y, cw, bh, t.bg, 12);
      k.badge(i + 1, x + 26, y + 26, 12, t.badge, C.white, 11);
      let by = y + 50; by += k.text(b.title, x + 14, by, { size: 11.5, bold: true, color: C.navy, lh: 14, w: cw - 28 }) + 8;
      k.text(b.text, x + 14, by, { size: 9.5, lh: 13, w: cw - 28 });
    });
    y += bh + 14;
    // Key insight
    const ih = 30 + k.measure(r.insight.join(' '), { size: 12.5, bold: true, lh: 16, w: CW - 130 }) + 20;
    k.box(M, y, CW, ih, C.purpleBg, 12); k.dot(M + 46, y + ih / 2, 26, C.purpleIcon); k.icon('target', M + 46, y + ih / 2, 28, C.purple, 2);
    k.vline(M + 88, y + 16, ih - 32, hex('#CDBDF5'));
    k.caps('The key insight', M + 104, y + 16, { color: C.muted });
    k.text(r.insight.join(' '), M + 104, y + 32, { size: 12.5, bold: true, color: C.navy, lh: 16, w: CW - 130 });
    y += ih + 20;
    // Follow-through pattern table
    y += k.caps('Your follow-through pattern', M, y, { color: C.muted, size: 8 }) + 8;
    const rows = [['target', 'What you want', r.table.want, C.blueBg, C.blue], ['clock', 'When you’re most vulnerable', r.table.vulnerable, C.yellowBg, C.yellow],
      ['bolt', 'What gets in the way', r.table.getsInWay, C.redBg, C.red], ['star', 'What helps you', r.table.helps, C.greenBg, C.green],
      ['users', 'What you prefer when things go wrong', r.table.prefer, C.purpleBg, C.purple]];
    const colX = M + 220, colW = CW - 220 - 16;
    rows.forEach(([ic, lab, val, bg, ac]) => {
      const h = Math.max(32, Math.max(k.measure(val, { size: 9.5, lh: 12.5, w: colW }), k.measure(lab, { size: 9.5, bold: true, lh: 12, w: 150 })) + 18);
      k.box(M, y, CW, h, bg, 8); k.icon(ic, M + 22, y + h / 2, 15, ac, 1.8);
      k.text(lab, M + 44, y + (h - k.measure(lab, { size: 9.5, bold: true, lh: 12, w: 150 })) / 2, { size: 9.5, bold: true, color: C.navy, lh: 12, w: 150 });
      k.vline(colX - 14, y + 8, h - 16, hex('#C9D2E3'));
      k.text(val, colX, y + (h - k.measure(val, { size: 9.5, lh: 12.5, w: colW })) / 2, { size: 9.5, lh: 12.5, w: colW });
      y += h + 6;
    });
    check(y, 'p2');
  }

  /* ================= PAGE 3 ================= */
  {
    const page = doc.addPage([W, H]); const k = makeKit(page, F); header(k, page, F, 3);
    let y = 80;
    y += k.text('Your 3 personalised brain cheat codes', M, y, { size: 26, bold: true, color: C.navy, w: 430, lh: 30 }) + 8;
    y += k.text(r.codesIntro, M, y, { size: 12, color: C.muted, lh: 16, w: 470 }) + 16;
    const lx = M + 44, lw = 262, tx = M + 330, tw = CW - 330 - 10;
    // Measure all three blocks at a given scale; shrink until they fit on the page
    const dims = sc => r.codes.map(c => {
      const fsE = 9.5 * sc, lhE = 13 * sc, fsT = 15 * sc, lhT = 18 * sc, fsTip = 9 * sc, lhTip = 12 * sc, pad = 24 * sc;
      const callH = Math.max(36 * sc, k.measure(c.callout, { size: fsE, bold: true, lh: 12.5 * sc, w: lw - 60 }) + 20 * sc);
      const leftH = 24 * sc + k.measure(c.title, { size: fsT, bold: true, lh: lhT, w: lw }) + 6 * sc + k.measure(c.explain, { size: fsE, lh: lhE, w: lw }) + 10 * sc + callH;
      const tipHs = c.tips.map(tp => Math.max(24 * sc, k.measure(tp, { size: fsTip, lh: lhTip, w: tw - 56 }) + 11 * sc));
      const rightH = 30 * sc + tipHs.reduce((a, b) => a + b, 0) + 10 * sc;
      return { sc, fsE, lhE, fsT, lhT, fsTip, lhTip, pad, callH, tipHs, h: Math.max(leftH, rightH) + pad };
    });
    const avail = H - 34 - y;
    let sc = 1, D = dims(sc);
    const total = d => d.reduce((a, b) => a + b.h, 0) + 2 * 10;
    while (total(D) > avail && sc > 0.8) { sc = Math.round((sc - 0.03) * 100) / 100; D = dims(sc); }
    r.codes.forEach((c, i) => {
      const t = THEMES[i], d = D[i], h = d.h;
      k.box(M, y, CW, h, t.bg, 14);
      k.badge(i + 1, M + 22, y + 24, 12, t.badge, C.white, 12);
      let cy = y + 14 * d.sc;
      cy += k.caps(`Brain cheat code 0${i + 1}`, lx, cy, { color: C.muted }) + 6 * d.sc;
      cy += k.text(c.title, lx, cy, { size: d.fsT, bold: true, color: C.navy, lh: d.lhT, w: lw }) + 6 * d.sc;
      cy += k.text(c.explain, lx, cy, { size: d.fsE, lh: d.lhE, w: lw }) + 10 * d.sc;
      k.box(lx - 30, cy, lw + 30, d.callH, t.icon, 10);
      k.dot(lx - 6, cy + d.callH / 2, 15, C.white); k.icon(c.icon, lx - 6, cy + d.callH / 2, 17, t.accent, 1.8);
      const cm = k.measure(c.callout, { size: d.fsE, bold: true, lh: 12.5 * d.sc, w: lw - 60 });
      k.text(c.callout, lx + 20, cy + (d.callH - cm) / 2, { size: d.fsE, bold: true, color: C.navy, lh: 12.5 * d.sc, w: lw - 60 });
      const th = h - 20 * d.sc; k.box(tx, y + 10 * d.sc, tw, th, C.white, 10);
      k.caps('Your tailored tips', tx + 14, y + 24 * d.sc, { color: C.muted });
      let ty = y + 40 * d.sc;
      c.tips.forEach((tp, j) => {
        const hh = d.tipHs[j];
        const tm = k.measure(tp, { size: d.fsTip, lh: d.lhTip, w: tw - 56 });
        k.badge(j + 1, tx + 24, ty + hh / 2 - 1, 10, t.icon, t.accent, 10);
        k.text(tp, tx + 42, ty + (hh - tm) / 2 - 1, { size: d.fsTip, lh: d.lhTip, w: tw - 56 });
        ty += hh;
        if (j < 2) k.hline(tx + 14, ty - 1, tw - 28, C.line);
      });
      y += h + 10;
    });
    check(y - 10, 'p3');
  }

  /* ================= PAGE 4 ================= */
  {
    const page = doc.addPage([W, H]); const k = makeKit(page, F); header(k, page, F, 4);
    let y = 80;
    y += k.text(name ? `${name}, here’s your first micro-action.` : 'Here’s your first micro-action.', M, y, { size: 26, bold: true, color: C.navy, w: 440, lh: 30 }) + 8;
    y += k.text(r.micro.subtitle, M, y, { size: 12, color: C.muted, lh: 16, w: 500 }) + 16;
    const mu = r.micro;
    // 1. First action
    {
      const lw = 262, lx = M + 48, rx = M + 336, rw = CW - 336 - 12;
      const lh = 16 + 14 + k.measure(mu.title, { size: 14, bold: true, lh: 17, w: lw }) + 8 + k.measure(mu.desc, { size: 9.5, lh: 13, w: lw }) + 16;
      const h = Math.max(lh, 150);
      k.box(M, y, CW, h, C.blueBg, 14); k.badge(1, M + 24, y + 26, 13, C.blueBadge, C.white, 12);
      let cy = y + 16; cy += k.caps('Your first action', lx, cy, { color: C.muted }) + 6;
      cy += k.text(mu.title, lx, cy, { size: 14, bold: true, color: C.navy, lh: 17, w: lw }) + 8;
      k.text(mu.desc, lx, cy, { size: 9.5, lh: 13, w: lw });
      k.text(mu.list, rx, y + 18, { size: 10.5, bold: true, color: C.navy, w: rw });
      const slotH = 30, start = y + 38, gapS = Math.min(8, (h - 38 - 12 - slotH * 3) / 2);
      for (let i = 0; i < 3; i++) { const sy = start + i * (slotH + gapS); k.box(rx, sy, rw, slotH, C.white, 7); k.badge(i + 1, rx + 17, sy + slotH / 2, 10, C.blueIcon, C.blue, 10); k.hline(rx + 36, sy + slotH / 2 + 5, rw - 50, C.muted, 0.6, [1.2, 1.6]); }
      y += h + 10;
    }
    // 2. Fallback plan
    {
      const lw = 262, lx = M + 48, rx = M + 330, rw = CW - 330 - 10;
      const ideasH = 30 + mu.fallbackIdeas.reduce((a, t) => a + k.measure(t, { size: 9, lh: 11.5, w: rw - 40 }) + 5, 0) + 8;
      const leftH = 16 + 14 + k.measure(mu.fallbackLead, { size: 14, bold: true, lh: 17, w: lw }) + 10 + 30 + 10 + k.measure(mu.fallbackNote, { size: 9.5, lh: 13, w: lw }) + 16;
      const h = Math.max(leftH, ideasH + 20);
      k.box(M, y, CW, h, C.yellowBg, 14); k.badge(2, M + 24, y + 26, 13, C.yellowBadge, C.white, 12);
      let cy = y + 16; cy += k.caps('Your fallback plan', lx, cy, { color: C.muted }) + 6;
      cy += k.text(mu.fallbackLead, lx, cy, { size: 14, bold: true, color: C.navy, lh: 17, w: lw }) + 10;
      k.box(lx - 6, cy, lw + 6, 30, C.white, 7); k.hline(lx + 6, cy + 20, lw - 18, C.muted, 0.6, [1.2, 1.6]); cy += 40;
      k.text(mu.fallbackNote, lx, cy, { size: 9.5, lh: 13, w: lw });
      k.box(rx, y + 10, rw, h - 20, hex('#FFF1CF'), 10);
      k.dot(rx + 20, y + 30, 11, C.white); k.icon('bulb', rx + 20, y + 30, 13, C.yellow, 1.6);
      k.caps('Ideas for a realistic fallback', rx + 36, y + 27, { color: C.muted, size: 6.4, spacing: 0.8 });
      let iy = y + 48;
      mu.fallbackIdeas.forEach(t => { k.icon('check', rx + 20, iy + 5, 9, C.navy, 2); iy += k.text(t, rx + 32, iy, { size: 9, lh: 11.5, w: rw - 40 }) + 5; });
      y += h + 10;
    }
    // 3. When real life happens
    {
      const tiles = mu.scenarios, gap = 8, tw = (CW - 24 - gap * 3) / 4;
      const tileH = Math.max(...tiles.map(s => 36 + k.measure(s.title, { size: 9, bold: true, lh: 11, w: tw - 16 }) + 4 + k.measure(s.text, { size: 8.5, lh: 11, w: tw - 16 }) + 10));
      const h = 16 + 14 + 22 + k.measure('Life won’t always go as planned, and that’s okay. The goal is not perfection. It’s progress, even when things are busy, tiring or unexpected.', { size: 9.5, lh: 13, w: CW - 60 }) + 12 + tileH + 14;
      k.box(M, y, CW, h, C.greenBg, 14); k.badge(3, M + 24, y + 26, 13, C.greenBadge, C.white, 12);
      let cy = y + 16; cy += k.caps('When real life happens', M + 48, cy, { color: C.muted }) + 6;
      cy += k.text('Don’t throw the plan away. Adapt it.', M + 48, cy, { size: 14, bold: true, color: C.navy, w: CW - 60 }) + 8;
      cy += k.text('Life won’t always go as planned, and that’s okay. The goal is not perfection. It’s progress, even when things are busy, tiring or unexpected.', M + 48, cy, { size: 9.5, lh: 13, w: CW - 60 }) + 12;
      const icons = ['battery', 'clock', 'shuffle', 'target'];
      tiles.forEach((s, i) => {
        const x = M + 12 + i * (tw + gap);
        k.box(x, cy, tw, tileH, hex('#F7FCF9'), 9, hex('#D5EBDD'));
        k.dot(x + 18, cy + 18, 11, C.greenIcon); k.icon(icons[i], x + 18, cy + 18, 13, C.green, 1.6);
        let ty = cy + 36; ty += k.text(s.title, x + 8, ty, { size: 9, bold: true, color: C.navy, lh: 11, w: tw - 16 }) + 4;
        k.text(s.text, x + 8, ty, { size: 8.5, lh: 11, w: tw - 16 });
      });
      y += h + 10;
    }
    // Closing
    const clh = 52; k.box(M, y, CW, clh, C.purpleBg, 12);
    k.dot(M + 36, y + clh / 2, 17, C.purpleIcon); k.icon('star', M + 36, y + clh / 2, 18, C.purple, 1.6);
    k.vline(M + 66, y + 12, clh - 24, hex('#CDBDF5'));
    k.text(mu.closing[0], M + 80, y + 13, { size: 12, bold: true, color: C.purple, w: CW - 100 });
    k.text(mu.closing[1], M + 80, y + 29, { size: 11, color: C.navy, w: CW - 100 });
    y += clh;
    check(y, 'p4');
  }

  /* ================= PAGE 5 ================= */
  {
    const page = doc.addPage([W, H]); const k = makeKit(page, F); header(k, page, F, 5);
    let y = 86;
    k.caps('This is just the start.', M, y, { color: C.muted, size: 8.5, spacing: 1.6 }); y += 18;
    k.text('Meet Navoo.', M, y, { size: 34, bold: true, color: C.navy });
    let ly = y + 48;
    const lw = 250;
    ly += k.text('We’re building Navoo to give you this kind of personalised support as you work towards your goals.', M, ly, { size: 11.5, color: C.muted, lh: 15.5, w: lw }) + 22;
    ['Navoo gets to know your life and uses behavioural science to suggest small, practical actions that feel doable for you.',
      'As you go, it learns what helps you follow through, what gets in your way, and adapts when real life happens.',
      'So instead of generic advice, you get personalised support that fits your routine, your challenges and your goals.']
      .forEach(p => { ly += k.text(p, M, ly, { size: 10.5, lh: 15, w: lw }) + 14; });
    const rx = M + 272, rw = CW - 272;
    let ry = y - 6;
    [['user', 'Personalised', 'It gets to know your life, your routines and what tends to get in your way.', C.blueBg, C.blueIcon, C.blue],
      ['brain', 'Psychology-led', 'Uses behavioural science to suggest small, practical actions that feel doable for you.', C.greenBg, C.greenIcon, C.green],
      ['chart', 'Adaptive', 'Learns from what’s working and adapts when real life happens.', C.yellowBg, C.yellowIcon, C.yellow],
      ['chat', 'Conversational', 'You can tell it what’s actually happening and get support in the moment.', C.purpleBg, C.purpleIcon, C.purple]]
      .forEach(([ic, t, d, bg, ib, ac]) => {
        const h = Math.max(70, 26 + k.measure(d, { size: 9.5, lh: 12.5, w: rw - 92 }) + 16);
        k.box(rx, ry, rw, h, bg, 12); k.dot(rx + 38, ry + h / 2, 22, ib); k.icon(ic, rx + 38, ry + h / 2, 22, ac, 1.7);
        k.text(t, rx + 76, ry + 14, { size: 12, bold: true, color: C.navy, w: rw - 92 });
        k.text(d, rx + 76, ry + 31, { size: 9.5, lh: 12.5, w: rw - 92 });
        ry += h + 10;
      });
    let y2 = Math.max(ly, ry) + 14;
    const bh = 96; k.box(M, y2, CW, bh, C.greenBg, 14);
    k.dot(M + 52, y2 + bh / 2, 30, C.greenIcon); k.icon('calendar', M + 52, y2 + bh / 2, 30, C.green, 1.8);
    k.vline(M + 100, y2 + 18, bh - 36, hex('#A8D8BB'));
    k.caps('Navoo is launching soon.', M + 116, y2 + 20, { color: C.muted });
    k.text('You’re already on our list.', M + 116, y2 + 34, { size: 20, bold: true, color: C.navy, w: CW - 140 });
    k.text('We’ll keep you posted and let you know when Navoo is ready to use.', M + 116, y2 + 62, { size: 10.5, color: C.muted, w: CW - 140 });
    y2 += bh + 30;
    page.drawImage(F.logo, { x: M, y: H - y2 - 26, width: 26 * LOGO_RATIO, height: 26 });
    k.text('Your goals, made doable.', M, y2 + 32, { size: 12, color: C.muted });
    k.text('This report gives general wellbeing guidance based on your answers. It isn’t medical advice. If you have a health condition, speak to a healthcare professional before making changes.', M, H - 58, { size: 7.5, color: C.label, lh: 10, w: CW });
    check(y2 + 50, 'p5');
  }

  const bytes = await doc.save();
  return { bytes, overflow };
}
