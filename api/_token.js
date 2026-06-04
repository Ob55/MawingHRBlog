/* Shared approval-token helper.
   Approve/Reject links carry an HMAC of the post id so they cannot be forged
   without the server-side secret. No token is ever stored — it is recomputed
   and compared on approval. */

const crypto = require('crypto');

// Falls back to GITHUB_TOKEN (always present on Vercel) so approval works out of
// the box; set APPROVE_SECRET to rotate it independently of the GitHub token.
function secret() {
  return (
    process.env.APPROVE_SECRET ||
    process.env.GITHUB_TOKEN ||
    'mawingu-approval-fallback-secret'
  );
}

function makeToken(id) {
  return crypto.createHmac('sha256', secret()).update(String(id)).digest('hex');
}

function verifyToken(id, token) {
  const expected = Buffer.from(makeToken(id));
  const given = Buffer.from(String(token || ''));
  return (
    expected.length === given.length && crypto.timingSafeEqual(expected, given)
  );
}

module.exports = { makeToken, verifyToken };
