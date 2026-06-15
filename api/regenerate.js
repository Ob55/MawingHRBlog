/* GET /api/regenerate?id=<id>&token=<token>
   Opened from the approval email / dashboard. Verifies the signed token, then:
     1. discards the current staged draft (posts/pending/<id>.json) and its image,
     2. triggers the publishing workflow again via GitHub Actions workflow_dispatch.
   That run picks the NEXT, different article from the bank (the discarded one is
   still recorded in published-log.json, so it is skipped) and emails a fresh
   Approve / Reject / Regenerate link. The new draft arrives within a minute or two.

   Requires the Vercel GITHUB_TOKEN to have Actions: write permission. */

const { getFile, deleteFile, dispatchWorkflow, setCors } = require('./_github');
const { verifyToken } = require('./_token');
const { logEvent } = require('./_events');

const WORKFLOW_FILE = process.env.PUBLISH_WORKFLOW_FILE || 'weekly-blog.yml';

function page(title, message, accent) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:48px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:40px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.06);">
    <div style="font-size:46px;margin-bottom:14px;">${accent}</div>
    <h1 style="color:#0B1E3F;font-size:22px;margin:0 0 10px;">${title}</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0;">${message}</p>
  </div>
</body></html>`;
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const { id, token } = req.query || {};
    if (!id || !token || !verifyToken(id, token)) {
      return res.status(403).send(page('Invalid or expired link', 'This link is not valid. Please use the most recent email.', '⚠️'));
    }

    // 1. Discard the current draft (and its image), if it is still pending.
    const pendingPath = `posts/pending/${id}.json`;
    const meta = await getFile(pendingPath);
    let draftTitle = '';
    if (meta) {
      let imagePath = null;
      try {
        const draft = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));
        draftTitle = draft.title || '';
        const match = (draft.image || '').match(/posts\/images\/[^?#]+$/);
        if (match) imagePath = match[0];
      } catch (_) {}

      await deleteFile(pendingPath, `Regenerate: discard draft ${id}`, meta.sha);
      if (imagePath) {
        const imgMeta = await getFile(imagePath);
        if (imgMeta && imgMeta.sha) {
          await deleteFile(imagePath, `Regenerate: remove image for draft ${id}`, imgMeta.sha);
        }
      }
    }

    // 2. Kick off a fresh draft immediately (picks a different article).
    await dispatchWorkflow(WORKFLOW_FILE);
    await logEvent('regenerated', { id, title: draftTitle });

    return res.status(200).send(page(
      'Generating a new article… 🔄',
      'The previous draft was discarded. A different article is being prepared and a new approval email will arrive shortly (usually within a minute or two).',
      '🔄'
    ));
  } catch (err) {
    console.error(err);
    return res.status(500).send(page(
      'Could not regenerate',
      'The request failed — the automation may not have permission to start a new run. Please try again, or trigger a new post from the GitHub Actions tab.',
      '⚠️'
    ));
  }
};
