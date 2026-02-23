// AuthPage.js - Full Auth: Password + Magic Link OTP + Google OAuth
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, ArrowRight, Loader2, User, Building2, ArrowLeft, ShieldCheck, Lock, KeyRound } from 'lucide-react';

// ---- Shared layout wrapper (outside component to preserve identity across renders) ----
const PageShell = ({ children, footer }) => (
  <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif" }}>
    <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '28px', fontWeight: 400, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.5px', marginBottom: '48px' }}>
        Katharos
      </div>
      <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
        {children}
      </div>
      {footer}
    </div>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorBanner = ({ message }) => message ? (
  <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
    <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{message}</p>
  </div>
) : null;

const SuccessBanner = ({ message }) => message ? (
  <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)', borderRadius: '6px' }}>
    <p style={{ fontSize: '13px', color: '#4ade80', margin: 0 }}>{message}</p>
  </div>
) : null;

const inputStyle = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#ffffff', padding: '13px 0'
};

const inputWrapStyle = {
  display: 'flex', alignItems: 'center', gap: '12px',
  background: '#242424', border: '1px solid #3a3a3a', borderRadius: '6px',
  padding: '0 14px', transition: 'border-color 0.2s'
};

const linkBtnStyle = {
  color: '#6b6b6b', background: 'none', border: 'none', fontSize: '13px',
  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
  textDecoration: 'underline', textUnderlineOffset: '2px',
};

const focusWrap = (e, focus) => {
  e.currentTarget.style.borderColor = focus ? '#6b6b6b' : '#3a3a3a';
};

// Map raw Supabase errors to user-friendly messages
const friendlyError = (msg) => {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('email rate limit exceeded') || lower.includes('rate limit'))
    return 'Too many attempts. Please wait a few minutes before trying again.';
  if (lower.includes('invalid login credentials'))
    return 'Invalid email or password.';
  if (lower.includes('user already registered'))
    return 'An account with this email already exists. Try signing in instead.';
  if (lower.includes('signup is not allowed') || lower.includes('signups not allowed'))
    return 'Sign-ups are currently disabled. Please contact support.';
  if (lower.includes('password') && lower.includes('least'))
    return msg; // already descriptive (e.g. "Password should be at least 6 characters")
  return msg;
};

const AuthPage = ({ onSuccess }) => {
  const {
    submitEmail, verifyOtp, signUpWithPassword, signInWithPassword,
    resetPassword, updatePassword, signInWithGoogle, awaitingOtp, passwordRecovery
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'magiclink'
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Password sign-in
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim()) { setError('Please enter your email'); return; }
    if (!formData.password) { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      const result = await signInWithPassword(formData.email, formData.password);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(friendlyError(result.error) || 'Invalid email or password.');
      }
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password sign-up
  const handlePasswordSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) { setError('Please enter your name'); return; }
    if (!formData.email.trim()) { setError('Please enter your email'); return; }
    if (!formData.password) { setError('Please enter a password'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      const result = await signUpWithPassword(formData.email, formData.password, formData.name, formData.company);
      if (result.success) {
        if (result.needsConfirmation) {
          setShowConfirmation(true);
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(friendlyError(result.error) || 'Sign up failed. Please try again.');
      }
    } catch {
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Magic link submit
  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim()) { setError('Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      const result = await submitEmail(
        formData.email,
        mode === 'signup' ? formData.name : '',
        mode === 'signup' ? formData.company : ''
      );
      if (result.success) {
        setShowOtp(true);
      } else {
        setError(friendlyError(result.error) || 'Something went wrong.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.trim().length < 6) { setError('Please enter the 6-digit code'); return; }

    setLoading(true);
    try {
      const result = await verifyOtp(formData.email, otpCode);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(friendlyError(result.error) || 'Invalid code. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await submitEmail(formData.email, formData.name, formData.company);
      if (result.success) {
        setSuccess('Code resent.');
      } else {
        setError(friendlyError(result.error) || 'Failed to resend code.');
      }
    } catch {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim()) { setError('Please enter your email first'); return; }

    setLoading(true);
    try {
      const result = await resetPassword(formData.email);
      if (result.success) {
        setSuccess('Password reset link sent to your email.');
      } else {
        setError(friendlyError(result.error) || 'Failed to send reset link.');
      }
    } catch {
      setError('Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(friendlyError(result.error) || 'Google sign-in failed.');
        setLoading(false);
      }
    } catch {
      setError('Google sign-in failed.');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError(''); setSuccess('');
    setShowForgotPassword(false);
    setAuthMethod('password');
  };

  const primaryBtnStyle = (enabled = true) => ({
    width: '100%', padding: '14px', marginTop: '8px',
    background: enabled ? '#ffffff' : '#3a3a3a',
    color: enabled ? '#1a1a1a' : '#6b6b6b',
    border: 'none', borderRadius: '6px',
    fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
    cursor: !enabled || loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    opacity: loading ? 0.7 : 1, transition: 'all 0.15s'
  });

  // ---- Set New Password screen (after clicking reset link) ----
  if (passwordRecovery) {
    const handleSetNewPassword = async (e) => {
      e.preventDefault();
      setError(''); setSuccess('');

      if (!newPassword) { setError('Please enter a new password'); return; }
      if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

      setLoading(true);
      try {
        const result = await updatePassword(newPassword);
        if (result.success) {
          setSuccess('Password updated successfully.');
          setNewPassword('');
          setConfirmPassword('');
          if (onSuccess) setTimeout(() => onSuccess(), 1500);
        } else {
          setError(friendlyError(result.error) || 'Failed to update password.');
        }
      } catch {
        setError('Failed to update password.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <PageShell footer={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
          <Lock style={{ width: '20px', height: '20px', color: '#4caf50' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', margin: 0 }}>
            Set New Password
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '32px' }}>
          Enter your new password below
        </p>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        <form onSubmit={handleSetNewPassword}>
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <Lock style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)" autoComplete="new-password" autoFocus style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <Lock style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={primaryBtnStyle(true)}>
            {loading ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Updating...</> : <>Update password <ArrowRight style={{ width: '16px', height: '16px' }} /></>}
          </button>
        </form>
      </PageShell>
    );
  }

  // ---- Email confirmation screen (after password sign-up) ----
  if (showConfirmation) {
    return (
      <PageShell footer={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
          <Mail style={{ width: '20px', height: '20px', color: '#4caf50' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', margin: 0 }}>
            Check your email
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '24px' }}>
          We sent a confirmation link to <strong style={{ color: '#a1a1a1' }}>{formData.email}</strong>. Click the link to activate your account.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={() => { setShowConfirmation(false); setMode('signin'); setAuthMethod('password'); setError(''); setSuccess(''); }} style={linkBtnStyle}>
            Back to sign in
          </button>
        </div>
      </PageShell>
    );
  }

  // ---- OTP Verification Screen ----
  if (showOtp || awaitingOtp) {
    return (
      <PageShell footer={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
          <ShieldCheck style={{ width: '20px', height: '20px', color: '#4caf50' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', margin: 0 }}>
            Check your email
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '32px' }}>
          We sent a 6-digit verification code to <strong style={{ color: '#a1a1a1' }}>{formData.email}</strong>
        </p>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" autoFocus maxLength={6}
                style={{ ...inputStyle, letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }} />
            </div>
          </div>
          <button type="submit" disabled={loading || otpCode.length < 6} style={primaryBtnStyle(otpCode.length >= 6)}>
            {loading ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Verifying...</> : <>Verify <ArrowRight style={{ width: '16px', height: '16px' }} /></>}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="button" onClick={handleResendCode} disabled={loading} style={linkBtnStyle}>Resend code</button>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button type="button" onClick={() => { setShowOtp(false); setOtpCode(''); setError(''); setSuccess(''); }} style={{ ...linkBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: '12px', height: '12px' }} /> Back
          </button>
        </div>
      </PageShell>
    );
  }

  // ---- Forgot Password Screen ----
  if (showForgotPassword) {
    return (
      <PageShell footer={null}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '32px' }}>
          Enter your email and we'll send you a reset link
        </p>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        <form onSubmit={handleForgotPassword}>
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="email" value={formData.email} onChange={handleChange('email')} placeholder="Email address" autoFocus style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={primaryBtnStyle(true)}>
            {loading ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Sending...</> : <>Send reset link <ArrowRight style={{ width: '16px', height: '16px' }} /></>}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="button" onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }} style={{ ...linkBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: '12px', height: '12px' }} /> Back to sign in
          </button>
        </div>
      </PageShell>
    );
  }

  // ---- Main Sign In / Sign Up ----
  const isSignIn = mode === 'signin';
  const isPassword = authMethod === 'password';
  const handleSubmit = isPassword
    ? (isSignIn ? handlePasswordSignIn : handlePasswordSignUp)
    : handleMagicLinkSubmit;

  const footer = (
    <>
      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#6b6b6b' }}>
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <button type="button" onClick={toggleMode} style={{ color: '#ffffff', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
          {isSignIn ? 'Sign up' : 'Sign in'}
        </button>
      </p>
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#6b6b6b', lineHeight: 1.6 }}>
        By continuing, you agree to our{' '}
        <button type="button" style={{ color: '#858585', background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Terms of Service</button>
        {' '}and{' '}
        <button type="button" style={{ color: '#858585', background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Privacy Policy</button>
      </p>
    </>
  );

  return (
    <PageShell footer={footer}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
        {isSignIn ? 'Sign In' : 'Create Account'}
      </h1>
      <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '32px' }}>
        {isSignIn
          ? (isPassword ? 'Sign in with your email and password' : "We'll email you a verification code")
          : (isPassword ? 'Create your account to get started' : 'Sign up with a magic link')}
      </p>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Name — sign-up only */}
        {!isSignIn && (
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <User style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="text" value={formData.name} onChange={handleChange('name')} placeholder="Your name" autoComplete="name" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Company — sign-up only */}
        {!isSignIn && (
          <div style={{ marginBottom: '16px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <Building2 style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="text" value={formData.company} onChange={handleChange('company')} placeholder="Company" autoComplete="organization" style={inputStyle} />
              <span style={{ fontSize: '11px', color: '#6b6b6b', flexShrink: 0 }}>Optional</span>
            </div>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
            <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
            <input type="email" value={formData.email} onChange={handleChange('email')} placeholder="Email address" autoComplete="email" style={inputStyle} />
          </div>
        </div>

        {/* Password — only for password method */}
        {isPassword && (
          <div style={{ marginBottom: '8px' }}>
            <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
              <Lock style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
              <input type="password" value={formData.password} onChange={handleChange('password')} placeholder={isSignIn ? 'Password' : 'Create password (min 6 characters)'} autoComplete={isSignIn ? 'current-password' : 'new-password'} style={inputStyle} />
            </div>
          </div>
        )}

        {/* Forgot password — sign-in with password only */}
        {isSignIn && isPassword && (
          <div style={{ textAlign: 'right', marginBottom: '8px' }}>
            <button type="button" onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }} style={{ ...linkBtnStyle, fontSize: '12px' }}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} style={primaryBtnStyle(true)}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {loading ? (
            <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> {isPassword ? (isSignIn ? 'Signing in...' : 'Creating account...') : 'Sending code...'}</>
          ) : (
            <>{isPassword ? (isSignIn ? 'Sign in' : 'Create account') : 'Send verification code'} <ArrowRight style={{ width: '16px', height: '16px' }} /></>
          )}
        </button>
      </form>

      {/* Toggle auth method */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button type="button" onClick={() => { setAuthMethod(a => a === 'password' ? 'magiclink' : 'password'); setError(''); setSuccess(''); }}
          style={{ ...linkBtnStyle, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <KeyRound style={{ width: '12px', height: '12px' }} />
          {isPassword ? 'Use magic link instead' : 'Use password instead'}
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#3a3a3a' }} />
        <span style={{ fontSize: '11px', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: '#3a3a3a' }} />
      </div>

      {/* Google */}
      <button type="button" onClick={handleGoogleSignIn} disabled={loading}
        style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#a1a1a1', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'border-color 0.15s, color 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4a4a4a'; e.currentTarget.style.color = '#ffffff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#a1a1a1'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </PageShell>
  );
};

export default AuthPage;
