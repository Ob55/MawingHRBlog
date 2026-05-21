/* POST /api/delete
   Body: { id }
   Removes /posts/<id>.json and the matching image from the repo. */

const { getFile, deleteFile, setCors } = require('./_github');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = await readJson(req);
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const jsonPath = `posts/${id}.json`;
    const meta = await getFile(jsonPath);
    if (!meta) return res.status(404).json({ error: 'Post not found' });

    // Find image path from the stored post's image URL.
    let imagePath = null;
    try {
      const raw = Buffer.from(meta.content, 'base64').toString('utf8');
      const post = JSON.parse(raw);
      const match = (post.image || '').match(/posts\/images\/[^?#]+$/);
      if (match) imagePath = match[0];
    } catch (_) {}

    await deleteFile(jsonPath, `Delete article ${id}`, meta.sha);

    if (imagePath) {
      const imgMeta = await getFile(imagePath);
      if (imgMeta && imgMeta.sha) {
        await deleteFile(imagePath, `Delete image for article ${id}`, imgMeta.sha);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
};
