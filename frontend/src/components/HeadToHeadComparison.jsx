import React, { useState } from 'react';
import { ThreatMeterGauge } from './InteractiveCharts';

const BATTLEGROUND_PRESETS = [
  {
    id: 'slack_teams',
    title: 'Slack vs Microsoft Teams',
    niche: 'Workplace Messaging & Ecosystems',
    c1: { name: 'Slack', url: 'https://slack.com' },
    c2: { name: 'Microsoft Teams', url: 'https://teams.microsoft.com' },
    data1: {
      threat: 65,
      market_position: 8.4,
      innovation: 8.9,
      financial: 8.2,
      brand: 9.1,
      strengths: ['Best-in-class UX and developer ecosystem', 'Over 2,600 deep integrations', 'High user love and channel workflow stickiness'],
      weaknesses: ['Premium per-seat pricing', 'Vulnerable to free 365 bundled enterprise deals'],
      battleground_win: 'Superior developer experience and nimble external guest workflows',
    },
    data2: {
      threat: 88,
      market_position: 9.6,
      innovation: 7.6,
      financial: 9.8,
      brand: 9.4,
      strengths: ['Zero incremental cost for Office 365 enterprise tenants', 'Unified IT compliance and admin management', 'Deep native Office doc co-authoring'],
      weaknesses: ['Heavier interface with higher cognitive overhead', 'Clunky third-party app ecosystem'],
      battleground_win: 'Unbeatable enterprise procurement distribution and license bundling',
    },
  },
  {
    id: 'notion_obsidian',
    title: 'Notion vs Obsidian',
    niche: 'Knowledge Management & Second Brain',
    c1: { name: 'Notion', url: 'https://notion.so' },
    c2: { name: 'Obsidian', url: 'https://obsidian.md' },
    data1: {
      threat: 78,
      market_position: 9.0,
      innovation: 9.2,
      financial: 8.5,
      brand: 9.3,
      strengths: ['All-in-one relational databases and team wikis', 'Strong template marketplace', 'Rapid native AI integration'],
      weaknesses: ['Online-only dependency', 'Slower loading on large workspaces'],
      battleground_win: 'Cross-functional team collaboration and visual project databases',
    },
    data2: {
      threat: 55,
      market_position: 7.2,
      innovation: 8.8,
      financial: 6.8,
      brand: 8.6,
      strengths: ['Local Markdown storage (total data privacy)', 'Graph visualization of linked notes', 'Extensive community plugin ecosystem'],
      weaknesses: ['Steep learning curve for non-technical users', 'Friction in multi-user real-time team collaboration'],
      battleground_win: 'Data sovereignty, longevity, and offline speed for individual power users',
    },
  },
  {
    id: 'shopify_bigcommerce',
    title: 'Shopify vs BigCommerce',
    niche: 'E-Commerce Infrastructure & Merchant Platforms',
    c1: { name: 'Shopify', url: 'https://shopify.com' },
    c2: { name: 'BigCommerce', url: 'https://bigcommerce.com' },
    data1: {
      threat: 92,
      market_position: 9.7,
      innovation: 9.1,
      financial: 9.5,
      brand: 9.8,
      strengths: ['Shop Pay conversion powerhouse', 'Massive developer ecosystem and app store', 'Global multi-currency checkout excellence'],
      weaknesses: ['Transaction fees unless using Shopify Payments', 'Strict API rate limits on complex catalogs'],
      battleground_win: 'Consumer conversion rates and self-reinforcing checkout network',
    },
    data2: {
      threat: 62,
      market_position: 7.8,
      innovation: 7.9,
      financial: 7.4,
      brand: 7.9,
      strengths: ['Zero additional transaction fees across any gateway', 'Native multi-storefront and complex B2B capabilities', 'Deep headless commerce API flexibility'],
      weaknesses: ['Smaller app ecosystem', 'Higher onboarding curve for non-technical merchants'],
      battleground_win: 'Complex multi-currency B2B catalogs and multi-storefront architecture',
    },
  },
];

export function HeadToHeadComparison() {
  const [selectedPreset, setSelectedPreset] = useState(BATTLEGROUND_PRESETS[0]);
  const [comp1Name, setComp1Name] = useState(BATTLEGROUND_PRESETS[0].c1.name);
  const [comp1Url, setComp1Url] = useState(BATTLEGROUND_PRESETS[0].c1.url);
  const [comp2Name, setComp2Name] = useState(BATTLEGROUND_PRESETS[0].c2.name);
  const [comp2Url, setComp2Url] = useState(BATTLEGROUND_PRESETS[0].c2.url);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonDone, setComparisonDone] = useState(true);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setComp1Name(preset.c1.name);
    setComp1Url(preset.c1.url);
    setComp2Name(preset.c2.name);
    setComp2Url(preset.c2.url);
    setComparisonDone(true);
  };

  const handleRunComparison = (e) => {
    e.preventDefault();
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setComparisonDone(true);
    }, 700);
  };

  const data1 = selectedPreset.data1;
  const data2 = selectedPreset.data2;

  const compareMetrics = [
    { label: 'Market Position', v1: data1.market_position, v2: data2.market_position, max: 10 },
    { label: 'Innovation Velocity', v1: data1.innovation, v2: data2.innovation, max: 10 },
    { label: 'Financial Strength', v1: data1.financial, v2: data2.financial, max: 10 },
    { label: 'Brand Recognition', v1: data1.brand, v2: data2.brand, max: 10 },
  ];

  return (
    <div className="head-to-head-container">
      {/* Intro & Preset Selector */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="section-heading">
          <span className="section-tag" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
            Dual-Competitor Battleground
          </span>
          <h2>Head-to-Head Comparative Intelligence</h2>
        </div>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '8px', maxWidth: '850px', fontSize: '15px' }}>
          Evaluate two competing market forces side-by-side. Compare ThreatRadar scores, strategic capability deltas, competitive strengths, vulnerabilities, and identify the whitespace your product can exploit.
        </p>

        {/* Presets */}
        <div style={{ marginTop: '18px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '700' }}>
            Featured Matchups:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {BATTLEGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="btn-secondary"
                onClick={() => handleSelectPreset(preset)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: selectedPreset.id === preset.id ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: selectedPreset.id === preset.id ? '#f43f5e' : 'rgba(255, 255, 255, 0.12)',
                  color: selectedPreset.id === preset.id ? '#fff' : '#cbd5e1',
                }}
              >
                ⚔️ {preset.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Input Matchup Bar */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleRunComparison} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '16px', alignItems: 'center' }}>
          {/* Competitor 1 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={comp1Name}
              onChange={(e) => setComp1Name(e.target.value)}
              placeholder="Competitor A"
              required
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <input
              type="url"
              value={comp1Url}
              onChange={(e) => setComp1Url(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ fontSize: '20px', fontWeight: '900', color: '#f43f5e' }}>VS</div>

          {/* Competitor 2 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={comp2Name}
              onChange={(e) => setComp2Name(e.target.value)}
              placeholder="Competitor B"
              required
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <input
              type="url"
              value={comp2Url}
              onChange={(e) => setComp2Url(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isComparing}
            style={{ padding: '10px 20px', height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isComparing ? 'Comparing...' : '⚔️ Run Matchup'}
          </button>
        </form>
      </section>

      {/* Comparison Results */}
      {comparisonDone && (
        <div>
          {/* Dual Threat Scorecards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Competitor 1 Card */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                borderTop: '4px solid #6366f1',
                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.8))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#818cf8', fontWeight: '700' }}>
                    Contender A
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '22px', color: '#fff' }}>{comp1Name}</h3>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{comp1Url}</span>
              </div>

              <div style={{ margin: '20px 0 10px' }}>
                <ThreatMeterGauge score={data1.threat} competitor={comp1Name} />
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: '700' }}>
                  Primary Moat
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#e2e8f0' }}>{data1.battleground_win}</p>
              </div>
            </div>

            {/* Competitor 2 Card */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                borderTop: '4px solid #10b981',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.8))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#34d399', fontWeight: '700' }}>
                    Contender B
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '22px', color: '#fff' }}>{comp2Name}</h3>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{comp2Url}</span>
              </div>

              <div style={{ margin: '20px 0 10px' }}>
                <ThreatMeterGauge score={data2.threat} competitor={comp2Name} />
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: '700' }}>
                  Primary Moat
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#e2e8f0' }}>{data2.battleground_win}</p>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Delta Matrix */}
          <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="section-heading" style={{ marginBottom: '18px' }}>
              <span className="section-tag" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                Metric Confrontation
              </span>
              <h3>Head-to-Head Capability Scores</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {compareMetrics.map((m, idx) => {
                const diff = (m.v1 - m.v2).toFixed(1);
                const isC1Winner = m.v1 > m.v2;
                const isTie = m.v1 === m.v2;

                return (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '14px' }}>{m.label}</span>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: '#818cf8', fontWeight: '700' }}>
                          {comp1Name}: {m.v1}/{m.max}
                        </span>
                        <span style={{ color: '#64748b' }}>vs</span>
                        <span style={{ color: '#34d399', fontWeight: '700' }}>
                          {comp2Name}: {m.v2}/{m.max}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: isTie ? 'rgba(255,255,255,0.1)' : isC1Winner ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.25)',
                            color: isTie ? '#94a3b8' : isC1Winner ? '#a5b4fc' : '#6ee7b7',
                          }}
                        >
                          {isTie ? 'TIE' : isC1Winner ? `${comp1Name} +${diff}` : `${comp2Name} +${Math.abs(diff)}`}
                        </span>
                      </div>
                    </div>

                    {/* Dual comparative progress bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ width: `${(m.v1 / m.max) * 100}%`, height: '100%', background: '#6366f1', borderRadius: '4px' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(m.v2 / m.max) * 100}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Side-by-Side SWOT Contrast */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Comp 1 SWOT */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#818cf8', marginBottom: '14px' }}>🛡️ {comp1Name} Strategic Profile</h4>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '13px', color: '#34d399', display: 'block', marginBottom: '6px' }}>Key Strengths:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {data1.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#fbbf24', display: 'block', marginBottom: '6px' }}>Critical Weaknesses:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {data1.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            {/* Comp 2 SWOT */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#34d399', marginBottom: '14px' }}>🛡️ {comp2Name} Strategic Profile</h4>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '13px', color: '#34d399', display: 'block', marginBottom: '6px' }}>Key Strengths:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {data2.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#fbbf24', display: 'block', marginBottom: '6px' }}>Critical Weaknesses:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {data2.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Strategic Whitespace Recommendation */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <div className="section-heading" style={{ marginBottom: '12px' }}>
              <span className="section-tag" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>
                Strategic Exploitation Playbook
              </span>
              <h3>Where Can You Win Between {comp1Name} & {comp2Name}?</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h5 style={{ color: '#38bdf8', margin: '0 0 8px', fontSize: '14px' }}>1. The Unbundling Play</h5>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  Neither competitor caters cleanly to lean mid-market teams that need speed without enterprise bloat. Offer a specialized, focused solution with 10x faster setup.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h5 style={{ color: '#a78bfa', margin: '0 0 8px', fontSize: '14px' }}>2. Transparent Pricing Advantage</h5>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  Both players impose restrictive tier upgrades or bundled licensing friction. Provide transparent usage-based or flat team pricing to capture budget-sensitive switchers.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h5 style={{ color: '#34d399', margin: '0 0 8px', fontSize: '14px' }}>3. Native Autonomous AI</h5>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  While both embed basic chatbots, deep multi-agent workflow automation remains unfulfilled. Position your solution as an autonomous AI-native operational copilot.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
