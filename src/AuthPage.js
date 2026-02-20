// AuthPage.js - Sign In / Create Account with OTP Verification + Google OAuth
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, ArrowRight, Loader2, User, Home, ArrowLeft, ShieldCheck } from 'lucide-react';

const AuthPage = ({ onSuccess }) => {
  const { submitEmail, verifyOtp, signInWithGoogle, awaitingOtp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

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
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(formData.email, otpCode);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
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
      if (!result.success) {
        setError(result.error || 'Failed to resend code.');
      }
    } catch {
      setError('Failed to resend code.');
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
        setError(result.error || 'Google sign-in failed.');
        setLoading(false);
      }
      // On success, page will redirect to Google OAuth
    } catch {
      setError('Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowOtp(false);
    setOtpCode('');
    setError('');
  };

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: '#ffffff',
    padding: '13px 0'
  };

  const inputWrapStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#242424',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    padding: '0 14px',
    transition: 'border-color 0.2s'
  };

  // OTP Verification Screen
  if (showOtp || awaitingOtp) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
          {/* Logo */}
          <div style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: '28px',
            fontWeight: 400,
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: '-0.5px',
            marginBottom: '48px'
          }}>
            Katharos
          </div>

          {/* Card */}
          <div style={{
            background: '#2d2d2d',
            border: '1px solid #3a3a3a',
            borderRadius: '8px',
            padding: '36px 32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
              <ShieldCheck style={{ width: '20px', height: '20px', color: '#4caf50' }} />
              <h1 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: '-0.3px',
                margin: 0
              }}>
                Check your email
              </h1>
            </div>
            <p style={{
              fontSize: '13px',
              color: '#6b6b6b',
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              We sent a 6-digit verification code to <strong style={{ color: '#a1a1a1' }}>{formData.email}</strong>
            </p>

            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px'
              }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={inputWrapStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
                >
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    autoFocus
                    maxLength={6}
                    style={{
                      ...inputStyle,
                      letterSpacing: '4px',
                      fontSize: '18px',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '8px',
                  background: otpCode.length >= 6 ? '#ffffff' : '#3a3a3a',
                  color: otpCode.length >= 6 ? '#1a1a1a' : '#6b6b6b',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading || otpCode.length < 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.15s'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                style={{
                  color: '#6b6b6b',
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Resend code
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  color: '#6b6b6b',
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft style={{ width: '12px', height: '12px' }} />
                Back
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main Sign-In / Sign-Up Screen
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '28px',
          fontWeight: 400,
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: '-0.5px',
          marginBottom: '48px'
        }}>
          Katharos
        </div>

        {/* Card */}
        <div style={{
          background: '#2d2d2d',
          border: '1px solid #3a3a3a',
          borderRadius: '8px',
          padding: '36px 32px'
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: '-0.3px',
            marginBottom: '6px'
          }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#6b6b6b',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            {mode === 'signin'
              ? "We'll email you a verification code"
              : 'Sign up with your email to get started'}
          </p>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px'
            }}>
              <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name — only on sign-up */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={inputWrapStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
                >
                  <User style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Company — only on sign-up */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={inputWrapStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
                >
                  <Home style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={handleChange('company')}
                    placeholder="Company"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: '11px', color: '#6b6b6b', flexShrink: 0 }}>Optional</span>
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={inputWrapStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
              >
                <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="Email address"
                  autoFocus
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s, transform 0.15s'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Sending code...
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Send verification code' : 'Create account'}
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#3a3a3a' }} />
            <span style={{ fontSize: '11px', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#3a3a3a' }} />
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#a1a1a1',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'border-color 0.15s, color 0.15s'
            }}
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
        </div>

        {/* Footer toggle */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: '#6b6b6b'
        }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={toggleMode}
            style={{
              color: '#ffffff',
              background: 'none',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px'
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Terms */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '11px',
          color: '#6b6b6b',
          lineHeight: 1.6
        }}>
          By continuing, you agree to our{' '}
          <button
            type="button"
            style={{
              color: '#858585',
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px'
            }}
          >
            Terms of Service
          </button>
          {' '}and{' '}
          <button
            type="button"
            style={{
              color: '#858585',
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px'
            }}
          >
            Privacy Policy
          </button>
        </p>
      </div>

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
