/* api/_events.js
 *
 * Tiny activity log kept in the repo at analytics/events.json. Each blog action
 * (draft created, approved, rejected, regenerated) appends one entry. The weekly
 * report (automation/weekly-report.js) reads this file to summarise activity.
 *
 * Frequency is only a handful of writes per week, so committing to GitHub on each
 * event is fine. Logging is best-effort: a failure here must never break the
 * actual approve/reject/draft action, so callers wrap this in try/catch and we
 * also swallow errors internally.
 *
 * Underscore-prefixed → Vercel treats it as a helper, not a route.
 */

'use strict';

const { getFile, putFile } = require('./_github');

const EVENTS_PATH = 'analytics/events.json';
const MAX_EVENTS = 500; // keep the file bounded

async function logEvent(type, data) {
  try {
    const meta = await getFile(EVENTS_PATH);
    let events = [];
    let sha;
    if (meta && meta.content) {
      sha = meta.sha;
      try {
        const parsed = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));
        if (Array.isArray(parsed)) events = parsed;
      } catch (_) { /* corrupt file → start fresh */ }
    }

    events.push({
      type,
      id: data && data.id,
      title: data && data.title,
      at: new Date().toISOString(),
    });
    if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);

    const base64 = Buffer.from(JSON.stringify(events, null, 2) + '\n', 'utf8').toString('base64');
    await putFile(EVENTS_PATH, base64, `chore: log blog event (${type})`, sha);
    return true;
  } catch (err) {
    console.error('logEvent failed (non-fatal):', err.message);
    return false;
  }
}

module.exports = { logEvent, EVENTS_PATH };
