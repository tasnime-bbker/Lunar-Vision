export function ResultsSection({ dashboard }) {
  if (!dashboard) {
    return (
      <section className="results-panel glass-panel">
        <div className="section-heading">
          <span className="section-tag">Results</span>
          <h2>Dashboard output</h2>
        </div>
        <p className="results-empty">Upload a file to generate schema, KPI, insight, strategy, and content results.</p>
      </section>
    );
  }

  const schemaRoles = dashboard.schema?.roles || dashboard.schema || {};
  const kpis = dashboard.kpis?.kpis || dashboard.kpis || {};

  return (
    <section className="results-panel">
      <div className="section-heading">
        <span className="section-tag">Results</span>
        <h2>Structured dashboard</h2>
      </div>
      <div className="dashboard-grid dashboard-grid--expanded">
        <DashboardCard title="Schema" data={schemaRoles} />
        <DashboardCard title="KPIs" data={kpis} />
        <DashboardCard title="Insights" data={dashboard.insights} />
        <DashboardCard title="Strategies" data={dashboard.strategies} />
        <DashboardCard title="Content" data={dashboard.content} />
        <DashboardCard title="Explainability" data={dashboard.explainability} />
      </div>
    </section>
  );
}

function DashboardCard({ title, data }) {
  return (
    <article className="dashboard-card dashboard-card--wide">
      <h3>{title}</h3>
      <pre>{formatDashboardData(data)}</pre>
    </article>
  );
}

function formatDashboardData(data) {
  if (data == null) {
    return 'No data available.';
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
}
