// AuthPage.js - Restricted Access Gate with Password Login
// "Access is currently restricted to partner institutions."
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Mail, ArrowRight, Loader2, Lock, Send, KeyRound } from 'lucide-react';

const AuthPage = ({ onSuccess }) => {
  const { loginWithPassword, setPasswordFromInvite, requestPasswordReset, pendingInvite } = useAuth();

  const [mode, setMode] = useState('gate'); // 'gate', 'login', 'demo', 'set-password', 'forgot-password'
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoSent, setDemoSent] = useState(false);

  // Show set-password mode when there's a pending invite
  useEffect(() => {
    if (pendingInvite) {
      setMode('set-password');
    }
  }, [pendingInvite]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      const result = await loginWithPassword(email, password);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('Please enter a password'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const result = await setPasswordFromInvite(pendingInvite.token, newPassword);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Failed to set password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetEmail.trim()) { setError('Please enter your email'); return; }

    setLoading(true);
    try {
      await requestPasswordReset(resetEmail);
      setResetSent(true);
    } catch {
      setResetSent(true); // Always show success to avoid email enumeration
    } finally {
      setLoading(false);
    }
  };

  const handleDemoRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!demoName.trim()) { setError('Please enter your name'); return; }
    if (!demoEmail.trim()) { setError('Please enter your email'); return; }
    if (!demoCompany.trim()) { setError('Please enter your firm name'); return; }

    setLoading(true);
    try {
      // Store the demo request as a lead in collected_emails
      // The submitEmail function from AuthContext handles this, but we don't want to log them in
      // Instead, just store in Supabase directly
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
      if (isSupabaseConfigured()) {
        await supabase.from('collected_emails').upsert([{
          email: demoEmail.toLowerCase().trim(),
          name: demoName.trim(),
          company: demoCompany.trim(),
          created_at: new Date().toISOString()
        }], { onConflict: 'email' });
      }
      // Notify admin
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'demo_request',
            name: demoName.trim(),
            email: demoEmail.trim(),
            company: demoCompany.trim(),
          }),
        });
      } catch { /* notification is best-effort */ }
      setDemoSent(true);
    } catch {
      setDemoSent(true); // Show success anyway — don't reveal backend issues
    } finally {
      setLoading(false);
    }
  };

  const inputWrapStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#242424', border: '1px solid #3a3a3a', borderRadius: '6px',
    padding: '0 14px', transition: 'border-color 0.2s'
  };

  const inputStyle = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#ffffff', padding: '13px 0'
  };

  const focusWrap = (e, focus) => {
    e.currentTarget.style.borderColor = focus ? '#6b6b6b' : '#3a3a3a';
  };

  const linkStyle = {
    color: '#858585', background: 'none', border: 'none',
    textDecoration: 'underline', textUnderlineOffset: '2px',
    cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '28px', fontWeight: 400, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.5px', marginBottom: '48px' }}>
          Katharos
        </div>

        {mode === 'gate' && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#242424', border: '1px solid #3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Lock style={{ width: '20px', height: '20px', color: '#6b6b6b' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '12px' }}>
              Restricted Access
            </h1>
            <p style={{ fontSize: '14px', color: '#858585', lineHeight: 1.7, marginBottom: '32px' }}>
              Access is currently restricted to partner institutions.<br />
              Please log in or request a firm-wide demo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => { setMode('login'); setError(''); }}
                style={{
                  width: '100%', padding: '14px', background: '#ffffff', color: '#1a1a1a',
                  border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif",
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Log In
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>

              <a
                href="https://calendly.com/patrick-katharos/30min"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%', padding: '14px', background: 'transparent', color: '#858585',
                  border: '1px solid #3a3a3a', borderRadius: '6px', fontFamily: "'Inter', sans-serif",
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6b6b6b'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#858585'; }}
              >
                Request a Demo
              </a>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '28px' }}>
              Enter your institutional email to continue
            </p>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="on">
              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" autoFocus style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <KeyRound style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" style={inputStyle} />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setResetSent(false); setResetEmail(''); }} style={{ ...linkStyle, fontSize: '12px' }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: '4px',
                  background: '#ffffff', color: '#1a1a1a',
                  border: 'none', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Verifying...</>
                ) : (
                  <>Log In <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={() => { setMode('gate'); setError(''); }} style={linkStyle}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === 'set-password' && pendingInvite && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#242424', border: '1px solid #3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <KeyRound style={{ width: '20px', height: '20px', color: '#6b6b6b' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
              {pendingInvite.isReset ? 'Reset Your Password' : 'Create Your Password'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '28px' }}>
              {pendingInvite.isReset
                ? 'Choose a new password for your account.'
                : `Welcome${pendingInvite.name ? `, ${pendingInvite.name.split(' ')[0]}` : ''}. Set a password to secure your account.`
              }
            </p>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSetPassword} autoComplete="off">
              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <KeyRound style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password (min. 8 characters)" autoComplete="new-password" autoFocus style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <KeyRound style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" style={inputStyle} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: '4px',
                  background: '#ffffff', color: '#1a1a1a',
                  border: 'none', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Setting up...</>
                ) : (
                  <>Create Account <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {mode === 'forgot-password' && !resetSent && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '28px' }}>
              Enter your email and we'll send a reset link
            </p>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleForgotPassword} autoComplete="off">
              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email address" autoComplete="email" autoFocus style={inputStyle} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: '4px',
                  background: '#ffffff', color: '#1a1a1a',
                  border: 'none', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Sending...</>
                ) : (
                  <>Send Reset Link <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
                Back to login
              </button>
            </div>
          </div>
        )}

        {mode === 'forgot-password' && resetSent && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Mail style={{ width: '20px', height: '20px', color: '#22c55e' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '12px' }}>
              Check Your Email
            </h1>
            <p style={{ fontSize: '14px', color: '#858585', lineHeight: 1.7, marginBottom: '24px' }}>
              If an account exists for that email, we've sent a link to reset your password.
            </p>
            <button onClick={() => { setMode('login'); setResetSent(false); setError(''); }} style={linkStyle}>
              Back to login
            </button>
          </div>
        )}

        {mode === 'demo' && !demoSent && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
              Request a Demo
            </h1>
            <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '28px' }}>
              We'll reach out to schedule a walkthrough
            </p>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleDemoRequest} autoComplete="off">
              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <input type="text" value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Your name" autoComplete="name" autoFocus style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input type="email" value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} placeholder="Work email" autoComplete="email" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                  <input type="text" value={demoCompany} onChange={(e) => setDemoCompany(e.target.value)} placeholder="Firm name" autoComplete="organization" style={inputStyle} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: '4px',
                  background: '#ffffff', color: '#1a1a1a',
                  border: 'none', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Submitting...</>
                ) : (
                  <><Send style={{ width: '16px', height: '16px' }} /> Request Demo</>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={() => { setMode('gate'); setError(''); }} style={linkStyle}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === 'demo' && demoSent && (
          <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Send style={{ width: '20px', height: '20px', color: '#22c55e' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '12px' }}>
              Request Received
            </h1>
            <p style={{ fontSize: '14px', color: '#858585', lineHeight: 1.7, marginBottom: '24px' }}>
              Thank you. A member of our team will be in touch within 24 hours to schedule your demo.
            </p>
            <button onClick={() => { setMode('gate'); setDemoSent(false); setError(''); }} style={linkStyle}>
              Back to login
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#4a4a4a', lineHeight: 1.6 }}>
          Katharos Technologies, Inc.
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthPage;
