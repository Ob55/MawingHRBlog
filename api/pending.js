/* GET /api/pending
   Lists hidden drafts awaiting approval (posts/pending/*.json), each with signed
   approve/reject links, so the admin dashboard can approve or reject them too
   (the same links that go out in the approval email). */

const { listDir, getFile, setCors } = require('./_github');
const { makeToken } = require('./_token');

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const entries = await listDir('posts/pending');
    const jsonFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.json'));
    const base = baseUrl(req);

    const pending = [];
    for (const f of jsonFiles) {
      const meta = await getFile(`posts/pending/${f.name}`);
      if (!meta || !meta.content) continue;
      try {
        const draft = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));
        const token = makeToken(draft.id);
        draft.approveUrl = `${base}/api/approve?id=${encodeURIComponent(draft.id)}&token=${token}`;
        draft.rejectUrl = `${base}/api/reject?id=${encodeURIComponent(draft.id)}&token=${token}`;
        pending.push(draft);
      } catch (err) {
        console.error('Bad draft JSON', f.name, err);
      }
    }

    pending.sort((a, b) => new Date(b.draftedAt || 0).getTime() - new Date(a.draftedAt || 0).getTime());

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ pending });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load drafts', detail: err.message });
  }
};
