import React, { useState, useEffect } from 'react';
import { BarChart3, Target, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AccuracyDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }

    const load = async () => {
      try {
        // Fetch sanctions metrics with feedback
        const { data: sanctions } = await supabase
          .from('metrics_sanctions')
          .select('*')
          .not('feedback_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        // Fetch total screenings count
        const { count: totalScreenings } = await supabase
          .from('screenings')
          .select('*', { count: 'exact', head: true });

        if (!sanctions || sanctions.length === 0) {
          setMetrics({ totalScreenings: totalScreenings || 0, totalFeedback: 0, precision: null, fpRate: null, sources: [] });
          setLoading(false);
          return;
        }

        // Calculate overall precision
        let totalTP = 0, totalFP = 0;
        const sourceMap = {};

        sanctions.forEach(s => {
          totalTP += s.true_positives || 0;
          totalFP += s.false_positives || 0;

          // Per-source breakdown
          if (s.source_breakdown && typeof s.source_breakdown === 'object') {
            Object.entries(s.source_breakdown).forEach(([src, counts]) => {
              if (!sourceMap[src]) sourceMap[src] = { tp: 0, fp: 0 };
              sourceMap[src].tp += counts.tp || 0;
              sourceMap[src].fp += counts.fp || 0;
            });
          }
        });

        const totalMatches = totalTP + totalFP;
        const precision = totalMatches > 0 ? (totalTP / totalMatches * 100) : null;
        const fpRate = totalMatches > 0 ? (totalFP / totalMatches * 100) : null;

        // Per-source accuracy
        const sources = Object.entries(sourceMap).map(([name, counts]) => {
          const total = counts.tp + counts.fp;
          return {
            name,
            truePositives: counts.tp,
            falsePositives: counts.fp,
            precision: total > 0 ? (counts.tp / total * 100).toFixed(1) : null,
          };
        }).sort((a, b) => (b.truePositives + b.falsePositives) - (a.truePositives + a.falsePositives));

        setMetrics({
          totalScreenings: totalScreenings || 0,
          totalFeedback: sanctions.length,
          precision: precision?.toFixed(1),
          fpRate: fpRate?.toFixed(1),
          totalTP,
          totalFP,
          matchRate: totalScreenings > 0 ? ((sanctions.filter(s => s.match_count > 0).length / totalScreenings) * 100).toFixed(1) : null,
          sources,
        });
      } catch (err) {
        console.error('[Accuracy] Load error:', err);
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading accuracy data...</div>;

  if (!metrics) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Accuracy tracking not available</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Target style={{ width: '20px', height: '20px', color: '#4caf50' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>Accuracy Validation</h2>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <KpiCard icon={<Target style={{ width: '18px', height: '18px' }} />} label="Precision Rate" value={metrics.precision ? `${metrics.precision}%` : 'N/A'} color="#4caf50" />
        <KpiCard icon={<AlertTriangle style={{ width: '18px', height: '18px' }} />} label="False Positive Rate" value={metrics.fpRate ? `${metrics.fpRate}%` : 'N/A'} color="#f44336" />
        <KpiCard icon={<BarChart3 style={{ width: '18px', height: '18px' }} />} label="Total Screenings" value={metrics.totalScreenings.toLocaleString()} color="#2196f3" />
        <KpiCard icon={<Activity style={{ width: '18px', height: '18px' }} />} label="With Feedback" value={metrics.totalFeedback.toLocaleString()} color="#ff9800" />
      </div>

      {/* Precision bar */}
      {metrics.precision != null && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Overall Match Accuracy</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4caf50' }}>{metrics.precision}%</span>
          </div>
          <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${metrics.precision}%`, background: parseFloat(metrics.precision) >= 80 ? '#4caf50' : parseFloat(metrics.precision) >= 60 ? '#ff9800' : '#f44336', borderRadius: '4px', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#999' }}>
            <span><CheckCircle2 style={{ width: '10px', height: '10px', display: 'inline', verticalAlign: 'middle' }} /> {metrics.totalTP} true positives</span>
            <span><AlertTriangle style={{ width: '10px', height: '10px', display: 'inline', verticalAlign: 'middle' }} /> {metrics.totalFP} false positives</span>
          </div>
        </div>
      )}

      {/* Per-source accuracy table */}
      {metrics.sources.length > 0 && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Per-Source Accuracy</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px' }}>Source</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#555', fontSize: '11px' }}>True Pos</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#555', fontSize: '11px' }}>False Pos</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#555', fontSize: '11px' }}>Precision</th>
              </tr>
            </thead>
            <tbody>
              {metrics.sources.map((src, i) => (
                <tr key={src.name} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{src.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4caf50' }}>{src.truePositives}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f44336' }}>{src.falsePositives}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: src.precision && parseFloat(src.precision) >= 80 ? '#4caf50' : src.precision && parseFloat(src.precision) >= 60 ? '#ff9800' : '#f44336' }}>
                    {src.precision ? `${src.precision}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metrics.totalFeedback === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: '#f8f9fa', borderRadius: '8px', marginTop: '16px' }}>
          <Target style={{ width: '36px', height: '36px', color: '#ddd', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', marginBottom: '4px' }}>No accuracy feedback yet</p>
          <p style={{ fontSize: '12px', color: '#bbb' }}>Mark sanctions matches as true/false positives in screening results to start tracking accuracy</p>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ icon, label, value, color }) => (
  <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '8px' }}>{icon}<span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>{label}</span></div>
    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
  </div>
);

export default AccuracyDashboard;
