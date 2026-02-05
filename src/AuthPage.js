// AuthPage.js - Get Started Page
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, ArrowRight, Loader2, User, Home } from 'lucide-react';

const AuthPage = ({ onSuccess }) => {
  const { submitEmail } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await submitEmail(formData.email, formData.name, formData.company);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Get Started
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#6b6b6b',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Enter your details to access Katharos
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px'
            }}>
              <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#242424',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                padding: '0 14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
              >
                <User style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="Your name"
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#ffffff',
                    padding: '13px 0'
                  }}
                />
              </div>
            </div>

            {/* Company */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#242424',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                padding: '0 14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
              >
                <Home style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={handleChange('company')}
                  placeholder="Company"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#ffffff',
                    padding: '13px 0'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b6b6b', flexShrink: 0 }}>Optional</span>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#242424',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                padding: '0 14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6b6b6b'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3a'}
              >
                <Mail style={{ width: '16px', height: '16px', color: '#6b6b6b', flexShrink: 0 }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="Email"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#ffffff',
                    padding: '13px 0'
                  }}
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
                  Loading...
                </>
              ) : (
                <>
                  Continue
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
              cursor: 'pointer',
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

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: '#6b6b6b'
        }}>
          Already have an account?{' '}
          <button
            type="button"
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
            Sign in
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
