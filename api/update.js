/* POST /api/update
   Body: { id, title, author, shortDescription, body, imageType?, imageBase64? }
   Edits an existing live post's JSON in place. If a new image is supplied it
   replaces the cover; otherwise the existing image is kept. */

const { getFile, putFile, rawUrl, setCors } = require('./_github');

function extFromType(type) {
  if (!type) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  return 'jpg';
}

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
    const body = await readJson(req);
    const { id, title, author, shortDescription, body: postBody, imageType, imageBase64 } = body;

    if (!id || !title || !author || !shortDescription || !postBody) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jsonPath = `posts/${id}.json`;
    const meta = await getFile(jsonPath);
    if (!meta) return res.status(404).json({ error: 'Post not found' });

    const existing = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));

    // Replace the image only if a new one was uploaded.
    let image = existing.image;
    if (imageBase64) {
      const ext = extFromType(imageType);
      const imagePath = `posts/images/${id}.${ext}`;
      const imgMeta = await getFile(imagePath);
      await putFile(imagePath, imageBase64, `Update image for "${title}"`, imgMeta && imgMeta.sha);
      image = rawUrl(imagePath);
    }

    const post = {
      id,
      title,
      author,
      shortDescription,
      body: postBody,
      image,
      publishedAt: existing.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const postBase64 = Buffer.from(JSON.stringify(post, null, 2), 'utf8').toString('base64');
    await putFile(jsonPath, postBase64, `Edit article: ${title}`, meta.sha);

    return res.status(200).json({ ok: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Update failed', detail: err.message });
  }
};
