import React, { useState } from 'react';

/**
 * Visualizes Monthly Revenue trajectory as a smooth SVG Area & Line Chart.
 */
export function RevenueTrendChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Fallback data if dataset doesn't have multiple months
  const chartData = data && data.length > 0 ? data : [
    { month: '2023-01', revenue: 42000 },
    { month: '2023-02', revenue: 49000 },
    { month: '2023-03', revenue: 58000 },
    { month: '2023-04', revenue: 54000 },
    { month: '2023-05', revenue: 67000 },
    { month: '2023-06', revenue: 78000 },
    { month: '2023-07', revenue: 86000 },
  ];

  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 60 };

  const values = chartData.map((d) => Number(d.revenue || d.value || 0));
  const maxVal = Math.max(...values, 1000) * 1.15;
  const minVal = 0;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;

  // Generate smooth SVG path
  const points = chartData.map((d, i) => ({
    x: getX(i),
    y: getY(Number(d.revenue || d.value || 0)),
    label: d.month || `M${i + 1}`,
    val: Number(d.revenue || d.value || 0),
  }));

  const linePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1]?.x},${padding.top + innerHeight} L ${points[0]?.x},${padding.top + innerHeight} Z`;

  return (
    <div className="chart-card glass-panel" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', fontWeight: '700' }}>
            Historical Momentum
          </span>
          <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: '#f8fafc' }}>Monthly Revenue Trajectory</h4>
        </div>
        {hoveredIdx !== null && (
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#e0e7ff' }}>
            <strong>{points[hoveredIdx].label}:</strong> ${points[hoveredIdx].val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '420px' }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = minVal + (maxVal - minVal) * pct;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#revenueGrad)" />

          {/* Main Stroke Line */}
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 7 : 4.5}
                fill={hoveredIdx === idx ? '#38bdf8' : '#6366f1'}
                stroke="#0f172a"
                strokeWidth="2"
                style={{ transition: 'all 0.15s ease' }}
              />
              <text x={pt.x} y={padding.top + innerHeight + 18} textAnchor="middle" fontSize="10.5" fill="#94a3b8">
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * Visualizes Product Category Share as proportional progress bars with rankings.
 */
export function CategoryShareChart({ data = [] }) {
  const chartData = data && data.length > 0 ? data.slice(0, 5) : [
    { category: 'Health & Beauty', revenue: 98000 },
    { category: 'Watches & Gifts', revenue: 74000 },
    { category: 'Bed, Bath & Table', revenue: 62000 },
    { category: 'Sports & Leisure', revenue: 51000 },
    { category: 'Computers & Accessories', revenue: 43000 },
  ];

  const totalRev = chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0) || 1;
  const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="chart-card glass-panel" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', fontWeight: '700' }}>
          Portfolio Distribution
        </span>
        <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: '#f8fafc' }}>Top Revenue Categories</h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chartData.map((cat, idx) => {
          const rev = Number(cat.revenue || 0);
          const pct = Math.round((rev / totalRev) * 100);
          const color = colors[idx % colors.length];
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>
                  <span style={{ color, marginRight: '6px' }}>●</span>
                  {cat.category}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  <strong style={{ color: '#f8fafc' }}>${rev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> ({pct}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Visualizes New vs Returning Customer Ratio & CLV proxy.
 */
export function CustomerRetentionChart({ newVsReturning = null, repeatRate = 0.24 }) {
  const returningCount = newVsReturning?.returning_customers ?? 78;
  const newCount = newVsReturning?.new_customers ?? 272;
  const total = returningCount + newCount || 1;
  const returningPct = Math.round((returningCount / total) * 100);
  const newPct = 100 - returningPct;

  return (
    <div className="chart-card glass-panel" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399', fontWeight: '700' }}>
          Cohort Quality
        </span>
        <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: '#f8fafc' }}>Customer Retention Breakdown</h4>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
            <div style={{ width: `${newPct}%`, background: '#3b82f6', transition: 'width 0.4s' }} title={`New: ${newPct}%`} />
            <div style={{ width: `${returningPct}%`, background: '#10b981', transition: 'width 0.4s' }} title={`Returning: ${returningPct}%`} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '10px' }}>
          <span style={{ fontSize: '11px', color: '#93c5fd' }}>First-Time Buyers</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#bfdbfe', marginTop: '2px' }}>
            {newCount} <span style={{ fontSize: '12px', fontWeight: '500' }}>({newPct}%)</span>
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '10px' }}>
          <span style={{ fontSize: '11px', color: '#6ee7b7' }}>Repeat Buyers</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#a7f3d0', marginTop: '2px' }}>
            {returningCount} <span style={{ fontSize: '12px', fontWeight: '500' }}>({returningPct}%)</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0', lineHeight: '1.4' }}>
        Current repeat purchase rate is <strong>{(Number(repeatRate) * 100).toFixed(1)}%</strong>. Increasing repeat rate by 5% typically lifts lifetime customer gross margin by 25–40%.
      </p>
    </div>
  );
}

/**
 * Visualizes 4-Axis Strategic Capabilities (Market, Innovation, Financial, Brand) as an SVG Radar / Spider chart.
 */
export function CapabilityRadarChart({ scores = {} }) {
  const market = Number(scores.market_position || 7.5);
  const innovation = Number(scores.innovation || 8.0);
  const financial = Number(scores.financial_strength || 8.2);
  const brand = Number(scores.brand_health || scores.brand_recognition || 7.8);

  const size = 260;
  const center = size / 2;
  const radius = 80;

  // 4 axes: Top, Right, Bottom, Left
  const axes = [
    { label: 'Market Position', val: market, x: center, y: center - (market / 10) * radius, tx: center, ty: center - radius - 12 },
    { label: 'Innovation', val: innovation, x: center + (innovation / 10) * radius, y: center, tx: center + radius + 14, ty: center + 4 },
    { label: 'Financial Strength', val: financial, x: center, y: center + (financial / 10) * radius, tx: center, ty: center + radius + 18 },
    { label: 'Brand Health', val: brand, x: center - (brand / 10) * radius, y: center, tx: center - radius - 14, ty: center + 4 },
  ];

  const polygonPath = axes.map((a, i) => `${i === 0 ? 'M' : 'L'} ${a.x},${a.y}`).join(' ') + ' Z';

  return (
    <div className="chart-card glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ textAlign: 'left', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f472b6', fontWeight: '700' }}>
          Strategic Posture
        </span>
        <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: '#f8fafc' }}>Capability Radar Matrix</h4>
      </div>

      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: '240px', height: 'auto', margin: '0 auto' }}>
        {/* Concentric Grid Rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            points={`
              ${center},${center - radius * scale}
              ${center + radius * scale},${center}
              ${center},${center + radius * scale}
              ${center - radius * scale},${center}
            `}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Crosshair Axes */}
        <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="rgba(255, 255, 255, 0.12)" />
        <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="rgba(255, 255, 255, 0.12)" />

        {/* Data Shape */}
        <path d={polygonPath} fill="rgba(99, 102, 241, 0.35)" stroke="#6366f1" strokeWidth="2.5" />

        {/* Axis Points and Labels */}
        {axes.map((a, idx) => (
          <g key={idx}>
            <circle cx={a.x} cy={a.y} r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
            <text x={a.tx} y={a.ty} textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="600">
              {a.label} ({a.val}/10)
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Semi-Circular Threat Meter Gauge (0 - 100) with dynamic needle & status pill.
 */
export function ThreatMeterGauge({ score = 75, competitor = 'Competitor' }) {
  const normalized = Math.min(Math.max(score, 0), 100);
  const size = 220;
  const center = size / 2;
  const radius = 75;

  // Semi-circle angle (-180 to 0)
  const angle = -180 + (normalized / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const needleX = center + (radius - 12) * Math.cos(radians);
  const needleY = center + (radius - 12) * Math.sin(radians);

  const getThreatMeta = (s) => {
    if (s >= 80) return { label: 'CRITICAL THREAT', color: '#ef4444', desc: 'Active aggressive expansion across core segments' };
    if (s >= 60) return { label: 'HIGH THREAT', color: '#f59e0b', desc: 'Direct competitive feature overlap & pricing pressure' };
    if (s >= 40) return { label: 'MODERATE THREAT', color: '#3b82f6', desc: 'Adjacent competitor with selective friction' };
    return { label: 'LOW THREAT', color: '#10b981', desc: 'Distant competitor with limited churn exposure' };
  };

  const meta = getThreatMeta(normalized);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size * 0.65}`} style={{ width: '100%', maxWidth: '200px', height: 'auto' }}>
        {/* Background Arc */}
        <path
          d={`M ${center - radius},${center} A ${radius} ${radius} 0 0 1 ${center + radius},${center}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.09)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Value Arc */}
        <path
          d={`M ${center - radius},${center} A ${radius} ${radius} 0 0 1 ${center + radius},${center}`}
          fill="none"
          stroke={meta.color}
          strokeWidth="16"
          strokeDasharray={`${(normalized / 100) * 235} 250`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />

        {/* Center Pivot */}
        <circle cx={center} cy={center} r="6" fill="#f8fafc" />

        {/* Needle */}
        <line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke="#f8fafc"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Text in gauge */}
        <text x={center} y={center - 24} textAnchor="middle" fontSize="24" fontWeight="800" fill="#ffffff">
          {normalized}
        </text>
        <text x={center} y={center - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
          OUT OF 100
        </text>
      </svg>

      <div style={{ marginTop: '2px' }}>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            background: `${meta.color}25`,
            color: meta.color,
            border: `1px solid ${meta.color}60`,
          }}
        >
          {meta.label}
        </span>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>{meta.desc}</p>
      </div>
    </div>
  );
}
