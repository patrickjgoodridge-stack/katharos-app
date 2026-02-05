// ProductPage.jsx - Katharos Product Page
import {
  Search,
  FileText,
  Network,
  Activity,
  Download,
  Globe,
  AlertTriangle,
  Monitor,
  ChevronDown,
  LogOut,
  ArrowRight
} from 'lucide-react';

const ProductPage = ({
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
          >
            Product
          </button>
          <button
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#858585', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            Features
          </button>
          <button
            className="text-[13px] font-normal uppercase transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#858585', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            About
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

      {/* Product Hero */}
      <section className="text-center py-24 px-10 relative">
        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
            Product
          </p>
          <h1 className="text-[56px] font-semibold mb-5 leading-[1.1]" style={{ color: '#ffffff', letterSpacing: '-2.5px' }}>
            See how Katharos<br /><span style={{ color: '#858585' }}>investigates</span>
          </h1>
          <p className="text-[16px] font-light max-w-[540px] mx-auto mb-10 leading-[1.65]" style={{ color: '#a1a1a1' }}>
            From raw data to regulatory-ready reports. One platform that handles research, analysis, and documentation.
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
              Request a Demo
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
              Watch Walkthrough
            </button>
          </div>
        </div>
      </section>

      {/* App Preview - Investigation Results */}
      <section className="max-w-[900px] mx-auto px-10">
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '48px 56px', position: 'relative' }}>
          {/* Subject Name - Top Right */}
          <div style={{ position: 'absolute', top: '32px', right: '48px' }}>
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#d4d4d4', padding: '10px 20px', borderRadius: '6px', border: '1px solid #3a3a3a', background: '#242424' }}>Sinaloa Cartel</span>
          </div>

          {/* Risk Alert Banner */}
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '20px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '22px', height: '22px', color: '#ef4444' }} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', letterSpacing: '1px' }}>OVERALL RISK: CRITICAL</span>
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(239, 68, 68, 0.7)', marginLeft: '12px' }}>100 / 100</span>
            </div>
          </div>

          {/* Decision Header */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.2px' }}>BLOCKED - OFAC SANCTIONED TERRORIST ORGANIZATION</h3>

          {/* Description */}
          <p style={{ fontSize: '15px', fontWeight: 300, color: '#d4d4d4', lineHeight: 1.7, marginBottom: '32px' }}>
            The Sinaloa Cartel is a designated Foreign Terrorist Organization (FTO) and Specially Designated Global Terrorist (SDGT) under OFAC sanctions. This is an automatic rejection with no exceptions permitted under U.S. law. Any transaction, relationship, or business with this entity would constitute a federal crime under the International Emergency Economic Powers Act (IEEPA).
          </p>

          {/* Risk Scoring Table */}
          <div style={{ marginBottom: '32px' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr', padding: '12px 20px', background: '#242424', borderRadius: '6px 6px 0 0' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b6b6b' }}>Factor</span>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b6b6b' }}>Score</span>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b6b6b' }}>Reasoning</span>
            </div>
            {/* Table Rows */}
            {[
              { factor: 'OFAC SDN Designation', score: '+100', reasoning: 'Direct SDN match - terrorist organization' },
              { factor: 'FTO Status', score: '+100', reasoning: 'State Department Foreign Terrorist Organization' },
              { factor: 'Criminal Organization', score: '+100', reasoning: 'Transnational criminal enterprise' },
              { factor: 'Drug Trafficking', score: '+100', reasoning: 'Primary fentanyl trafficking organization' }
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr', padding: '16px 20px', borderBottom: '1px solid #3a3a3a' }}>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#a1a1a1' }}>{row.factor}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{row.score}</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#a1a1a1' }}>{row.reasoning}</span>
              </div>
            ))}
            {/* Final Score Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr', padding: '16px 20px', borderBottom: '1px solid #3a3a3a' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Final Score</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>100</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>CRITICAL/BLOCKED</span>
            </div>
          </div>

          {/* Bottom Line */}
          <div style={{ borderLeft: '3px solid #ffffff', padding: '20px 24px', background: '#242424', borderRadius: '0 8px 8px 0' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: '10px' }}>Bottom Line</div>
            <p style={{ fontSize: '14px', fontWeight: 300, color: '#d4d4d4', lineHeight: 1.7, margin: 0 }}>
              This is a designated terrorist organization responsible for fentanyl trafficking into the United States. Any contact, transaction, or business relationship is prohibited by federal law and punishable by severe criminal penalties including up to 20 years imprisonment.
            </p>
          </div>

          {/* Investigation Notes Label */}
          <div style={{ marginTop: '32px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b6b6b' }}>Investigation Notes</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '80px auto' }} />

      {/* Workflow Section */}
      <section className="max-w-[880px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          The Workflow
        </p>
        <h2 className="text-4xl font-semibold text-center mb-2" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          From Name to Narrative in Minutes
        </h2>
        <p className="text-base font-light text-center max-w-[520px] mx-auto mb-12 leading-[1.65]" style={{ color: '#a1a1a1' }}>
          Every investigation follows the same pattern. Katharos automates each step.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { num: '01', icon: Search, title: 'Enter a Subject', desc: 'Type a name, company, or upload documents. Katharos accepts PDFs, emails, bank statements, corporate filings, and free text.' },
            { num: '02', icon: Globe, title: 'Automated Research', desc: 'Katharos searches 40+ sources simultaneously — sanctions lists, adverse media, court records, corporate registries, and public records — in under 60 seconds.' },
            { num: '03', icon: Network, title: 'AI Analysis & Synthesis', desc: 'Findings are cross-referenced, deduplicated, and risk-scored. Katharos maps entity networks, detects crime typologies, and builds an evidence-backed timeline.' },
            { num: '04', icon: Download, title: 'Review & Export', desc: 'Analysts review AI findings, add judgment, and export regulatory-ready SAR narratives, PDF reports, or structured data for your case management system.' }
          ].map((step, i) => (
            <div key={i} style={{ background: '#2d2d2d', display: 'grid', gridTemplateColumns: '72px 1fr', transition: 'background 0.2s' }}>
              <div className="flex items-center justify-center" style={{ borderRight: '1px solid #3a3a3a', fontSize: '13px', fontWeight: 600, color: '#6b6b6b', letterSpacing: '0.5px' }}>
                {step.num}
              </div>
              <div style={{ padding: '28px' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #4a4a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon style={{ width: '16px', height: '16px', color: '#a1a1a1' }} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.2px' }}>{step.title}</h3>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 300, color: '#858585', lineHeight: 1.6, paddingLeft: '44px' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Data Sources */}
      <section className="max-w-[880px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          Coverage
        </p>
        <h2 className="text-4xl font-semibold text-center mb-2" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          40+ Sources. One Search.
        </h2>
        <p className="text-base font-light text-center max-w-[520px] mx-auto mb-12 leading-[1.65]" style={{ color: '#a1a1a1' }}>
          Katharos aggregates data you'd normally check across a dozen tabs into a single, unified view.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { count: '12', label: 'Sanctions Lists', tags: ['OFAC', 'EU', 'UK', 'UN'] },
            { count: '8', label: 'Court & Legal', tags: ['PACER', 'DOJ', 'SEC'] },
            { count: '10', label: 'Corporate Records', tags: ['OpenCorp', 'EDGAR', 'CH'] },
            { count: '15+', label: 'Media & OSINT', tags: ['Reuters', 'OCCRP', 'ICIJ'] }
          ].map((source, i) => (
            <div key={i} className="text-center p-6 transition-colors" style={{ background: '#2d2d2d' }}>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#ffffff', letterSpacing: '-1px', marginBottom: '4px' }}>{source.count}</div>
              <div style={{ fontSize: '12px', color: '#858585', marginBottom: '12px' }}>{source.label}</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {source.tags.map((tag, j) => (
                  <span key={j} style={{ fontSize: '10px', fontWeight: 500, color: '#858585', background: 'rgba(255,255,255,0.04)', border: '1px solid #3a3a3a', padding: '3px 8px', borderRadius: '3px', letterSpacing: '0.3px' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* Output Section */}
      <section className="max-w-[880px] mx-auto px-10 pb-20">
        <p className="text-[11px] font-medium uppercase text-center mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          Output
        </p>
        <h2 className="text-4xl font-semibold text-center mb-2" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          What You Get Back
        </h2>
        <p className="text-base font-light text-center max-w-[520px] mx-auto mb-12 leading-[1.65]" style={{ color: '#a1a1a1' }}>
          Every search produces structured, audit-ready intelligence you can act on immediately.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#3a3a3a', border: '1px solid #3a3a3a', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { icon: FileText, title: 'SAR Narratives', desc: 'Auto-generated suspicious activity report narratives with citations and evidence references' },
            { icon: Network, title: 'Entity Networks', desc: 'Interactive ownership graphs mapping corporate structures, UBOs, and hidden relationships' },
            { icon: Activity, title: 'Risk Timelines', desc: 'Chronological view of sanctions events, legal actions, media coverage, and corporate changes' },
            { icon: AlertTriangle, title: 'Risk Scores', desc: 'Confidence-weighted risk assessment with supporting evidence for every finding' },
            { icon: Download, title: 'PDF Reports', desc: 'One-click export of comprehensive investigation reports formatted for regulators' },
            { icon: Monitor, title: 'API Access', desc: 'Integrate Katharos findings directly into your existing compliance and case management stack' }
          ].map((output, i) => (
            <div key={i} className="p-8 transition-colors" style={{ background: '#2d2d2d' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #4a4a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <output.icon style={{ width: '20px', height: '20px', color: '#a1a1a1' }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.2px' }}>{output.title}</h3>
              <p style={{ fontSize: '13px', fontWeight: 300, color: '#858585', lineHeight: 1.55 }}>{output.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: '#3a3a3a', maxWidth: '800px', margin: '0 auto 80px' }} />

      {/* CTA Section */}
      <section className="max-w-[800px] mx-auto px-10 pb-24 text-center">
        <p className="text-[11px] font-medium uppercase mb-4" style={{ color: '#6b6b6b', letterSpacing: '3px' }}>
          Get Started
        </p>
        <h2 className="text-4xl font-semibold mb-4" style={{ color: '#ffffff', letterSpacing: '-1px' }}>
          Ready to Investigate Faster?
        </h2>
        <p className="text-base font-light max-w-[520px] mx-auto mb-10 leading-[1.65]" style={{ color: '#a1a1a1' }}>
          See Katharos in action with your own data. Request a demo and run your first search today.
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
            Request a Demo
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
            Talk to Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10" style={{ borderTop: '1px solid #3a3a3a' }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: '24px', fontWeight: 500, color: '#6b6b6b', letterSpacing: '-0.5px' }}>
          Katharos
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;
