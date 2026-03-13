// api/auth.js — Server-side password hashing and verification.
// Actions: set-password, verify-password, lookup-token, request-reset.

import { createClient } from '@supabase/supabase-js';
import { webcrypto, timingSafeEqual } from 'crypto';

const getSupabase = () => {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// ─── PBKDF2 Hashing ─────────────────────────────────────────────────────────

const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const ALGORITHM = 'SHA-256';

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: ALGORITHM },
    keyMaterial, KEY_LENGTH * 8
  );
  const hashHex = Buffer.from(bits).toString('hex');
  const saltHex = Buffer.from(salt).toString('hex');
  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1]);
  const salt = Buffer.from(parts[2], 'hex');
  const expectedHash = Buffer.from(parts[3], 'hex');
  const encoder = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: ALGORITHM },
    keyMaterial, KEY_LENGTH * 8
  );
  const computedHash = Buffer.from(bits);
  if (expectedHash.length !== computedHash.length) return false;
  return timingSafeEqual(expectedHash, computedHash);
}

const getBaseUrl = () =>
  process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://katharos.co');

const generateToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
};

// ─── Rate Limiter (in-memory, per-action+IP) ────────────────────────────────
const rateMap = new Map();
function checkRateLimit(key, limit = 3, windowMs = 300_000) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, token, email, password } = req.body || {};
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // ── Set Password (invite flow) ──────────────────────────────────────────

  if (action === 'set-password') {
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Look up user by invite token
    const { data: user, error: lookupErr } = await supabase
      .from('users')
      .select('id, email, name, company, status, password_hash')
      .eq('auth_id', token)
      .eq('status', 'active')
      .single();

    if (lookupErr || !user) {
      return res.status(400).json({ error: 'Invalid or expired invite link' });
    }

    // Hash password
    const hash = await hashPassword(password);

    // Store hash and clear invite token (single-use)
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash: hash,
        auth_id: null,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('[Auth] set-password update error:', updateErr);
      return res.status(500).json({ error: 'Failed to set password' });
    }

    return res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      company: user.company,
    });
  }

  // ── Verify Password (login flow) ───────────────────────────────────────

  if (action === 'verify-password') {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { data: user, error: lookupErr } = await supabase
      .from('users')
      .select('id, email, name, company, status, password_hash')
      .eq('email', trimmedEmail)
      .eq('status', 'active')
      .single();

    if (lookupErr || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use your invite link to set a password first' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      company: user.company,
    });
  }

  // ── Lookup Token (invite flow — frontend calls this to check token) ────

  if (action === 'lookup-token') {
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const { data: user, error: lookupErr } = await supabase
      .from('users')
      .select('email, name, company, password_hash, status')
      .eq('auth_id', token)
      .eq('status', 'active')
      .single();

    if (lookupErr || !user) {
      return res.status(404).json({ ok: false, error: 'Invalid or expired invite link' });
    }

    return res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      company: user.company,
      hasPassword: !!user.password_hash,
    });
  }

  // ── Request Password Reset ────────────────────────────────────────────

  if (action === 'request-reset') {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Rate limit: 3 reset requests per email per 5 minutes
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(`reset:${ip}`, 3, 300_000)) {
      // Always return ok to avoid email enumeration
      return res.status(200).json({ ok: true });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, company, password_hash, status')
      .eq('email', trimmedEmail)
      .eq('status', 'active')
      .single();

    // Always return ok — don't reveal whether the email exists
    if (!user || !user.password_hash) {
      return res.status(200).json({ ok: true });
    }

    // Generate reset token and store in auth_id
    const resetToken = generateToken();
    await supabase
      .from('users')
      .update({ auth_id: resetToken, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Send reset email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const BASE_URL = getBaseUrl();
      const resetLink = `${BASE_URL}?reset=${resetToken}`;
      const firstName = (user.name || '').split(' ')[0] || '';
      const greeting = firstName ? `Hi ${firstName}` : 'Hi';

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Katharos <notifications@katharos.co>',
            to: user.email,
            reply_to: 'patrick@katharos.co',
            subject: 'Reset Your Katharos Password',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f7f7f7; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f7f7f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: #1a1a1a; padding: 32px 40px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 22px; color: #ffffff; letter-spacing: 1px;">Katharos</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 44px 40px 20px;">
              <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px; line-height: 1.6;">${greeting},</p>
              <p style="font-size: 15px; color: #333; margin: 0 0 20px; line-height: 1.7;">
                We received a request to reset the password for your Katharos account. Click the button below to choose a new password.
              </p>
              <p style="font-size: 15px; color: #333; margin: 0 0 32px; line-height: 1.7;">
                This link can only be used once. If you didn't request this, you can safely ignore this email.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                <tr>
                  <td align="center" style="background: #1a1a1a; border-radius: 6px;">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 13px; color: #999; margin: 0 0 28px; line-height: 1.6; text-align: center;">
                Or copy this link into your browser:<br />
                <span style="color: #666; word-break: break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>
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
</html>`,
          }),
        });
      } catch (err) {
        console.error('[Auth] reset email error:', err);
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
