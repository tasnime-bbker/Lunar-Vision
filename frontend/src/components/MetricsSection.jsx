const DEFAULT_METRICS = [
  { label: 'Revenue', value: 'total_revenue' },
  { label: 'Orders', value: 'orders' },
  { label: 'AOV', value: 'aov' },
  { label: 'Customer count', value: 'customer_count' },
  { label: 'Repeat purchase rate', value: 'repeat_purchase_rate' },
  { label: 'Late delivery rate', value: 'late_delivery_rate' },
  { label: 'Review score average', value: 'review_score_average' },
  { label: 'Delay vs rating correlation', value: 'delay_vs_rating_correlation' },
];

export function MetricsSection({ kpiHints, dashboard }) {
  const kpis = dashboard?.kpis?.kpis || {};

  return (
    <section className="metrics-panel">
      <div className="section-heading">
        <span className="section-tag">KPI focus</span>
        <h2>Core business signals</h2>
      </div>
      <div className="kpi-grid">
        {kpiHints.map((hint) => (
          <article key={hint.value} className={`kpi-card kpi-card--${hint.color}`}>
            <span>{hint.label}</span>
            <strong>{formatMetric(kpis[hint.value])}</strong>
          </article>
        ))}
      </div>
      <div className="metrics-note">
        <p>
          The pipeline also supports product, customer, operational, and satisfaction KPIs derived from the detected schema.
        </p>
        <ul>
          {DEFAULT_METRICS.map((metric) => (
            <li key={metric.value}>{metric.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function formatMetric(value) {
  if (value == null) {
    return 'Waiting for upload';
  }
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'object') {
    return 'Available';
  }
  return String(value);
}
