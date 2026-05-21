/* POST /api/upload
   Body: { title, author, shortDescription, body, imageName, imageType, imageBase64 }
   Commits the image to /posts/images/<id>.<ext> and the post metadata to /posts/<id>.json. */

const { putFile, rawUrl, setCors } = require('./_github');

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'post';
}

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
    const { title, author, shortDescription, body: postBody, imageType, imageBase64 } = body;

    if (!title || !author || !shortDescription || !postBody || !imageBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = new Date();
    const id = `${now.toISOString().slice(0, 10)}-${slugify(title)}-${now.getTime().toString(36)}`;
    const ext = extFromType(imageType);
    const imagePath = `posts/images/${id}.${ext}`;
    const jsonPath  = `posts/${id}.json`;

    await putFile(imagePath, imageBase64, `Add image for "${title}"`);

    const post = {
      id,
      title,
      author,
      shortDescription,
      body: postBody,
      image: rawUrl(imagePath),
      publishedAt: now.toISOString()
    };
    const postJsonBase64 = Buffer.from(JSON.stringify(post, null, 2), 'utf8').toString('base64');
    await putFile(jsonPath, postJsonBase64, `Publish article: ${title}`);

    return res.status(200).json({ ok: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
};
