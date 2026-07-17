/** Email delivery via Brevo HTTPS API (works where SMTP ports are blocked). */

export async function sendEmail({ to, subject, text, html, replyTo, replyName }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[email] BREVO_API_KEY not set — email skipped:', subject);
    return false;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.CONTACT_FROM_NAME || 'NovusWork',
        email: process.env.CONTACT_FROM || 'fenelon.j@gmail.com',
      },
      to: [{ email: to }],
      ...(replyTo && { replyTo: { email: replyTo, name: replyName || replyTo } }),
      subject,
      ...(text && { textContent: text }),
      ...(html && { htmlContent: html }),
    }),
  });
  if (!res.ok) console.error('[email] Brevo error', res.status, await res.text().catch(() => ''));
  return res.ok;
}
