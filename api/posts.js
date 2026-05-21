/* GET /api/posts
   Returns all published posts (newest first), read from /posts/*.json in the repo. */

const { listDir, getFile, setCors } = require('./_github');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const entries = await listDir('posts');
    const jsonFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.json'));

    const posts = [];
    for (const f of jsonFiles) {
      const meta = await getFile(`posts/${f.name}`);
      if (!meta || !meta.content) continue;
      try {
        const raw = Buffer.from(meta.content, 'base64').toString('utf8');
        posts.push(JSON.parse(raw));
      } catch (err) {
        console.error('Bad post JSON', f.name, err);
      }
    }

    posts.sort((a, b) => {
      const ta = new Date(a.publishedAt || 0).getTime();
      const tb = new Date(b.publishedAt || 0).getTime();
      return tb - ta;
    });

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({ posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load posts', detail: err.message });
  }
};
