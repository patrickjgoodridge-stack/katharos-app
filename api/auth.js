// api/auth.js — Server-side password hashing and verification.
// Actions: set-password (invite flow), verify-password (login flow).

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

  return res.status(400).json({ error: 'Invalid action' });
}
