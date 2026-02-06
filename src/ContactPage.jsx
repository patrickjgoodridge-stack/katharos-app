// ContactPage.jsx - Contact Form
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const ContactPage = ({ setCurrentPage }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Store in Supabase if configured
      if (isSupabaseConfigured()) {
        const { error: dbError } = await supabase
          .from('contact_submissions')
          .insert([{
            name: formData.name,
            company: formData.company,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString()
          }]);

        if (dbError) {
          console.error('Error storing contact submission:', dbError);
          // Continue anyway - we'll still show success
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Something went wrong. Please try again or email us directly at patrick@katharos.co');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: '#1a1a1a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* Nav */}
        <nav className="flex items-center justify-between px-12 py-6 max-w-[1200px] mx-auto" style={{ borderBottom: '1px solid #3a3a3a' }}>
          <button
            onClick={() => setCurrentPage('noirLanding')}
            className="text-[28px] font-medium bg-transparent border-none cursor-pointer"
            style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-0.5px' }}
          >
            Katharos
          </button>
        </nav>

        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h1 className="text-4xl font-semibold mb-6" style={{ fontFamily: "Georgia, serif", color: '#ffffff' }}>
            Message Sent
          </h1>
          <p className="text-lg mb-8" style={{ color: '#a1a1a1' }}>
            Thank you for reaching out. We'll get back to you shortly.
          </p>
          <button
            onClick={() => setCurrentPage('noirLanding')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium transition-all"
            style={{ background: '#ffffff', color: '#1a1a1a' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-12 py-6 max-w-[1200px] mx-auto" style={{ borderBottom: '1px solid #3a3a3a' }}>
        <button
          onClick={() => setCurrentPage('noirLanding')}
          className="text-[28px] font-medium bg-transparent border-none cursor-pointer"
          style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-0.5px' }}
        >
          Katharos
        </button>
        <div className="flex items-center gap-9">
          <button
            onClick={() => setCurrentPage('product')}
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#ffffff', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#858585'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
          >
            Product
          </button>
          <button
            onClick={() => setCurrentPage('about')}
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#ffffff', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#858585'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
          >
            About
          </button>
          <button
            onClick={() => setCurrentPage('contact')}
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#858585', letterSpacing: '0.5px' }}
          >
            Contact
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-[600px] mx-auto px-8 py-16">
        <button
          onClick={() => setCurrentPage('noirLanding')}
          className="flex items-center gap-2 text-sm mb-8 bg-transparent border-none cursor-pointer transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-4xl font-semibold mb-4" style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-1px' }}>
          Contact Us
        </h1>
        <p className="text-lg mb-10" style={{ color: '#a1a1a1' }}>
          Have questions about Katharos? We'd love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#858585' }}>
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                style={{
                  background: '#2d2d2d',
                  border: '1px solid #3a3a3a',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#858585' }}>
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                style={{
                  background: '#2d2d2d',
                  border: '1px solid #3a3a3a',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#858585' }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: '#2d2d2d',
                border: '1px solid #3a3a3a',
                color: '#ffffff',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#858585' }}>
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: '#2d2d2d',
                border: '1px solid #3a3a3a',
                color: '#ffffff',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#858585' }}>
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 rounded-lg text-sm transition-colors resize-none"
              style={{
                background: '#2d2d2d',
                border: '1px solid #3a3a3a',
                color: '#ffffff',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: '#ffffff',
              color: '#1a1a1a',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm" style={{ color: '#6b6b6b' }}>
          Or email us directly at{' '}
          <a
            href="mailto:patrick@katharos.co"
            className="transition-colors"
            style={{ color: '#a1a1a1' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1a1'}
          >
            patrick@katharos.co
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
