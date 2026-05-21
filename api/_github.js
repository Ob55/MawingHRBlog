/* Shared helpers for talking to the GitHub Contents API.
   The repo itself acts as the post database.

   Required env vars (set these in the Vercel dashboard):
     GITHUB_TOKEN  — fine-grained personal access token with "Contents: Read and write"
     GITHUB_OWNER  — e.g. Ob55
     GITHUB_REPO   — e.g. MawingHRBlog
     GITHUB_BRANCH — defaults to "main"
*/

const OWNER  = process.env.GITHUB_OWNER  || 'Ob55';
const REPO   = process.env.GITHUB_REPO   || 'MawingHRBlog';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN  = process.env.GITHUB_TOKEN;

const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

function authHeaders() {
  if (!TOKEN) throw new Error('Missing GITHUB_TOKEN env var');
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'mawingu-hr-blog'
  };
}

async function getFile(filePath) {
  const url = `${API}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(BRANCH)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFile ${filePath}: ${res.status}`);
  return res.json();
}

async function putFile(filePath, contentBase64, message, sha) {
  const url = `${API}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  const body = {
    message,
    content: contentBase64,
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub putFile ${filePath} (${res.status}): ${text}`);
  }
  return res.json();
}

async function deleteFile(filePath, message, sha) {
  const url = `${API}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH })
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub deleteFile ${filePath} (${res.status}): ${text}`);
  }
  return res.ok;
}

async function listDir(dirPath) {
  const url = `${API}/contents/${encodeURIComponent(dirPath)}?ref=${encodeURIComponent(BRANCH)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub listDir ${dirPath}: ${res.status}`);
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}

function rawUrl(filePath) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { getFile, putFile, deleteFile, listDir, rawUrl, setCors, OWNER, REPO, BRANCH };
