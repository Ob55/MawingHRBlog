/* automation/send-email.js
 *
 * Builds and sends the blog "approve / reject / regenerate" email. The actual
 * SMTP work lives in ../api/_mail.js (shared with the Vercel API functions) so
 * there is a single zero-dependency mail implementation.
 *
 * Config (env / .env — these are GitHub Actions secrets in production):
 *   MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD
 *   MAIL_FROM_ADDRESS / MAIL_FROM_NAME
 *   APPROVAL_EMAIL_TO  recipient (defaults to brian55mwangi@gmail.com)
 */

'use strict';

const { sendMail, escapeHtml, textPreview } = require('../api/_mail');

const DEFAULT_TO = 'brian55mwangi@gmail.com';

// ---- Approval email template -------------------------------------------------

function buildApprovalEmail(post, approveUrl, rejectUrl, regenerateUrl) {
  const subject = `📝 Approve new blog post: ${post.title}`;
  const img = post.image
    ? `<img src="${escapeHtml(post.image)}" alt="" width="100%" style="max-width:600px;border-radius:10px;display:block;margin:0 0 20px;">`
    : '';
  const regenerateCell = regenerateUrl
    ? `<td style="padding-left:12px;">
          <a href="${escapeHtml(regenerateUrl)}" style="display:inline-block;background:#1E5BA8;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">🔄 Regenerate</a>
        </td>`
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
        ${regenerateCell}
      </tr>
    </table>
    <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">
      <strong>Approve &amp; publish</strong> puts this article live immediately.
      <strong>Reject</strong> discards the draft and its image.
      <strong>Regenerate</strong> discards this one and emails you a different article instead.
      If you do nothing, the post stays hidden.
    </p>
  </div>`.trim();
  return { subject, html };
}

async function sendApprovalEmail(post, approveUrl, rejectUrl, regenerateUrl) {
  const { subject, html } = buildApprovalEmail(post, approveUrl, rejectUrl, regenerateUrl);
  const to = process.env.APPROVAL_EMAIL_TO || DEFAULT_TO;
  return sendMail({ to, subject, html });
}

module.exports = { sendMail, buildApprovalEmail, sendApprovalEmail };
