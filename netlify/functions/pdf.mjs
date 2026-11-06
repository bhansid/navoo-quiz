/*
 * GET /api/pdf?a=<7 answer ids joined by ".">&n=<first name>[&dl=1]
 * Generates the personalised report and returns it as a real PDF file:
 *   inline     -> opens in the browser's PDF viewer (new tab)
 *   dl=1       -> downloads as a file
 * No saving or emailing happens here, so it is always fast.
 */
import { QUESTIONS, buildReport, validateAnswers, cleanName } from '../../site/engine.mjs';
import { renderReportPdf } from '../../lib/pdf.mjs';

export default async (req) => {
  const url = new URL(req.url);
  const ids = String(url.searchParams.get('a') || '').split('.');
  const answers = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, ids[i]]));
  if (!validateAnswers(answers)) {
    return new Response('This report link is not valid. Please take the quiz again.', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const name = cleanName(url.searchParams.get('n'));
  const { bytes } = await renderReportPdf(buildReport(answers, name));
  const filename = `Navoo-report${name ? '-' + name.replace(/[^A-Za-z0-9-]/g, '') : ''}.pdf`;
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${url.searchParams.get('dl') === '1' ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'private, max-age=86400',
      'X-Robots-Tag': 'noindex',
    },
  });
};

export const config = { path: '/api/pdf' };
