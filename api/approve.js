/* GET /api/approve?id=<id>&token=<token>
   Opened from the approval email. Verifies the signed token, then promotes the
   staged draft (posts/pending/<id>.json) to a live post (posts/<id>.json) with
   publishedAt set to now, and removes the pending file. Returns a simple HTML page. */

const { getFile, putFile, deleteFile, setCors } = require('./_github');
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
      return res.status(403).send(page('Invalid or expired link', 'This approval link is not valid. Please use the most recent email.', '⚠️'));
    }

    const pendingPath = `posts/pending/${id}.json`;
    const meta = await getFile(pendingPath);

    if (!meta) {
      // Already handled (approved or rejected earlier).
      const live = await getFile(`posts/${id}.json`);
      if (live) {
        return res.status(200).send(page('Already published', 'This article is already live on the website. No further action is needed.', '✅'));
      }
      return res.status(404).send(page('Nothing to approve', 'This draft no longer exists — it may have already been rejected.', '🗑️'));
    }

    const draft = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));

    const post = {
      id: draft.id,
      title: draft.title,
      author: draft.author,
      shortDescription: draft.shortDescription,
      body: draft.body,
      image: draft.image,
      publishedAt: new Date().toISOString(),
    };
    const postBase64 = Buffer.from(JSON.stringify(post, null, 2), 'utf8').toString('base64');

    await putFile(`posts/${id}.json`, postBase64, `Publish (approved): ${draft.title}`);
    await deleteFile(pendingPath, `Remove pending draft after approval: ${id}`, meta.sha);

    return res.status(200).send(page('Published! 🎉', `"${draft.title}" is now live on the Mawingu HR blog. It will appear within about 30 seconds.`, '✅'));
  } catch (err) {
    console.error(err);
    return res.status(500).send(page('Something went wrong', 'The post could not be published. Please try again or publish it manually from the admin page.', '⚠️'));
  }
};
