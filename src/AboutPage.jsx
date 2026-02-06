// AboutPage.jsx - Katharos About Page
import {
  ChevronDown,
  LogOut,
  ArrowRight,
  AlertCircle,
  Eye,
  Lock,
  Users,
  Zap,
  Globe
} from 'lucide-react';

const AboutPage = ({
  isConfigured,
  user,
  signOut,
  startNewCase,
  setCurrentPage
}) => {
  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-12 py-6 max-w-[1200px] mx-auto"
        style={{ borderBottom: '1px solid #3a3a3a' }}
      >
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
            style={{ color: '#858585', letterSpacing: '0.5px' }}
          >
            About
          </button>
          <button
            onClick={() => setCurrentPage('contact')}
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#ffffff', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#858585'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
          >
            Contact
          </button>

          {isConfigured && user ? (
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-5 py-2 rounded transition-all text-[13px] uppercase"
                style={{ color: '#ffffff', border: '1px solid #4a4a4a', letterSpacing: '0.5px' }}
              >
                <span>{user.email?.split('@')[0]}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div
                className="absolute right-0 top-full mt-2 w-48 py-2 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
                style={{ background: '#2d2d2d', border: '1px solid #3a3a3a' }}
              >
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                  style={{ color: '#a1a1a1', background: 'transparent', border: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#3a3a3a'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1a1'; }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => startNewCase()}
              className="px-5 py-2 rounded text-[13px] uppercase transition-all"
              style={{ color: '#ffffff', border: '1px solid #4a4a4a', letterSpacing: '0.5px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#1a1a1a';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#4a4a4a';
              }}
            >
              Request Access
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-28 px-10 relative">
        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase mb-8" style={{ color: '#858585', letterSpacing: '3px' }}>
            Our Story
          </p>
          <h1 className="text-[72px] font-semibold mb-7 leading-[1.05]" style={{ color: '#ffffff', letterSpacing: '-3px' }}>
            Built by investigators,<br /><span style={{ color: '#858585' }}>for investigators</span>
          </h1>
          <p className="text-[17px] font-light max-w-[520px] mx-auto leading-[1.7]" style={{ color: '#a1a1a1' }}>
            We started Katharos because the people fighting financial crime
            deserve <strong style={{ color: '#ffffff', fontWeight: 500 }}>tools as sharp as the criminals they pursue</strong>.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Mission */}
      <section className="max-w-[800px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          Our Mission
        </p>
        <h2 className="text-4xl font-semibold text-center mb-6" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          To Fight Back Against Financial Crime
        </h2>
        <p className="text-base font-light text-center max-w-[560px] mx-auto mb-12 leading-[1.7]" style={{ color: '#a1a1a1' }}>
          Trillions of dollars flow through illicit channels every year.
          We believe AI can tip the scales back toward justice.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { num: '01', title: 'The Problem', text: 'Global money laundering totals $2 trillion annually. Compliance teams are overwhelmed, understaffed, and stuck with tools designed for a slower era.' },
            { num: '02', title: 'Our Approach', text: 'We combine deep domain expertise in financial crime with frontier AI to automate the research, synthesis, and reporting that consumes analysts\' time.' },
            { num: '03', title: 'The Result', text: 'Investigators close cases in minutes instead of hours, with deeper analysis and more consistent documentation than ever before.' },
            { num: '04', title: 'The Vision', text: 'A world where every financial institution has the investigative capability of the largest banks — democratized through intelligent software.' }
          ].map((card, i) => (
            <div key={i} className="p-9 transition-colors" style={{ background: '#2d2d2d' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b6b6b', letterSpacing: '1px', marginBottom: '20px' }}>{card.num}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.4px' }}>{card.title}</h3>
              <p style={{ fontSize: '14px', fontWeight: 300, color: '#a1a1a1', lineHeight: 1.65 }}>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Story */}
      <section className="max-w-[800px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          Our Journey
        </p>
        <h2 className="text-4xl font-semibold text-center mb-12" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          From Frustration to Foundation
        </h2>

        <div style={{ border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            {
              year: 'The Insight',
              heading: 'We saw the gap firsthand',
              text: 'Our founders spent years inside compliance teams at major financial institutions. They watched brilliant analysts waste 80% of their time on repetitive data gathering — copying names into screening tools, manually cross-referencing documents, stitching together timelines by hand.'
            },
            {
              year: 'The Breakthrough',
              heading: 'AI that thinks like an investigator',
              text: 'We didn\'t build a chatbot and bolt it onto compliance workflows. We built an AI system that mirrors how the best investigators actually work — reading documents in context, forming hypotheses, following leads, and documenting findings with the rigor regulators demand.'
            },
            {
              year: 'Today',
              heading: 'Trusted by teams that can\'t afford to miss anything',
              text: 'Katharos is used by compliance teams, law enforcement consultants, and investigative journalists who need to move faster without sacrificing depth. Every alert cleared is a step toward a cleaner financial system.'
            }
          ].map((block, i) => (
            <div
              key={i}
              className="relative p-12 transition-colors group"
              style={{ background: '#2d2d2d', borderTop: i > 0 ? '1px solid #3a3a3a' : 'none' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors"
                style={{ background: 'transparent' }}
              />
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b6b6b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
                {block.year}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '14px' }}>
                {block.heading}
              </h3>
              <p style={{ fontSize: '15px', fontWeight: 300, color: '#a1a1a1', lineHeight: 1.7, maxWidth: '580px' }}>
                {block.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Values */}
      <section className="max-w-[960px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          What We Believe
        </p>
        <h2 className="text-4xl font-semibold text-center mb-6" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          Principles That Guide Us
        </h2>
        <p className="text-base font-light text-center max-w-[520px] mx-auto mb-12 leading-[1.65]" style={{ color: '#a1a1a1' }}>
          Every decision we make is filtered through these commitments.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { icon: AlertCircle, title: 'Accuracy First', text: 'In investigations, a false positive wastes time. A false negative can cost lives. We optimize for precision above all else.' },
            { icon: Eye, title: 'Total Transparency', text: 'Every conclusion Katharos reaches can be traced back to its source data. No black boxes, no magic — just evidence.' },
            { icon: Lock, title: 'Security by Design', text: 'We handle the most sensitive data in financial services. Our architecture is built for zero-trust, end-to-end encryption, and full compliance.' },
            { icon: Users, title: 'Human in the Loop', text: 'AI augments investigators — it doesn\'t replace them. Every critical decision stays with the humans who are accountable.' },
            { icon: Zap, title: 'Speed as Justice', text: 'Every hour shaved off an investigation means resources freed to pursue the next case. Speed and thoroughness aren\'t at odds.' },
            { icon: Globe, title: 'Global Reach', text: 'Financial crime doesn\'t respect borders. Neither does Katharos — screening across jurisdictions, languages, and data formats.' }
          ].map((value, i) => (
            <div key={i} className="p-9 text-center transition-colors" style={{ background: '#2d2d2d' }}>
              <div
                className="mx-auto mb-6 transition-all"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #4a4a4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <value.icon style={{ width: '20px', height: '20px', color: '#a1a1a1' }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.2px' }}>{value.title}</h3>
              <p style={{ fontSize: '13px', fontWeight: 300, color: '#858585', lineHeight: 1.6 }}>{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Stats */}
      <section className="max-w-[800px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          By the Numbers
        </p>
        <h2 className="text-4xl font-semibold text-center mb-12" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          Built for Impact
        </h2>

        <div style={{ display: 'flex', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { value: '40+', label: 'Data Sources', sub: 'Sanctions, PEPs, adverse media' },
            { value: '10x', label: 'Faster', sub: 'Than manual investigation' },
            { value: '99.2%', label: 'Accuracy', sub: 'On entity resolution' },
            { value: '24/7', label: 'Monitoring', sub: 'Continuous risk screening' }
          ].map((stat, i) => (
            <div key={i} className="flex-1 text-center py-9 px-6 transition-colors" style={{ background: '#2d2d2d' }}>
              <div style={{ fontSize: '36px', fontWeight: 600, color: '#ffffff', letterSpacing: '-1px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#858585', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '12px', color: '#6b6b6b', marginTop: '4px', fontWeight: 300 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* CTA */}
      <section className="max-w-[600px] mx-auto px-10 pb-20 text-center">
        <h2 className="text-4xl font-semibold mb-4" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          Ready to See It in Action?
        </h2>
        <p className="text-base font-light max-w-[520px] mx-auto mb-9 leading-[1.7]" style={{ color: '#a1a1a1' }}>
          Request a demo and see how Katharos transforms your investigation workflow from start to finish.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => startNewCase()}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded text-sm font-semibold transition-all"
            style={{ background: '#ffffff', color: '#1a1a1a', letterSpacing: '0.3px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Request Access
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="px-8 py-3.5 rounded text-sm font-medium transition-all"
            style={{ background: 'transparent', color: '#a1a1a1', border: '1px solid #4a4a4a' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#858585';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1a1';
              e.currentTarget.style.borderColor = '#4a4a4a';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Contact Us
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10" style={{ borderTop: '1px solid #3a3a3a' }}>
        <div className="max-w-[800px] mx-auto px-10 flex items-center justify-between">
          <div style={{ fontFamily: "Georgia, serif", fontSize: '24px', fontWeight: 500, color: '#6b6b6b', letterSpacing: '-0.5px' }}>
            Katharos
          </div>
          <div className="flex gap-7">
            {['Product', 'About', 'Contact'].map((link) => (
              <button
                key={link}
                onClick={() => {
                  if (link === 'Product') setCurrentPage('product');
                  else if (link === 'About') setCurrentPage('about');
                  else if (link === 'Contact') setCurrentPage('contact');
                }}
                className="text-xs transition-colors bg-transparent border-none cursor-pointer"
                style={{ color: '#6b6b6b', letterSpacing: '0.3px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b6b6b'}
              >
                {link}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#6b6b6b', fontWeight: 300 }}>
            © 2026 Katharos
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
