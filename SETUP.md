# Navoo quiz landing page - setup guide

A separate Netlify site with:
- the 5-section quiz landing page (phone + desktop)
- a 7-question behaviour-science quiz, scored in the browser and on the server (no AI, no API costs)
- a personalised 5-page PDF report for every submission: download on screen + emailed copy
- every submission saved to a Google Sheet (name, email, all 7 answers, focus, blockers, cheat codes, UTMs)
- Meta Pixel + Conversions API, GTM, GA4, Google Ads
- `/admin` to replace every image on the page

```
Browser ──► Netlify site ── /api/report ──► builds the PDF ──► Google Apps Script ──► Sheet row + emails the PDF
                                         └► Meta Conversions API (Lead)
```

## Step 1 - Google Sheet + email (10 min)
1. Create a new Google Sheet called **Navoo Quiz**.
2. **Extensions → Apps Script**, delete everything, paste all of `google-apps-script/Code.gs`.
3. On line 15 replace `PASTE-THE-SAME-SECRET-AS-NETLIFY` with a long random password (letters and numbers). Save.
4. Choose **setup** in the function dropdown → **Run** → allow permissions (it asks for Sheets and "send email as you").
5. **Deploy → New deployment → ⚙ Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → copy the URL ending in `/exec`.
6. Open the URL in your browser: you should see `{"ok":true,"service":"navoo-quiz",...,"emailsLeftToday":100}`.

Emails are sent from the Google account that owns the Sheet. A free Gmail account can send about **100 reports a day** this way (Google Workspace: about 1,500). Rows are always saved even after the limit; the "Report emailed" column shows what happened. People can always download the PDF on screen.

Don't commit your real secret to GitHub. Netlify blocks deploys that contain it.

## Step 2 - Netlify (5 min)
1. Netlify → **Add new project → Import from Git** → pick this repo. Build settings come from `netlify.toml`.
2. **Environment variables**:

| Key | Value |
|---|---|
| `SHEETS_WEBHOOK_URL` | the `/exec` URL |
| `SHEETS_SECRET` | the same secret as line 15 of Code.gs |
| `ADMIN_PASSWORD` | password for `/admin` |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | for Meta ads (optional) |
| `META_TEST_EVENT_CODE` | only while testing in Events Manager |
| `GTM_ID`, `GA4_ID`, `GOOGLE_ADS_ID`, `GOOGLE_ADS_LEAD_LABEL` | optional |

3. Deploy. Take the quiz on the live site and check: PDF downloads, email arrives, row appears in the Sheet.

## Tracking events
- Meta: `PageView`, custom `QuizComplete`, and `Lead` when the report is requested (browser + Conversions API, de-duplicated).
- GTM data layer: `cta_click`, `quiz_start`, `quiz_answer` (question, answer, step), `quiz_complete` (focus, top_blocker), `report_requested`, `waitlist_signup`.

## How the report is personalised
`site/engine.mjs` holds the questions and all report text. Each answer adds points to 10 behavioural factors (low energy, convenience, busy days, time, stress, all-or-nothing thinking, fading motivation, weekends, getting started, unclear next steps), based on the COM-B model and habit-loop research. The top 3 factors become "What's really getting in your way". The 3 brain cheat codes are picked from 11 evidence-based techniques (friction removal, if/then plans, never-miss-twice, habit stacking, tiny habits, stress outlet, weekend plan, one-change focus, social support, progress tracking, temptation bundling). The 30-day focus, pattern steps, tips, micro-action and fallback ideas adapt to the person's chosen area (dinners, snacking, portions, movement, drinks, sleep) and difficult moment. There are 112,500 answer combinations producing 22,500 distinct reports. All were checked for missing text, and a sample of 4,500 distinct reports was rendered to confirm none spills off a page.

To edit wording, change the text in `engine.mjs` and push.

## Images
`/admin` lists every image with its recommended size, on-page size and current dimensions. The hero photo needs the same shape (about 11:10) because the phone mockup sits over the lower-middle of it. Keep faces out of the dashed "phone" area shown in the admin.

## Netlify free plan
300 credits/month; each deploy costs about 15. Image changes in `/admin` don't need a deploy. Generating reports uses function time, roughly 0.3 seconds each, so thousands of reports fit in the free allowance.
