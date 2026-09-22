// Transactional email via Brevo's HTTP API. Fails soft (logs, resolves
// false) when BREVO_API_KEY isn't set so callers never need to guard.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@focusshield.app';
const FROM_NAME = process.env.FROM_NAME || 'FocusShield';

async function sendEmail(toEmail, subject, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`BREVO_API_KEY not configured — skipping email to ${toEmail}`);
    return false;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      console.error('Brevo error', res.status, (await res.text()).slice(0, 500));
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return false;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function welcomeEmail(displayName) {
  return {
    subject: 'Welcome to FocusShield',
    html: `
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>You're in — your FocusShield account is ready.</p>
      <p>Head to your dashboard to set up your first block list: <a href="https://focusshield.app/dashboard">focusshield.app/dashboard</a></p>
      <hr><p style="color:#888;font-size:12px">FocusShield</p>
    `,
  };
}

module.exports = { sendEmail, welcomeEmail };
