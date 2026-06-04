/* automation/send-email.js
 *
 * Zero-dependency SMTP sender (STARTTLS on port 587) used to send the blog
 * "approve / reject" email. Built for Office 365 (smtp.office365.com) but works
 * with any STARTTLS SMTP server. Uses only Node's built-in net/tls — no npm deps.
 *
 * Config (env / .env — these are GitHub Actions secrets in production):
 *   MAIL_HOST          e.g. smtp.office365.com
 *   MAIL_PORT          e.g. 587
 *   MAIL_USERNAME      SMTP login (also the From address for Office 365)
 *   MAIL_PASSWORD      SMTP password
 *   MAIL_FROM_ADDRESS  From address (defaults to MAIL_USERNAME)
 *   MAIL_FROM_NAME     display name (optional)
 *   APPROVAL_EMAIL_TO  recipient (defaults to brian55mwangi@gmail.com)
 *
 * NOTE: the mailbox must have SMTP AUTH (authenticated SMTP) enabled — Microsoft
 * disables it by default on some tenants. Turn it on for the sending mailbox.
 */

'use strict';

const net = require('net');
const tls = require('tls');

const DEFAULT_TO = 'brian55mwangi@gmail.com';

function cfg() {
  return {
    host: process.env.MAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
    fromName: process.env.MAIL_FROM_NAME || 'Mawingu HR Blog',
  };
}

// Reads SMTP responses (handles multiline NNN- ... NNN replies) one at a time.
function makeReader() {
  let buf = '';
  let waiter = null;
  function tryResolve() {
    if (!waiter) return;
    const m = buf.match(/^(?:\d{3}-[^\r\n]*\r\n)*(\d{3}) [^\r\n]*\r\n/);
    if (!m) return;
    const code = parseInt(m[1], 10);
    const text = buf.slice(0, m[0].length);
    buf = buf.slice(m[0].length);
    const w = waiter;
    waiter = null;
    w.resolve({ code, text: text.trim() });
  }
  return {
    attach(socket) {
      socket.on('data', (d) => {
        buf += d.toString('utf8');
        tryResolve();
      });
      socket.on('error', (e) => {
        if (waiter) {
          waiter.reject(e);
          waiter = null;
        }
      });
    },
    reset() {
      buf = '';
    },
    read() {
      return new Promise((resolve, reject) => {
        waiter = { resolve, reject };
        tryResolve();
      });
    },
  };
}

function encodeSubject(s) {
  if (/^[\x00-\x7F]*$/.test(s)) return s; // pure ASCII — send as-is
  return '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';
}

function buildMessage({ from, fromName, to, subject, html }) {
  const b64 = Buffer.from(html, 'utf8')
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n');
  const headers = [
    `From: ${fromName ? `${fromName} <${from}>` : from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64,
  ].join('\r\n');
  // Dot-stuffing: any line beginning with '.' must be escaped as '..'.
  return headers.replace(/\r\n\./g, '\r\n..');
}

async function sendMail({ to, subject, html }) {
  const c = cfg();
  if (!c.user || !c.pass) {
    throw new Error('MAIL_USERNAME / MAIL_PASSWORD are not set (SMTP credentials missing).');
  }
  const recipient = to || process.env.APPROVAL_EMAIL_TO || DEFAULT_TO;
  const ehloName = (c.from && c.from.split('@')[1]) || 'localhost';
  const reader = makeReader();

  // 1. Plain TCP connect + greeting.
  let conn = net.connect(c.port, c.host);
  conn.setTimeout(25000, () => conn.destroy(new Error('SMTP timeout')));
  await new Promise((resolve, reject) => {
    conn.once('connect', resolve);
    conn.once('error', reject);
  });
  reader.attach(conn);

  const expect = (r, codes, ctx) => {
    if (!codes.includes(r.code)) {
      throw new Error(`SMTP ${ctx} failed: ${r.text}`);
    }
  };
  const cmd = async (line, codes, ctx) => {
    conn.write(line + '\r\n');
    expect(await reader.read(), codes, ctx || line.split(' ')[0]);
  };

  try {
    expect(await reader.read(), [220], 'greeting');
    await cmd(`EHLO ${ehloName}`, [250], 'EHLO');
    await cmd('STARTTLS', [220], 'STARTTLS');

    // 2. Upgrade the socket to TLS, then re-EHLO over the secure channel.
    conn.removeAllListeners('data');
    conn.removeAllListeners('error');
    conn = tls.connect({ socket: conn, servername: c.host });
    await new Promise((resolve, reject) => {
      conn.once('secureConnect', resolve);
      conn.once('error', reject);
    });
    reader.reset();
    reader.attach(conn);

    await cmd(`EHLO ${ehloName}`, [250], 'EHLO(TLS)');

    // 3. AUTH LOGIN (base64 username, then base64 password).
    await cmd('AUTH LOGIN', [334], 'AUTH');
    await cmd(Buffer.from(c.user, 'utf8').toString('base64'), [334], 'username');
    await cmd(Buffer.from(c.pass, 'utf8').toString('base64'), [235], 'password');

    // 4. Envelope + message.
    await cmd(`MAIL FROM:<${c.from}>`, [250], 'MAIL FROM');
    await cmd(`RCPT TO:<${recipient}>`, [250, 251], 'RCPT TO');
    await cmd('DATA', [354], 'DATA');

    const message = buildMessage({
      from: c.from,
      fromName: c.fromName,
      to: recipient,
      subject,
      html,
    });
    conn.write(message + '\r\n.\r\n');
    expect(await reader.read(), [250], 'message body');

    try {
      await cmd('QUIT', [221], 'QUIT');
    } catch (_) {
      /* some servers drop the connection before replying to QUIT — ignore */
    }
  } finally {
    conn.destroy();
  }

  return { to: recipient };
}

// ---- Approval email template -------------------------------------------------

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textPreview(html, max = 320) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

function buildApprovalEmail(post, approveUrl, rejectUrl) {
  const subject = `📝 Approve new blog post: ${post.title}`;
  const img = post.image
    ? `<img src="${escapeHtml(post.image)}" alt="" width="100%" style="max-width:600px;border-radius:10px;display:block;margin:0 0 20px;">`
    : '';
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0B1E3F;">
    <p style="font-size:14px;color:#64748b;margin:0 0 6px;">Mawingu HR — weekly blog</p>
    <h1 style="font-size:20px;margin:0 0 16px;">A new article is ready for your approval</h1>
    ${img}
    <h2 style="font-size:22px;margin:0 0 10px;color:#0B1E3F;">${escapeHtml(post.title)}</h2>
    <p style="font-size:15px;color:#475569;margin:0 0 18px;"><em>${escapeHtml(post.shortDescription)}</em></p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 26px;">${escapeHtml(textPreview(post.body))}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${escapeHtml(approveUrl)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">✅ Approve &amp; publish</a>
        </td>
        <td>
          <a href="${escapeHtml(rejectUrl)}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">❌ Reject</a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">
      Clicking <strong>Approve &amp; publish</strong> puts this article live on the Mawingu HR website immediately.
      Clicking <strong>Reject</strong> discards the draft and its image. If you do nothing, the post stays hidden.
    </p>
  </div>`.trim();
  return { subject, html };
}

async function sendApprovalEmail(post, approveUrl, rejectUrl) {
  const { subject, html } = buildApprovalEmail(post, approveUrl, rejectUrl);
  return sendMail({ to: process.env.APPROVAL_EMAIL_TO || DEFAULT_TO, subject, html });
}

module.exports = { sendMail, buildApprovalEmail, sendApprovalEmail };
