/* Local dev server for previewing the Mawingu HR blog admin page.
   Serves /public statically. The /api routes return preview stubs
   so the form can be inspected without a real GitHub backend. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory preview storage (resets when server restarts).
const previewPosts = [];

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try { resolve(JSON.parse(raw || '{}')); }
      catch { resolve({}); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === '') url = '/index.html';
  const filePath = path.join(PUBLIC_DIR, url);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end('forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + url);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS for the main Mawingu site fetching /api/posts during local dev.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (url === '/api/posts' && req.method === 'GET') {
    return sendJson(res, 200, { posts: previewPosts });
  }

  if (url === '/api/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const post = {
      id: 'preview-' + Date.now(),
      title: body.title,
      author: body.author,
      shortDescription: body.shortDescription,
      body: body.body,
      image: body.imageBase64 ? `data:${body.imageType};base64,${body.imageBase64}` : '',
      publishedAt: new Date().toISOString()
    };
    previewPosts.unshift(post);
    return sendJson(res, 200, { ok: true, post });
  }

  if (url === '/api/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const idx = previewPosts.findIndex((p) => p.id === body.id);
    if (idx >= 0) previewPosts.splice(idx, 1);
    return sendJson(res, 200, { ok: true });
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Mawingu HR admin (preview) → http://localhost:${PORT}`);
  console.log('Any non-empty passcode unlocks the dashboard in preview mode.');
});
