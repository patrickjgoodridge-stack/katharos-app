// LandingPage.jsx - Katharos Landing Page
import {
  Building2,
  ChevronDown,
  LogOut,
  FileText,
  ArrowRight,
  Search,
  Network,
  Download,
  Upload,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  Globe,
  Zap,
  Scale,
  Briefcase,
  Flag,
  UserSearch,
  CheckCircle2
} from 'lucide-react';

const LandingPage = ({
  isConfigured,
  user,
  workspaceName,
  signOut,
  startNewCase,
  setCurrentPage
}) => {
  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a', fontFamily: "'Inter', -apple-system, sans-serif", border: 'none', outline: 'none', margin: 0, padding: 0 }}>
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
            style={{ color: '#ffffff', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#858585'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
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
              <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="rounded-md py-1 min-w-48" style={{ background: '#2d2d2d', border: '1px solid #3a3a3a' }}>
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid #3a3a3a' }}>
                    <p className="text-xs" style={{ color: '#6b6b6b' }}>Signed in as</p>
                    <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{user.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                    style={{ color: '#a1a1a1' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={startNewCase}
              className="px-5 py-2 rounded text-[13px] font-normal uppercase transition-all"
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
      <section className="text-center px-10 relative min-h-[calc(100vh-88px)] flex flex-col justify-center">
        {/* Radial gradient background */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)' }}
        />

        <div className="relative z-10">
          <h1
            className="text-[68px] font-normal mb-7 leading-[1.1]"
            style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-2px' }}
          >
            The AI investigator for<br />
            <span style={{ color: '#858585', fontStyle: 'italic' }}>financial crime</span>
          </h1>

          <p className="text-[17px] font-light max-w-[480px] mx-auto leading-[1.7]" style={{ color: '#ffffff' }}>
            Reduce investigation time from hours to minutes.<br />
            Close up to <strong style={{ fontWeight: 600 }}>10x</strong> more cases per week.
          </p>

          <div className="flex gap-3 justify-center mt-11">
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
              Run a Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="pt-32 pb-20 px-10" style={{ background: '#111111' }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Section Header */}
          <h2 className="text-4xl font-semibold text-center mb-12" style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-1px' }}>
            How It Works
          </h2>

          {/* Feature Grid Container */}
          <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d', overflow: 'hidden' }}>
            {/* Large Feature Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Upload & Analyze */}
              <div style={{ padding: '32px', borderRight: '1px solid #2d2d2d' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: '#242424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <Upload style={{ width: '24px', height: '24px', color: '#858585' }} />
                </div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>Upload & Analyze</h3>
                <p style={{ fontFamily: "Georgia, serif", fontSize: '15px', color: '#858585', lineHeight: 1.6 }}>
                  Drop in PDFs, emails, financials, or any documents. Katharos reads everything and surfaces what matters.
                </p>
              </div>

              {/* Ask & Investigate */}
              <div style={{ padding: '32px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: '#242424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <Search style={{ width: '24px', height: '24px', color: '#858585' }} />
                </div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>Ask & Investigate</h3>
                <p style={{ fontFamily: "Georgia, serif", fontSize: '15px', color: '#858585', lineHeight: 1.6 }}>
                  Chat naturally about your case. Follow up on findings, request deeper analysis, explore leads.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#2d2d2d' }} />

            {/* Small Feature Cards - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { icon: Users, title: 'Analyzing Documents', desc: 'Automatically identify people, companies, and relationships from unstructured documents' },
                { icon: Target, title: 'Typology Detection', desc: 'Identify financial crime patterns hidden in any data format' },
                { icon: Network, title: 'Network Mapping', desc: 'Visualize corporate structures and ownership chains to uncover hidden connections' },
                { icon: AlertTriangle, title: 'Risk Scoring', desc: 'AI-powered risk assessment with confidence scores and supporting evidence' }
              ].map((feature, i) => (
                <div key={i} style={{ padding: '24px', borderRight: i < 3 ? '1px solid #2d2d2d' : 'none' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#242424',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}
                  >
                    <feature.icon style={{ width: '20px', height: '20px', color: '#858585' }} />
                  </div>
                  <h4 style={{ fontFamily: "Georgia, serif", fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>{feature.title}</h4>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: '13px', color: '#6b6b6b', lineHeight: 1.5 }}>{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#2d2d2d' }} />

            {/* Small Feature Cards - Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { icon: FileText, title: 'Document Intelligence', desc: 'Process emails, financials, contracts, and corporate filings in any format' },
                { icon: Lightbulb, title: 'Generating Hypotheses', desc: 'Generate investigative leads and theories based on pattern analysis' },
                { icon: Globe, title: 'Global Sanctions', desc: 'Screen against OFAC, EU, UK, UN sanctions lists with alias matching' },
                { icon: Download, title: 'Export Reports', desc: 'Generate comprehensive PDF reports ready for regulatory submission' }
              ].map((feature, i) => (
                <div key={i} style={{ padding: '24px', borderRight: i < 3 ? '1px solid #2d2d2d' : 'none' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#242424',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}
                  >
                    <feature.icon style={{ width: '20px', height: '20px', color: '#858585' }} />
                  </div>
                  <h4 style={{ fontFamily: "Georgia, serif", fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>{feature.title}</h4>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: '13px', color: '#6b6b6b', lineHeight: 1.5 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Types Section */}
      <section className="py-20 px-10" style={{ background: '#0f0f0f' }}>
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-12" style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-1px' }}>
            Designed by Investigators, for Investigators
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Fintech', desc: 'Payment processors, neobanks, and crypto platforms scaling compliance operations' },
              { icon: Scale, title: 'Risk Consulting', desc: 'Advisory firms conducting due diligence and forensic investigations for clients' },
              { icon: Building2, title: 'Banking & Asset Management', desc: 'Financial institutions managing AML compliance and fraud investigation teams' },
              { icon: Briefcase, title: 'Corporates', desc: 'Internal audit and corporate security teams investigating misconduct and fraud' },
              { icon: Flag, title: 'Public Sector', desc: 'Government agencies and regulators enforcing financial crime laws' },
              { icon: UserSearch, title: 'Private Investigators', desc: 'Licensed investigators conducting asset traces and background research' }
            ].map((customer, i) => (
              <div
                key={i}
                className="rounded-xl p-6 transition-colors"
                style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: '#2d2d2d', border: '1px solid #3a3a3a' }}
                >
                  <customer.icon className="w-6 h-6" style={{ color: customer.highlight ? '#6366f1' : '#858585' }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: "Georgia, serif", color: '#ffffff' }}>{customer.title}</h4>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "Georgia, serif", color: '#6b6b6b' }}>{customer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 px-10" style={{ background: '#111111' }}>
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-2" style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-1px' }}>
            Investigations Are Stuck at Human Speed
          </h2>
          <p className="text-center mb-12" style={{ fontFamily: "Georgia, serif", color: '#ffffff' }}>
            Katharos Makes Them Faster, Deeper, Better
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <div
              className="rounded-xl p-8"
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
            >
              <span
                className="text-[11px] font-semibold block mb-4"
                style={{ fontFamily: "Georgia, serif", letterSpacing: '2px', textTransform: 'uppercase', color: '#6b6b6b' }}
              >
                Before
              </span>
              <p className="text-[15px] leading-[1.7] mb-6" style={{ fontFamily: "Georgia, serif", color: '#a1a1a1' }}>
                An analyst spends <strong style={{ color: '#ffffff', fontWeight: 600 }}>6-8 hours</strong> manually reviewing documents, tracking entities in a spreadsheet, building a timeline by hand, cross-referencing corporate structures, and writing up findings.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ fontFamily: "Georgia, serif", color: '#6b6b6b' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#4a4a4a' }} />
                6-8 hours per case
              </div>
            </div>

            {/* After */}
            <div
              className="rounded-xl p-8"
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
            >
              <span
                className="text-[11px] font-semibold block mb-4"
                style={{ fontFamily: "Georgia, serif", letterSpacing: '2px', textTransform: 'uppercase', color: '#858585' }}
              >
                With Katharos
              </span>
              <p className="text-[15px] leading-[1.7] mb-6" style={{ fontFamily: "Georgia, serif", color: '#a1a1a1' }}>
                Katharos processes the same documents <strong style={{ color: '#ffffff', fontWeight: 600 }}>in seconds</strong> and outputs <strong style={{ color: '#ffffff', fontWeight: 600 }}>3x the conclusions</strong> the analyst would've reached. The analyst reviews, asks follow-up questions, and gets straight to judgment calls that require human expertise.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ fontFamily: "Georgia, serif", color: '#858585' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#858585' }} />
                30 minutes per case
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="py-20 px-10" style={{ background: '#f5f5f5' }}>
        <div className="max-w-[1000px] mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-12" style={{ fontFamily: "Georgia, serif", color: '#1a1a1a', letterSpacing: '-1px' }}>
            The Investigation Pipeline
          </h2>

          {/* Pipeline Graphic */}
          <div className="relative">
            {/* Connection line */}
            <div
              className="absolute top-8 h-0.5 hidden md:block"
              style={{ left: '10%', right: '10%', background: '#d4d4d4' }}
            />

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 relative">
              {[
                { done: true, label: 'Collection' },
                { done: true, label: 'Processing' },
                { done: true, label: 'Basic Analysis' },
                { done: false, label: 'Advanced Analysis' },
                { done: false, label: 'Synthesis' },
                { done: false, label: 'Interpretation' }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3 relative z-10"
                    style={{
                      background: '#ffffff',
                      border: `2px solid ${step.done ? '#d4d4d4' : '#4a4a4a'}`
                    }}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-7 h-7" style={{ color: '#d4d4d4' }} />
                    ) : (
                      <Zap className="w-7 h-7" style={{ color: '#4a4a4a' }} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-center" style={{ fontFamily: "Georgia, serif", color: '#1a1a1a' }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#d4d4d4' }} />
              <span className="text-sm" style={{ fontFamily: "Georgia, serif", color: '#6b6b6b' }}>Already automated by existing tools</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#4a4a4a' }} />
              <span className="text-sm" style={{ fontFamily: "Georgia, serif", color: '#6b6b6b' }}>Now automated by Katharos</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-10" style={{ background: '#1a1a1a' }}>
        <div className="max-w-[800px] mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl font-semibold mb-10 leading-tight"
            style={{ fontFamily: "Georgia, serif", color: '#ffffff', letterSpacing: '-1px' }}
          >
            Ready to accelerate your investigations?
          </h2>
          <button
            onClick={() => startNewCase()}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#4a4a4a', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a5a5a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4a4a4a';
            }}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10" style={{ borderTop: '1px solid #3a3a3a' }}>
        <button
          onClick={() => setCurrentPage('disclosures')}
          className="text-[12px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer mb-4"
          style={{ color: '#ffffff', letterSpacing: '0.5px' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#858585'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
        >
          Disclosures
        </button>
        <p className="text-[11px]" style={{ color: '#ffffff' }}>
          © 2026 Katharos Technologies, Inc. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
