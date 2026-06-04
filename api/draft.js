/* POST /api/draft
   Body: { title, author, shortDescription, body, imageType, imageBase64 }

   Same input as /api/upload, but instead of publishing immediately it:
     1. commits the image to /posts/images/<id>.<ext>,
     2. stages the post as a HIDDEN draft at /posts/pending/<id>.json
        (the public /api/posts only lists top-level /posts/*.json, so drafts
         never appear on the site),
     3. returns signed Approve / Reject links.
   The caller (automation/publish-weekly.js) emails those links over SMTP.
   The post only goes live when /api/approve is opened. */

const { putFile, rawUrl, setCors } = require('./_github');
const { makeToken } = require('./_token');

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

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
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

    // 1. Commit the image (not referenced by any live post yet, so it stays hidden).
    await putFile(imagePath, imageBase64, `Add image for draft "${title}"`);

    // 2. Stage the draft under posts/pending/ (publishedAt is set later, on approval).
    const draft = {
      id,
      title,
      author,
      shortDescription,
      body: postBody,
      image: rawUrl(imagePath),
      draftedAt: now.toISOString(),
    };
    const draftBase64 = Buffer.from(JSON.stringify(draft, null, 2), 'utf8').toString('base64');
    await putFile(`posts/pending/${id}.json`, draftBase64, `Stage draft for approval: ${title}`);

    // 3. Build signed approve / reject links for the caller to email.
    const token = makeToken(id);
    const base = baseUrl(req);
    const approveUrl = `${base}/api/approve?id=${encodeURIComponent(id)}&token=${token}`;
    const rejectUrl = `${base}/api/reject?id=${encodeURIComponent(id)}&token=${token}`;

    return res.status(200).json({ ok: true, id, draft, approveUrl, rejectUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Draft failed', detail: err.message });
  }
};
