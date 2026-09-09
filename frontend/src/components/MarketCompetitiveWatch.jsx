import React, { useState, useEffect, useRef } from 'react';
import {
  fetchDemoScenarios,
  streamCompetitorAnalysis,
  searchCompetitors,
} from '../api';
import { ThreatMeterGauge, CapabilityRadarChart } from './InteractiveCharts';

export function MarketCompetitiveWatch() {
  const [competitorName, setCompetitorName] = useState('Slack');
  const [competitorUrl, setCompetitorUrl] = useState('https://slack.com');
  const [niche, setNiche] = useState('all');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEvents, setStreamEvents] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [demoScenarios, setDemoScenarios] = useState([]);
  const [activeReportTab, setActiveReportTab] = useState('overview');
  const [activeCiSubTab, setActiveCiSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const terminalRef = useRef(null);

  useEffect(() => {
    fetchDemoScenarios()
      .then((data) => {
        if (data && data.scenarios) {
          setDemoScenarios(data.scenarios);
        }
      })
      .catch((err) => console.warn('Could not load demo scenarios:', err));
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamEvents]);

  const handleSelectScenario = (scenario) => {
    setCompetitorName(scenario.competitor || scenario.name || '');
    setCompetitorUrl(scenario.website || scenario.url || '');
    setNiche(scenario.niche || 'all');
  };

  const handleStartAnalysis = (e) => {
    if (e) e.preventDefault();
    if (!competitorName.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamEvents([]);
    setCurrentStep('Initializing multi-agent workflow...');
    setProgressPercent(10);
    setAnalysisResult(null);
    setError(null);
    setActiveCiSubTab('trace');

    streamCompetitorAnalysis({
      competitorName: competitorName.trim(),
      competitorWebsite: competitorUrl.trim() || undefined,
      niche,
      onEvent: (event) => {
        setStreamEvents((prev) => [...prev, event]);
        if (event.type === 'status_update') {
          setCurrentStep(event.message || event.step || 'Processing...');
          if (event.step?.includes('research')) setProgressPercent(35);
          else if (event.step?.includes('analy')) setProgressPercent(70);
          else if (event.step?.includes('report')) setProgressPercent(90);
        } else if (event.type === 'tool_call') {
          setCurrentStep(`Agent executed tool: ${event.tool_name || 'search'}`);
        } else if (event.type === 'session_start') {
          setCurrentStep('Multi-agent team active: Researcher, Analyst, Writer');
          setProgressPercent(20);
        }
      },
      onComplete: (data) => {
        setIsStreaming(false);
        setProgressPercent(100);
        setCurrentStep('Analysis Complete');
        setAnalysisResult(data);
        setActiveCiSubTab('overview');
      },
      onError: (err) => {
        setIsStreaming(false);
        setError(err.message || 'Stream connection failed');
        setCurrentStep('Analysis halted');
      },
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await searchCompetitors(searchQuery.trim());
      setSearchResults(res);
    } catch (err) {
      setSearchResults({ error: err.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const metrics = analysisResult?.metrics?.competitive_metrics || {};
  const threatScore = metrics.threat_level != null ? Math.round(metrics.threat_level * 10) : 75;

  const handleCopyReport = () => {
    if (!analysisResult) return;
    const text = `Lunar Vision Competitive Intelligence Report: ${analysisResult.competitor}
Threat Score: ${threatScore}/100
Market Position: ${metrics.market_position || 8.2}/10 | Innovation: ${metrics.innovation || 7.8}/10 | Financial: ${metrics.financial_strength || 8.5}/10

EXECUTIVE SUMMARY:
${analysisResult.final_report || ''}`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const showAll = activeCiSubTab === 'all';

  return (
    <div className="competitive-intelligence-container">
      {/* Sub-Navigation Bar */}
      <div
        className="glass-panel sub-nav-bar"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          position: 'sticky',
          top: '74px',
          zIndex: 20,
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '🛡️ ThreatRadar & Overview' },
            { id: 'trace', label: '⚡ Live Agent Trace' },
            { id: 'swot', label: '⚔️ Battlefield SWOT' },
            { id: 'reports', label: '📑 Strategic Battle Cards' },
            { id: 'discovery', label: '🔍 Market Discovery' },
            { id: 'all', label: '📋 View All' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`action-chip ${activeCiSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveCiSubTab(tab.id)}
              style={{ fontSize: '12.5px', padding: '7px 14px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {analysisResult && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyReport}
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copiedToast ? '✅ Copied Brief!' : '📥 Copy Threat Report'}
          </button>
        )}
      </div>

      {/* Target Competitor Input Card */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="section-heading" style={{ marginBottom: '14px' }}>
          <span className="section-tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
            Multi-Agent Competitive Radar
          </span>
          <h2>Autonomous Market Sensing & Threat Intelligence</h2>
        </div>

        <form onSubmit={handleStartAnalysis} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
              Competitor Name
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="e.g. Slack, Notion, Figma"
              required
              disabled={isStreaming}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
              Website URL (Optional)
            </label>
            <input
              type="url"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://..."
              disabled={isStreaming}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
              Strategic Lens
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              disabled={isStreaming}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="all">Comprehensive (360° Radar)</option>
              <option value="product">Product & Features</option>
              <option value="sales">Sales & Pricing</option>
              <option value="marketing">Brand & Marketing</option>
              <option value="it">Technology Stack</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isStreaming || !competitorName.trim()}
              style={{
                width: '100%',
                padding: '11px 20px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '600',
              }}
            >
              {isStreaming ? (
                <>
                  <span className="spinner-indicator" />
                  Sensing {competitorName}...
                </>
              ) : (
                <>⚡ Run Deep Radar Analysis</>
              )}
            </button>
          </div>
        </form>

        {/* Demo Scenarios Quick Pick */}
        {demoScenarios.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '700' }}>
              Preset Competitors:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {demoScenarios.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectScenario(item)}
                  className="btn-secondary"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12.5px',
                    background: competitorName.toLowerCase() === (item.competitor || item.name || '').toLowerCase() ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: competitorName.toLowerCase() === (item.competitor || item.name || '').toLowerCase() ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  🏢 {item.competitor || item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION: Live Execution Trace Terminal */}
      {(showAll || activeCiSubTab === 'trace' || isStreaming) && (
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isStreaming ? '#22c55e' : '#64748b',
                  boxShadow: isStreaming ? '0 0 10px #22c55e' : 'none',
                }}
              />
              <strong style={{ fontSize: '15px', color: '#f8fafc' }}>
                Multi-Agent Execution Terminal (SSE Live Stream)
              </strong>
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              {currentStep || 'Ready'} ({progressPercent}%)
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #3b82f6, #06b6d4)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div
            ref={terminalRef}
            style={{
              background: '#0a0e1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '13px',
              color: '#38bdf8',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {streamEvents.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                No active execution stream. Click "Run Deep Radar Analysis" or select a preset competitor above.
              </div>
            ) : (
              streamEvents.map((evt, idx) => {
                const time = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '';
                if (evt.type === 'status_update') {
                  return (
                    <div key={idx} style={{ color: '#a5f3fc', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>[{time}]</span> 🔄 <strong>{evt.step}:</strong> {evt.message}
                    </div>
                  );
                }
                if (evt.type === 'tool_call') {
                  return (
                    <div key={idx} style={{ color: '#fed7aa', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>[{time}]</span> 🛠️ <em>Agent Tool:</em> {evt.tool_name}
                    </div>
                  );
                }
                if (evt.type === 'session_start') {
                  return (
                    <div key={idx} style={{ color: '#86efac', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>[{time}]</span> 🚀 <strong>Session Started:</strong> {evt.competitor} (ID: {evt.session_id})
                    </div>
                  );
                }
                if (evt.type === 'complete') {
                  return (
                    <div key={idx} style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>[{time}]</span> ✅ <strong>Workflow Execution Complete!</strong> Threat report synthesized.
                    </div>
                  );
                }
                return (
                  <div key={idx} style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>[{time}]</span> {evt.message || JSON.stringify(evt)}
                  </div>
                );
              })
            )}
            {isStreaming && (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>
                Agents active: sensing market vectors...
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#fca5a5', marginBottom: '24px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* SECTION: ThreatRadar Assessment & Visual Gauge */}
      {analysisResult && (showAll || activeCiSubTab === 'overview') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <span className="section-tag" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
              Threat Assessment
            </span>
            <h2>ThreatRadar Score & Capability Breakdown</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: '700', marginBottom: '10px' }}>
                Threat Index: {analysisResult.competitor}
              </span>
              <ThreatMeterGauge score={threatScore} competitor={analysisResult.competitor} />
            </div>

            <CapabilityRadarChart scores={metrics} />

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: '700' }}>
                Operational Vectors
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                {[
                  { label: 'Market Position', val: metrics.market_position || 8.2, max: 10, color: '#38bdf8' },
                  { label: 'Innovation Velocity', val: metrics.innovation || 7.8, max: 10, color: '#818cf8' },
                  { label: 'Financial Strength', val: metrics.financial_strength || 8.5, max: 10, color: '#34d399' },
                  { label: 'Brand Recognition', val: metrics.brand_health || metrics.brand_recognition || 8.0, max: 10, color: '#f472b6' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                      <strong style={{ color: item.color }}>{item.val} / {item.max}</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.val / item.max) * 100}%`, height: '100%', background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: SWOT Battlefield Matrix */}
      {analysisResult && (showAll || activeCiSubTab === 'swot') && (
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="section-heading" style={{ marginBottom: '16px' }}>
            <span className="section-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              Battlefield Matrix
            </span>
            <h3>SWOT Strategic Breakdown: {analysisResult.competitor}</h3>
          </div>

          <div className="swot-grid">
            <div className="swot-item swot-item--s glass-panel" style={{ borderTop: '3px solid #10b981' }}>
              <h4 style={{ color: '#34d399' }}>🛡️ Strengths</h4>
              <ul>
                <li>Dominant market penetration and established brand trust</li>
                <li>Extensive third-party integrations and developer ecosystem</li>
                <li>High switching costs across enterprise customer cohorts</li>
                <li>Mature documentation and onboarding self-service flows</li>
              </ul>
            </div>

            <div className="swot-item swot-item--w glass-panel" style={{ borderTop: '3px solid #f59e0b' }}>
              <h4 style={{ color: '#fbbf24' }}>⚠️ Weaknesses</h4>
              <ul>
                <li>Feature bloat causing cognitive friction for newer users</li>
                <li>Premium tier pricing creates budget resistance in SMB segment</li>
                <li>Mobile application performance lags desktop responsiveness</li>
                <li>Support response times slow during major incident windows</li>
              </ul>
            </div>

            <div className="swot-item swot-item--o glass-panel" style={{ borderTop: '3px solid #3b82f6' }}>
              <h4 style={{ color: '#60a5fa' }}>🚀 Opportunities to Exploit</h4>
              <ul>
                <li>Target cost-conscious SMBs with simplified, nimble workflows</li>
                <li>Highlight transparent, unbundled pricing without multi-year lock-ins</li>
                <li>Offer white-glove automated migration tools for 1-click onboarding</li>
                <li>Deliver native AI copilots directly into core day-to-day screens</li>
              </ul>
            </div>

            <div className="swot-item swot-item--t glass-panel" style={{ borderTop: '3px solid #ef4444' }}>
              <h4 style={{ color: '#f87171' }}>⚔️ Threats to Defend Against</h4>
              <ul>
                <li>Aggressive bundle discounting through suite enterprise contracts</li>
                <li>Rapid cloning of niche startup feature sets in quarterly releases</li>
                <li>High customer acquisition costs driven by competitor PPC bids</li>
                <li>Potential vendor lock-in via proprietary export formats</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: Strategic Reports & Battle Cards */}
      {analysisResult && (showAll || activeCiSubTab === 'reports') && (
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`action-chip ${activeReportTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveReportTab('overview')}
            >
              📄 Executive Synthesis
            </button>
            <button
              type="button"
              className={`action-chip ${activeReportTab === 'research' ? 'active' : ''}`}
              onClick={() => setActiveReportTab('research')}
            >
              🔬 Web Research Intelligence
            </button>
            <button
              type="button"
              className={`action-chip ${activeReportTab === 'strategy' ? 'active' : ''}`}
              onClick={() => setActiveReportTab('strategy')}
            >
              ⚔️ Counter-Strategy Battle Cards
            </button>
          </div>

          <div style={{ lineHeight: '1.7', color: '#e2e8f0', fontSize: '15px' }}>
            {activeReportTab === 'overview' && (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {analysisResult.final_report || 'Executive report synthesized.'}
              </div>
            )}
            {activeReportTab === 'research' && (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {analysisResult.research_findings || 'Research findings collected.'}
              </div>
            )}
            {activeReportTab === 'strategy' && (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {analysisResult.strategic_analysis || 'Strategic analysis ready.'}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION: Market Discovery Engine */}
      {(showAll || activeCiSubTab === 'discovery') && (
        <section className="glass-panel" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: '16px' }}>
            <span className="section-tag" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>
              Discovery Engine
            </span>
            <h3>Explore Market Competitors</h3>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '650px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords, industries, or companies (e.g. CRM, Slack, Notion)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <button type="submit" className="btn-secondary" disabled={searchLoading || !searchQuery.trim()}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults && (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Search Results:</span>
              <pre style={{ marginTop: '8px', fontSize: '13px', color: '#cbd5e1', overflowX: 'auto' }}>
                {JSON.stringify(searchResults, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
