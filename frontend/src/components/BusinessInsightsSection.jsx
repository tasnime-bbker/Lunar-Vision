import React, { useState } from 'react';
import {
  RevenueTrendChart,
  CategoryShareChart,
  CustomerRetentionChart,
  CapabilityRadarChart,
} from './InteractiveCharts';

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return Object.values(value);
}

function formatValue(value) {
  if (value == null) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatInsightItem(item) {
  if (typeof item === 'string') {
    return item;
  }
  if (!item || typeof item !== 'object') {
    return String(item ?? '');
  }

  const baseText = item.description || item.insight || item.problem || item.opportunity || '';
  const numericValue = item.value;

  if (baseText && numericValue != null) {
    const valueText = typeof numericValue === 'number'
      ? numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(numericValue);
    return `${baseText} (Value: ${valueText})`;
  }

  if (baseText) {
    return baseText;
  }

  return Object.entries(item)
    .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)}`)
    .join(' | ');
}

export function BusinessInsightsSection({
  dashboard,
  detailQuestion,
  onDetailQuestionChange,
  onAskDetails,
  detailAnswer,
  detailLoading,
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [copiedToast, setCopiedToast] = useState(false);

  const kpis = dashboard?.kpis?.kpis || {};
  const insights = toArray(dashboard?.insights?.insights);
  const problems = toArray(dashboard?.insights?.problems);
  const opportunities = toArray(dashboard?.insights?.opportunities);
  const strategies = toArray(dashboard?.strategies?.strategies);
  const strategicReport = dashboard?.strategic_report || {};
  const swot = strategicReport.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const scores = strategicReport.scores || {};

  const heroKpis = [
    { label: 'Total Revenue', value: kpis.total_revenue ? `$${formatValue(kpis.total_revenue)}` : 'N/A', hint: 'Gross sales volume across dataset' },
    { label: 'Total Orders', value: formatValue(kpis.orders), hint: 'Unique order transactions processed' },
    { label: 'AOV', value: kpis.aov ? `$${formatValue(kpis.aov)}` : 'N/A', hint: 'Average order checkout value' },
    { label: 'Customer Count', value: formatValue(kpis.customer_count), hint: 'Distinct active buyers identified' },
    { label: 'Repeat Rate', value: kpis.repeat_purchase_rate != null ? `${(Number(kpis.repeat_purchase_rate) * 100).toFixed(1)}%` : 'N/A', hint: 'Buyers with >1 recorded transaction' },
    { label: 'Late Delivery Rate', value: kpis.late_delivery_rate != null ? `${(Number(kpis.late_delivery_rate) * 100).toFixed(1)}%` : 'N/A', hint: 'Orders delivered past estimated date' },
  ];

  const handleCopySummary = () => {
    const summary = `Lunar Vision E-Commerce Intelligence Summary:
Total Revenue: $${formatValue(kpis.total_revenue)} | Orders: ${formatValue(kpis.orders)} | AOV: $${formatValue(kpis.aov)}
Repeat Purchase Rate: ${(Number(kpis.repeat_purchase_rate || 0) * 100).toFixed(1)}% | Late Delivery Rate: ${(Number(kpis.late_delivery_rate || 0) * 100).toFixed(1)}%
Top Opportunities: ${opportunities.map(formatInsightItem).slice(0, 3).join('; ')}
Recommended Strategies: ${strategies.map((s) => (typeof s === 'string' ? s : s.strategy)).slice(0, 3).join('; ')}`;

    navigator.clipboard?.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const showAll = activeSubTab === 'all';

  return (
    <section className="insights-section">
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
            { id: 'overview', label: '📈 KPIs & Visual Trends' },
            { id: 'breakdown', label: '📊 Categories & Cohorts' },
            { id: 'insights', label: '🔍 Diagnostics & Insights' },
            { id: 'swot', label: '🎯 SWOT & Capability Radar' },
            { id: 'followup', label: '💬 Analyst Q&A' },
            { id: 'all', label: '📋 View All' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`action-chip ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
              style={{ fontSize: '12.5px', padding: '7px 14px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopySummary}
          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {copiedToast ? '✅ Copied to Clipboard!' : '📥 Copy Executive Brief'}
        </button>
      </div>

      {/* SECTION 1: Overview & Visual Trends */}
      {(showAll || activeSubTab === 'overview') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <span className="section-tag">Executive Summary</span>
            <h2>Core Business Metrics & Growth Velocity</h2>
          </div>

          <div className="kpi-grid" style={{ marginBottom: '20px' }}>
            {heroKpis.map((kpi) => (
              <article className="kpi-card" key={kpi.label} title={kpi.hint}>
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>{kpi.hint}</small>
              </article>
            ))}
          </div>

          <RevenueTrendChart data={kpis.revenue_per_month} />
        </div>
      )}

      {/* SECTION 2: Category & Cohort Breakdown */}
      {(showAll || activeSubTab === 'breakdown') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <span className="section-tag" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
              Portfolio Analytics
            </span>
            <h2>Category Distribution & Cohort Retention</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <CategoryShareChart data={kpis.revenue_per_product_category} />
            <CustomerRetentionChart
              newVsReturning={kpis.new_vs_returning_customers}
              repeatRate={kpis.repeat_purchase_rate}
            />
          </div>
        </div>
      )}

      {/* SECTION 3: Diagnostic Insights & Problems */}
      {(showAll || activeSubTab === 'insights') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <span className="section-tag" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>
              Root-Cause Analysis
            </span>
            <h2>Automated Diagnostic Insights & Action Playbooks</h2>
          </div>

          <div className="insight-columns" style={{ marginBottom: '20px' }}>
            <InsightList title="Key Diagnostic Insights" items={insights} tone="insight" />
            <InsightList title="Detected Business Friction" items={problems} tone="problem" />
            <InsightList title="High-Impact Opportunities" items={opportunities} tone="opportunity" />
          </div>

          <div className="strategy-panel glass-panel">
            <h3>Recommended Tactical Growth Strategies</h3>
            {strategies.length === 0 ? (
              <p className="results-empty">No strategies generated yet.</p>
            ) : (
              <ul>
                {strategies.map((strategy, index) => {
                  if (typeof strategy === 'string') {
                    return <li key={`strategy-${index}`}>{strategy}</li>;
                  }
                  return (
                    <li key={`strategy-${index}`}>
                      <strong>{strategy.strategy || 'Actionable Recommendation'}</strong>
                      {strategy.references_insight ? <p>{strategy.references_insight}</p> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: SWOT Matrix & Capability Radar */}
      {(showAll || activeSubTab === 'swot') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <span className="section-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              Strategic Positioning
            </span>
            <h2>Capability Radar & 4-Quadrant SWOT Matrix</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <CapabilityRadarChart scores={scores} />

            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: '700' }}>
                Operational Scorecards
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                <div className="score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>Market Position</span>
                    <strong>{scores.market_position || 7.5}/10</strong>
                  </div>
                  <div className="score-bar"><div className="score-fill" style={{ width: `${(scores.market_position || 7.5) * 10}%` }}></div></div>
                </div>

                <div className="score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>Innovation Velocity</span>
                    <strong>{scores.innovation || 8.0}/10</strong>
                  </div>
                  <div className="score-bar"><div className="score-fill" style={{ width: `${(scores.innovation || 8.0) * 10}%` }}></div></div>
                </div>

                <div className="score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>Financial Resilience</span>
                    <strong>{scores.financial_strength || 8.2}/10</strong>
                  </div>
                  <div className="score-bar"><div className="score-fill" style={{ width: `${(scores.financial_strength || 8.2) * 10}%` }}></div></div>
                </div>

                <div className="score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>Brand Health</span>
                    <strong>{scores.brand_health || 7.8}/10</strong>
                  </div>
                  <div className="score-bar"><div className="score-fill" style={{ width: `${(scores.brand_health || 7.8) * 10}%` }}></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="swot-grid">
            <div className="swot-item swot-item--s glass-panel">
              <h4>🛡️ Internal Strengths</h4>
              <ul>{swot.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-item swot-item--w glass-panel">
              <h4>⚠️ Internal Weaknesses</h4>
              <ul>{swot.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-item swot-item--o glass-panel">
              <h4>🚀 External Opportunities</h4>
              <ul>{swot.opportunities?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-item swot-item--t glass-panel">
              <h4>⚔️ External Threats</h4>
              <ul>{swot.threats?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Business Analyst Follow-Up */}
      {(showAll || activeSubTab === 'followup') && (
        <div className="insight-followup glass-panel" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: '12px' }}>
            <span className="section-tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              Data Analyst Copilot
            </span>
            <h3>Ask Specific Follow-up Questions</h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px' }}>
            Ask anything about the numbers above. The analyst agent will generate grounded 30-day action steps based directly on your dataset's KPIs.
          </p>

          <form className="composer composer--modern" onSubmit={onAskDetails}>
            <textarea
              value={detailQuestion}
              onChange={(event) => onDetailQuestionChange(event.target.value)}
              rows={4}
              placeholder="e.g. Why is retention low and what are 3 concrete actions we should take this month to increase LTV?"
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <button type="submit" className="btn-primary" disabled={detailLoading || !detailQuestion.trim()}>
                {detailLoading ? 'Generating Analysis...' : 'Ask Analyst Agent'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onDetailQuestionChange('What are the top 3 actionable steps to increase our repeat purchase rate from current baseline?')}
              >
                💡 Insert Suggested Prompt
              </button>
            </div>
          </form>

          {detailAnswer && (
            <div className="insight-followup__answer" style={{ marginTop: '16px' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '6px' }}>Analyst Diagnosis & Recommendations:</strong>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{detailAnswer}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function InsightList({ title, items, tone }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <article className={`insight-card insight-card--${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => {
          const content = formatInsightItem(item);
          return <li key={`${title}-${index}`}>{content}</li>;
        })}
      </ul>
    </article>
  );
}
