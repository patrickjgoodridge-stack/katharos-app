// api/welcome.js — Send branded welcome email to new clients with their secure access link.
// Usage: POST /api/welcome { email, name, company }
// Creates/updates user in Supabase, generates invite token, sends welcome email TO THE USER.

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const generateToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
};

const ensureInviteToken = async (supabase, email, name, company) => {
  if (!supabase || !email) return null;
  const token = generateToken();
  const domain = email.split('@')[1]?.toLowerCase() || '';

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('auth_id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      await supabase
        .from('users')
        .update({ auth_id: token, updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase());
      return token;
    }

    await supabase.from('users').insert([{
      email: email.toLowerCase(),
      name: name || null,
      company: company || null,
      role: 'analyst',
      status: 'active',
      email_domain: domain,
      auth_id: token,
      last_login: null,
    }]);
    return token;
  } catch (err) {
    console.error('[Welcome] ensureInviteToken error:', err);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, company } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const BASE_URL = process.env.BASE_URL || 'https://katharos.co';

  // Create user + generate invite token
  const supabase = getSupabase();
  const token = await ensureInviteToken(supabase, email, name, company);
  const inviteLink = token ? `${BASE_URL}?invite=${token}` : null;

  if (!RESEND_API_KEY) {
    console.log(`[Welcome] No RESEND_API_KEY — skipping email for ${email}`);
    return res.status(200).json({ ok: true, sent: false, inviteLink });
  }

  if (!inviteLink) {
    return res.status(500).json({ error: 'Failed to generate invite link' });
  }

  const firstName = (name || '').split(' ')[0] || '';
  const greeting = firstName ? `Dear ${firstName}` : 'Welcome';

  const subject = `Your Katharos Account is Ready`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f7f7f7; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f7f7f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: #1a1a1a; padding: 32px 40px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 22px; color: #ffffff; letter-spacing: 1px;">Katharos</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 44px 40px 20px;">
              <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px; line-height: 1.6;">
                ${greeting},
              </p>
              <p style="font-size: 15px; color: #333; margin: 0 0 20px; line-height: 1.7;">
                Your Katharos account${company ? ` for <strong>${company}</strong>` : ''} has been provisioned and is ready for use. Katharos provides expert-level AI for deep due diligence — automated screening against thousands of regulatory, sanctions, and financial crime intelligence sources.
              </p>
              <p style="font-size: 15px; color: #333; margin: 0 0 32px; line-height: 1.7;">
                Click below to access your account. This link is unique to you and will log you in securely.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                <tr>
                  <td align="center" style="background: #1a1a1a; border-radius: 6px;">
                    <a href="${inviteLink}" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">
                      Access Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #999; margin: 0 0 28px; line-height: 1.6; text-align: center;">
                Or copy this link into your browser:<br />
                <span style="color: #666; word-break: break-all;">${inviteLink}</span>
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 0 0 28px;" />

              <p style="font-size: 14px; color: #333; margin: 0 0 8px; line-height: 1.7;">
                <strong>What you can do:</strong>
              </p>
              <ul style="font-size: 14px; color: #555; margin: 0 0 28px; padding-left: 20px; line-height: 2;">
                <li>Screen entities against sanctions, PEP, and enforcement databases</li>
                <li>Run AI-powered investigations with full source attribution</li>
                <li>Generate compliance-ready diligence reports</li>
                <li>Visualize entity networks and corporate structures</li>
              </ul>

              <p style="font-size: 15px; color: #333; margin: 0 0 8px; line-height: 1.7;">
                If you have any questions, reply directly to this email or reach out to <a href="mailto:patrick@katharos.co" style="color: #1a1a1a;">patrick@katharos.co</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #f0f0f0;">
              <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.6; text-align: center;">
                Katharos &mdash; Expert-level AI for Deep Due Diligence<br />
                <a href="https://katharos.co" style="color: #999; text-decoration: none;">katharos.co</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Katharos <onboarding@resend.dev>',
        to: email,
        reply_to: 'patrick@katharos.co',
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Welcome] Resend error:', err);
      return res.status(200).json({ ok: true, sent: false, inviteLink, error: err });
    }

    // Also notify admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Katharos <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL || 'patrick@katharos.co',
        subject: `Welcome Email Sent — ${company || name || email}`,
        html: `<div style="font-family: -apple-system, sans-serif; padding: 20px;"><p>Welcome email sent to <strong>${email}</strong>${company ? ` (${company})` : ''}.</p><p>Invite link: <a href="${inviteLink}">${inviteLink}</a></p></div>`,
      }),
    }).catch(() => {});

    return res.status(200).json({ ok: true, sent: true, inviteLink });
  } catch (err) {
    console.error('[Welcome] Error:', err);
    return res.status(200).json({ ok: true, sent: false, inviteLink });
  }
}
