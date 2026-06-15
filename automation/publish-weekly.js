#!/usr/bin/env node
/* automation/publish-weekly.js
 *
 * Drafts ONE new blog post per run and sends it for approval by:
 *   1. picking the next unused article from automation/articles.js
 *      (deduped against the live /api/posts feed AND published-log.json),
 *   2. fetching a relevant HD cover image from the free Pexels API,
 *   3. POSTing it to the /api/draft endpoint, which stages the post as HIDDEN
 *      and emails the approver an Approve / Reject link.
 *   4. recording the title in published-log.json so it is never offered twice.
 *
 * The post does NOT go live here — it only appears on the website after the
 * approver opens the "Approve & publish" link in that email (/api/approve).
 *
 * Zero dependencies — uses Node 18+ global fetch. Run weekly via the GitHub
 * Action in .github/workflows/weekly-blog.yml, or by hand for testing.
 *
 * Usage:
 *   node automation/publish-weekly.js            # draft one post + email for approval now
 *   node automation/publish-weekly.js --dry-run  # pick + fetch image, but do NOT draft/email
 *
 * Config (env, or a local .env file in this repo root):
 *   PEXELS_API_KEY   (required)  free key from https://www.pexels.com/api/
 *   BLOG_DRAFT_URL   (optional)  defaults to the live Vercel draft endpoint
 *   BLOG_POSTS_URL   (optional)  defaults to the live Vercel posts endpoint
 *
 * (SMTP credentials and the recipient are configured via env / .env — see
 *  automation/send-email.js and the README.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { articles } = require('./articles');
const { sendApprovalEmail } = require('./send-email');

const DRY_RUN = process.argv.includes('--dry-run');
const LOG_PATH = path.join(__dirname, 'published-log.json');

const DRAFT_URL =
  process.env.BLOG_DRAFT_URL || 'https://mawing-hr-blog.vercel.app/api/draft';
const POSTS_URL =
  process.env.BLOG_POSTS_URL || 'https://mawing-hr-blog.vercel.app/api/posts';

// ---------------------------------------------------------------------------
// Tiny zero-dependency .env loader (only fills vars that aren't already set).
// Mirrors how the repo already uses .env.local for `vercel dev`.
// ---------------------------------------------------------------------------
function loadDotEnv() {
  for (const file of ['.env', '.env.local']) {
    const p = path.join(__dirname, '..', file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

// Normalise a title so dedup is case/space tolerant.
function norm(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readLog() {
  try {
    const data = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function appendToLog(entry) {
  const log = readLog();
  log.push(entry);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

// Pull the titles of everything already live so we never duplicate, even if the
// local log was lost. Failure here is non-fatal — we fall back to the log alone.
async function fetchPublishedTitles() {
  try {
    const res = await fetch(POSTS_URL, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`posts feed returned ${res.status}`);
    const data = await res.json();
    const posts = Array.isArray(data.posts) ? data.posts : [];
    return posts.map((p) => norm(p.title));
  } catch (e) {
    console.warn(`! Could not read live posts feed (${e.message}). Using local log only.`);
    return [];
  }
}

function pickArticle(usedTitles) {
  const used = new Set(usedTitles.map(norm));
  return articles.find((a) => !used.has(norm(a.title))) || null;
}

// ---------------------------------------------------------------------------
// Pexels: find a relevant landscape HD image for the article.
// ---------------------------------------------------------------------------
async function fetchPexelsImage(query, variantIndex) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    throw new Error(
      'PEXELS_API_KEY is not set. Get a free key at https://www.pexels.com/api/ ' +
        'and put it in a .env file or the GitHub Actions secret.'
    );
  }

  const url =
    'https://api.pexels.com/v1/search?' +
    new URLSearchParams({
      query,
      orientation: 'landscape',
      size: 'large',
      per_page: '15',
    }).toString();

  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) {
    throw new Error(`Pexels search failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (!photos.length) {
    throw new Error(`Pexels returned no images for query "${query}"`);
  }

  // Vary the chosen photo by article position so different posts on similar
  // topics don't all get the same cover.
  const photo = photos[variantIndex % photos.length];
  const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Image download failed: ${imgRes.status} ${imgRes.statusText}`);
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());

  return {
    base64: buf.toString('base64'),
    imageUrl,
    photographer: photo.photographer || 'a Pexels contributor',
    photographerUrl: photo.photographer_url || 'https://www.pexels.com',
    bytes: buf.length,
  };
}

// Append a small, tasteful photo credit to satisfy Pexels attribution guidance.
function withPhotoCredit(bodyHtml, photo) {
  const credit =
    `\n<p style="font-size:0.85em;opacity:0.7;margin-top:2rem;">` +
    `Photo by <a href="${photo.photographerUrl}" rel="noopener" target="_blank">` +
    `${escapeHtml(photo.photographer)}</a> on ` +
    `<a href="https://www.pexels.com" rel="noopener" target="_blank">Pexels</a>.</p>`;
  return bodyHtml + credit;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
async function main() {
  loadDotEnv();

  console.log(`\n=== Mawingu HR weekly blog publisher ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Decide what to publish (dedup against live feed + local log).
  const [liveTitles, logEntries] = [await fetchPublishedTitles(), readLog()];
  const logTitles = logEntries.map((e) => (typeof e === 'string' ? e : e.title));
  const usedTitles = [...liveTitles, ...logTitles];

  const article = pickArticle(usedTitles);
  if (!article) {
    console.log(
      `All ${articles.length} articles in the bank have been published. ` +
        `Nothing to do.\n\n` +
        `→ Ask Claude to "write 20 more articles" to extend automation/articles.js.`
    );
    return; // exit 0 — this is a healthy state, not an error.
  }

  console.log(`Selected article: "${article.title}"`);
  console.log(`Image search query: "${article.imageQuery}"`);

  // 2. Fetch a relevant HD cover image.
  const variantIndex = articles.indexOf(article);
  const photo = await fetchPexelsImage(article.imageQuery, variantIndex);
  console.log(
    `Image: ${photo.imageUrl} (${(photo.bytes / 1024).toFixed(0)} KB, by ${photo.photographer})`
  );

  // 3. Build the post payload (matches api/upload.js contract).
  const payload = {
    title: article.title,
    author: article.author,
    shortDescription: article.shortDescription,
    body: withPhotoCredit(article.body, photo),
    imageType: 'image/jpeg',
    imageBase64: photo.base64,
  };

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: not drafting or emailing ---');
    console.log(`Author:      ${payload.author}`);
    console.log(`Excerpt:     ${payload.shortDescription}`);
    console.log(`Body length: ${payload.body.length} chars of HTML`);
    console.log(`\nWould POST to: ${DRAFT_URL} (stages a hidden draft + emails for approval)`);
    console.log('Re-run without --dry-run to draft + send the approval email.\n');
    return;
  }

  // 4. Stage as a hidden draft and email the approver an Approve / Reject link.
  console.log(`\nDrafting + requesting approval via ${DRAFT_URL} ...`);
  const res = await fetch(DRAFT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.ok) {
    throw new Error(
      `Draft request failed: ${res.status} ${res.statusText} — ${JSON.stringify(result)}`
    );
  }

  // 5. Email the approver the Approve / Reject links over SMTP.
  console.log('Sending approval email over SMTP ...');
  const { to } = await sendApprovalEmail(
    result.draft,
    result.approveUrl,
    result.rejectUrl,
    result.regenerateUrl
  );

  // 6. Record it so the same article is never offered twice. It is NOT live yet —
  //    it goes live only when the approval link in the email is opened.
  appendToLog({
    title: article.title,
    id: result.id,
    status: 'pending-approval',
    draftedAt: (result.draft && result.draft.draftedAt) || null,
  });

  console.log(`\n✓ Drafted and sent for approval: "${article.title}"`);
  console.log(`  id: ${result.id}`);
  console.log(`  Approval email sent to: ${to}`);
  console.log(`  It will go live only after the "Approve & publish" link is clicked.\n`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
