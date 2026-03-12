// api/notify.js — Send notification emails to patrick@katharos.co
// Uses Resend (free tier). Set RESEND_API_KEY in Vercel env vars.
// If not configured, silently succeeds (data is still stored in Supabase).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, name, email, company } = req.body || {};
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'patrick@katharos.co';

  if (!RESEND_API_KEY) {
    // No email service configured — skip silently
    console.log(`[Notify] No RESEND_API_KEY — skipping email for ${type}: ${email}`);
    return res.status(200).json({ ok: true, sent: false });
  }

  try {
    let subject, html;

    if (type === 'demo_request') {
      subject = `New Demo Request — ${company || name || email}`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a;">New Demo Request</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #888; width: 80px;">Name</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${name || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${email || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Firm</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${company || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Time</td><td style="padding: 8px 0; color: #1a1a1a;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</td></tr>
          </table>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; margin: 0;">Katharos Platform Notification</p>
        </div>
      `;
    } else if (type === 'invite_login') {
      subject = `Secure Access Link Used — ${name || email}`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a;">Secure Access Link Used</h2>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px;">A user has logged in via their Secure Access Link for the first time.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #888; width: 80px;">Name</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${name || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${email || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Firm</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${company || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Time</td><td style="padding: 8px 0; color: #1a1a1a;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</td></tr>
          </table>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; margin: 0;">Katharos Platform Notification</p>
        </div>
      `;
    } else {
      subject = `Katharos Notification — ${email || 'Unknown'}`;
      html = `<p>Event: ${type || 'unknown'}<br>Email: ${email || '—'}<br>Name: ${name || '—'}<br>Company: ${company || '—'}</p>`;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Katharos <notifications@katharos.co>',
        to: NOTIFY_TO,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Notify] Resend error:', err);
      return res.status(200).json({ ok: true, sent: false, error: err });
    }

    return res.status(200).json({ ok: true, sent: true });
  } catch (err) {
    console.error('[Notify] Error:', err);
    return res.status(200).json({ ok: true, sent: false });
  }
}
