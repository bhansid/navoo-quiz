/*
 * Every replaceable image on the quiz landing page.
 * The page loads each one from /img/<slot>; if nothing has been uploaded in /admin,
 * the default file in site/assets is served.
 */
export const SLOTS = {
  hero: {
    label: 'Hero photo',
    where: 'Section 1, right side (desktop) / below the headline (mobile)',
    shown: 'up to 700 × 640 desktop, full width on mobile',
    rec: { w: 1545, h: 1410 }, fit: 'cover', format: 'image/webp',
    defaultFile: '/assets/hero-couple.webp', defaultPos: '50% 50%',
    tip: 'Keep this shape (about 11:10). The phone mockup always sits over the lower-middle of the photo (from 48% to 80% across, 38% down to the bottom), so keep faces above or to the left of that area.',
  },
  struggle: {
    label: '“You know what to do” photo',
    where: 'Section 2, left side (desktop) / top of section (mobile)',
    shown: 'up to 760 × 540 desktop, full width on mobile',
    rec: { w: 1540, h: 1093 }, fit: 'cover', format: 'image/webp',
    defaultFile: '/assets/struggle.webp', defaultPos: '30% 50%',
    tip: 'Landscape photo. The right edge softly fades into the page on desktop.',
  },
  quiz: {
    label: 'Quiz photo',
    where: 'Section 3, left of the quiz (tablet and desktop only)',
    shown: 'up to 560 × 520',
    rec: { w: 1173, h: 960 }, fit: 'cover', format: 'image/webp',
    defaultFile: '/assets/quiz-desk.webp', defaultPos: '30% 50%',
  },
  avatar: {
    label: 'Chat avatar',
    where: 'Hero phone, next to the user’s message',
    shown: '≈ 28 × 28 (circle)',
    rec: { w: 160, h: 160 }, fit: 'cover', format: 'image/webp',
    defaultFile: '/assets/chat-avatar.webp', defaultPos: '50% 40%',
  },
  logo: {
    label: 'Logo (full)',
    where: 'Header and footer (footer shows it in white automatically)',
    shown: '≈ 150 × 38 header',
    rec: { w: 640, h: 160 }, fit: 'max', format: 'image/png',
    defaultFile: '/assets/navoo-logo.png', defaultPos: '50% 50%',
    tip: 'Transparent PNG, dark logo. Trim empty space around it.',
  },
  mark: {
    label: 'Logo icon',
    where: 'Browser tab icon and phone app headers',
    shown: '≈ 24 × 24',
    rec: { w: 256, h: 256 }, fit: 'max', format: 'image/png',
    defaultFile: '/assets/navoo-mark.png', defaultPos: '50% 50%',
    tip: 'Transparent PNG, dark icon, roughly square.',
  },
  'mark-white': {
    hidden: true, label: 'Logo icon (white)', rec: { w: 256, h: 256 }, fit: 'max', format: 'image/png',
    defaultFile: '/assets/navoo-mark-white.png', defaultPos: '50% 50%',
  },
  og: {
    label: 'Social share image',
    where: 'Preview when the link is shared on WhatsApp, Facebook, LinkedIn…',
    shown: '1200 × 630 (not visible on the page)',
    rec: { w: 1200, h: 630 }, fit: 'cover', format: 'image/jpeg',
    defaultFile: '/assets/og.jpg', defaultPos: '50% 30%',
  },
};

export const ALLOWED_TYPES = ['image/webp', 'image/png', 'image/jpeg'];
export const MAX_BYTES = 4 * 1024 * 1024;
