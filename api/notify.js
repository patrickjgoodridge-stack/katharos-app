// api/notify.js — Send notification emails to patrick@katharos.co
// Uses Resend (free tier). Set RESEND_API_KEY in Vercel env vars.
// For demo requests: auto-creates a user + Secure Access Link so you can just forward it.

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

// Create or update a user with an invite token, return the token
const ensureInviteToken = async (supabase, email, name, company) => {
  if (!supabase || !email) return null;
  const token = generateToken();
  const domain = email.split('@')[1]?.toLowerCase() || '';

  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('auth_id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Refresh their invite token
      await supabase
        .from('users')
        .update({ auth_id: token, updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase());
      return token;
    }

    // Create new user with invite token
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
    console.error('[Notify] ensureInviteToken error:', err);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, name, email, company } = req.body || {};
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'patrick@katharos.co';
  const BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.BASE_URL || 'https://katharos.co');

  // Generate Secure Access Link for demo requests
  let inviteLink = null;
  if (type === 'demo_request' && email) {
    const supabase = getSupabase();
    const token = await ensureInviteToken(supabase, email, name, company);
    if (token) {
      inviteLink = `${BASE_URL}?invite=${token}`;
    }
  }

  if (!RESEND_API_KEY) {
    console.log(`[Notify] No RESEND_API_KEY — skipping email for ${type}: ${email}`);
    return res.status(200).json({ ok: true, sent: false, inviteLink });
  }

  try {
    let subject, html;

    if (type === 'demo_request') {
      subject = `New Demo Request — ${company || name || email}`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; padding: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a;">New Demo Request</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #888; width: 80px;">Name</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${name || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${email || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Firm</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${company || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Time</td><td style="padding: 8px 0; color: #1a1a1a;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</td></tr>
          </table>
          ${inviteLink ? `
          <div style="margin: 24px 0; padding: 16px; background: #f8f5ff; border: 1px solid #e8daef; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #7c3aed;">Secure Access Link</p>
            <p style="margin: 0 0 12px; font-size: 12px; color: #666;">Ready to send. This link will log them in instantly.</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">Open Link</a>
            <p style="margin: 12px 0 0; font-size: 11px; color: #999; word-break: break-all;">${inviteLink}</p>
          </div>
          ` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; margin: 0;">Katharos Platform Notification</p>
        </div>
      `;
    } else if (type === 'invite_login') {
      subject = `Secure Access Link Used — ${name || email}`;
      html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a;">Secure Access Link Used</h2>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px;">A user has logged in via their Secure Access Link.</p>
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
      return res.status(200).json({ ok: true, sent: false, inviteLink, error: err });
    }

    return res.status(200).json({ ok: true, sent: true, inviteLink });
  } catch (err) {
    console.error('[Notify] Error:', err);
    return res.status(200).json({ ok: true, sent: false, inviteLink });
  }
}
