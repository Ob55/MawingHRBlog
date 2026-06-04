/* GET /api/reject?id=<id>&token=<token>
   Opened from the approval email. Verifies the signed token, then discards the
   staged draft (posts/pending/<id>.json) and its image. Returns a simple HTML page. */

const { getFile, deleteFile, setCors } = require('./_github');
const { verifyToken } = require('./_token');

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

    const pendingPath = `posts/pending/${id}.json`;
    const meta = await getFile(pendingPath);
    if (!meta) {
      return res.status(200).send(page('Already handled', 'This draft has already been approved or rejected. Nothing to do.', 'ℹ️'));
    }

    // Remove the staged image too, so rejected drafts leave nothing behind.
    let imagePath = null;
    try {
      const draft = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));
      const match = (draft.image || '').match(/posts\/images\/[^?#]+$/);
      if (match) imagePath = match[0];
    } catch (_) {}

    await deleteFile(pendingPath, `Reject draft ${id}`, meta.sha);
    if (imagePath) {
      const imgMeta = await getFile(imagePath);
      if (imgMeta && imgMeta.sha) {
        await deleteFile(imagePath, `Remove image for rejected draft ${id}`, imgMeta.sha);
      }
    }

    return res.status(200).send(page('Draft rejected', 'The article has been discarded and will not be published. Next week the automation will offer the next topic.', '🗑️'));
  } catch (err) {
    console.error(err);
    return res.status(500).send(page('Something went wrong', 'The draft could not be rejected. Please try again.', '⚠️'));
  }
};
