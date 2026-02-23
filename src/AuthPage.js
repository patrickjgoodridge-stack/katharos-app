// AuthPage.js - Simple email gate (name + email)
// Full Supabase Auth version preserved in AuthPage.supabase-auth.js
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, ArrowRight, Loader2, User, Building2 } from 'lucide-react';

const AuthPage = ({ onSuccess }) => {
  const { submitEmail } = useAuth();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }

    setLoading(true);
    try {
      const result = await submitEmail(email, name, company);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
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

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '28px', fontWeight: 400, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.5px', marginBottom: '48px' }}>
          Katharos
        </div>
        <div style={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: '8px', padding: '36px 32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', textAlign: 'center', letterSpacing: '-0.3px', marginBottom: '6px' }}>
            Get Started
          </h1>
          <p style={{ fontSize: '13px', color: '#6b6b6b', textAlign: 'center', marginBottom: '32px' }}>
            Enter your details to continue
          </p>

          {error && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
              <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                <User style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" autoFocus style={inputStyle} />
              </div>
            </div>

            {/* Company (optional) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                <Building2 style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" autoComplete="organization" style={inputStyle} />
                <span style={{ fontSize: '11px', color: '#6b6b6b', flexShrink: 0 }}>Optional</span>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <div style={inputWrapStyle} onFocus={(e) => focusWrap(e, true)} onBlur={(e) => focusWrap(e, false)}>
                <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" style={inputStyle} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', marginTop: '8px',
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
                <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Loading...</>
              ) : (
                <>Continue <ArrowRight style={{ width: '16px', height: '16px' }} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#6b6b6b', lineHeight: 1.6 }}>
          By continuing, you agree to our{' '}
          <button type="button" style={{ color: '#858585', background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Terms of Service</button>
          {' '}and{' '}
          <button type="button" style={{ color: '#858585', background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Privacy Policy</button>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthPage;
