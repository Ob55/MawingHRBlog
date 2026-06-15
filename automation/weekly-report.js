#!/usr/bin/env node
/* automation/weekly-report.js
 *
 * Emails a weekly analytics + activity summary to the Mawingu HR admin instead
 * of building a dashboard on the website. It:
 *   1. pulls site view stats from the main website's GET /api/stats endpoint
 *      (total views, unique visits, top pages, top blog posts by views),
 *   2. reads the blog activity log (analytics/events.json) for the last 7 days
 *      (drafts created / approved / rejected / regenerated),
 *   3. counts the posts currently live (from /api/posts),
 *   4. composes an HTML email and sends it over SMTP (shared ../api/_mail).
 *
 * Zero dependencies — Node 18+ global fetch. Run weekly by the GitHub Action in
 * .github/workflows/weekly-report.yml, or by hand for testing.
 *
 * Config (env / .env):
 *   SITE_STATS_URL   main site stats endpoint (default below)
 *   STATS_TOKEN      shared secret guarding /api/stats (must match the main site)
 *   REPORT_EMAIL_TO  recipient (default admin@mawinguhrsolutions.co.ke)
 *   BLOG_POSTS_URL   live posts feed (default below)
 *   MAIL_*           SMTP credentials (see ../api/_mail.js)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { sendMail, escapeHtml } = require('../api/_mail');

const REPORT_TO = process.env.REPORT_EMAIL_TO || 'admin@mawinguhrsolutions.co.ke';
const STATS_URL =
  process.env.SITE_STATS_URL || 'https://www.mawinguhrsolutions.co.ke/api/stats';
const POSTS_URL =
  process.env.BLOG_POSTS_URL || 'https://mawing-hr-blog.vercel.app/api/posts';
const EVENTS_FILE = path.join(__dirname, '..', 'analytics', 'events.json');
const RANGE_DAYS = 7;

function loadDotEnv() {
  for (const file of ['.env', '.env.local']) {
    const p = path.join(__dirname, '..', file);
    if (!fs.existsSync(p)) continue;
    for (const rawLine of fs.readFileSync(p, 'utf8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

async function fetchStats() {
  try {
    const sep = STATS_URL.includes('?') ? '&' : '?';
    const token = process.env.STATS_TOKEN ? `&token=${encodeURIComponent(process.env.STATS_TOKEN)}` : '';
    const url = `${STATS_URL}${sep}days=${RANGE_DAYS}${token}`;
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`stats endpoint returned ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`! Could not read site stats (${e.message}).`);
    return null;
  }
}

async function fetchLivePostCount() {
  try {
    const res = await fetch(POSTS_URL, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`posts feed returned ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts.length : 0;
  } catch (e) {
    console.warn(`! Could not read posts feed (${e.message}).`);
    return null;
  }
}

function readActivity() {
  const counts = { drafted: 0, approved: 0, rejected: 0, regenerated: 0 };
  try {
    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    if (!Array.isArray(events)) return counts;
    const cutoff = Date.now() - RANGE_DAYS * 24 * 60 * 60 * 1000;
    for (const ev of events) {
      const t = new Date(ev.at || 0).getTime();
      if (!Number.isFinite(t) || t < cutoff) continue;
      if (ev.type in counts) counts[ev.type] += 1;
    }
  } catch (_) { /* no log yet → all zeros */ }
  return counts;
}

function fmt(n) {
  return typeof n === 'number' ? n.toLocaleString('en-GB') : '—';
}

function statRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#475569;font-size:14px;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#0B1E3F;font-size:18px;font-weight:bold;text-align:right;">${value}</td>
  </tr>`;
}

function listRows(items, nameKey, valueKey, emptyMsg) {
  if (!items || !items.length) {
    return `<tr><td colspan="2" style="padding:10px 0;color:#94a3b8;font-size:14px;">${emptyMsg}</td></tr>`;
  }
  return items
    .map(
      (it) => `<tr>
      <td style="padding:7px 0;color:#334155;font-size:14px;">${escapeHtml(it[nameKey] || '—')}</td>
      <td style="padding:7px 0;color:#0B1E3F;font-size:14px;font-weight:bold;text-align:right;">${fmt(it[valueKey])}</td>
    </tr>`
    )
    .join('');
}

function buildReportEmail({ stats, activity, livePosts, todayLabel }) {
  const totalViews = stats ? fmt(stats.totalViews) : '—';
  const uniqueVisits = stats ? fmt(stats.uniqueVisits) : '—';
  const topPages = stats ? stats.topPages : [];
  const topPosts = stats ? stats.topPosts : [];
  const statsNote = stats ? '' : '<p style="color:#b45309;font-size:13px;margin:0 0 18px;">⚠️ Site view stats were unavailable this week (the website /api/stats endpoint could not be reached).</p>';

  const subject = `📊 Mawingu HR — weekly website report (${todayLabel})`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0B1E3F;">
    <p style="font-size:14px;color:#64748b;margin:0 0 6px;">Mawingu HR — weekly report</p>
    <h1 style="font-size:22px;margin:0 0 4px;">Website &amp; blog summary</h1>
    <p style="font-size:13px;color:#94a3b8;margin:0 0 24px;">Last ${RANGE_DAYS} days · generated ${escapeHtml(todayLabel)}</p>

    ${statsNote}

    <h2 style="font-size:16px;margin:0 0 6px;color:#1E5BA8;">Website traffic</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin:0 0 26px;">
      ${statRow('Total page views', totalViews)}
      ${statRow('Unique visits (per day)', uniqueVisits)}
    </table>

    <h2 style="font-size:16px;margin:0 0 6px;color:#1E5BA8;">Top blog posts by views</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin:0 0 26px;">
      ${listRows(topPosts, 'title', 'views', 'No blog post opens recorded this week.')}
    </table>

    <h2 style="font-size:16px;margin:0 0 6px;color:#1E5BA8;">Top pages</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin:0 0 26px;">
      ${listRows(topPages, 'label', 'views', 'No page views recorded this week.')}
    </table>

    <h2 style="font-size:16px;margin:0 0 6px;color:#1E5BA8;">Blog activity</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin:0 0 8px;">
      ${statRow('New drafts created', fmt(activity.drafted))}
      ${statRow('Approved & published', fmt(activity.approved))}
      ${statRow('Rejected', fmt(activity.rejected))}
      ${statRow('Regenerated', fmt(activity.regenerated))}
      ${statRow('Posts currently live', livePosts === null ? '—' : fmt(livePosts))}
    </table>

    <p style="font-size:12px;color:#94a3b8;margin:26px 0 0;line-height:1.6;">
      This is an automated weekly summary from the Mawingu HR website. Unique visits count a
      visitor once per day; figures exclude known bots and crawlers.
    </p>
  </div>`.trim();

  return { subject, html };
}

async function main() {
  loadDotEnv();
  console.log('\n=== Mawingu HR weekly report ===\n');

  const [stats, livePosts] = [await fetchStats(), await fetchLivePostCount()];
  const activity = readActivity();
  const todayLabel = new Date().toISOString().slice(0, 10);

  console.log('Stats:', stats ? `${stats.totalViews} views` : 'unavailable');
  console.log('Activity:', JSON.stringify(activity));
  console.log('Live posts:', livePosts);

  const { subject, html } = buildReportEmail({ stats, activity, livePosts, todayLabel });

  const { to } = await sendMail({ to: REPORT_TO, subject, html });
  console.log(`\n✓ Weekly report sent to ${to}\n`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
