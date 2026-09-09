const STEPS = [
  {
    number: '01',
    title: 'Schema Detective',
    description: 'Detects dates, numeric columns, IDs, customer fields, product fields, and order fields.',
  },
  {
    number: '02',
    title: 'KPI Engine',
    description: 'Computes only the KPIs that are valid for the detected schema, using pandas and numpy.',
  },
  {
    number: '03',
    title: 'Insight Analyst',
    description: 'Converts KPI JSON into grounded ecommerce insights, problems, and opportunities.',
  },
  {
    number: '04',
    title: 'Marketing Strategist',
    description: 'Turns insights into actionable growth strategies for revenue, retention, and operations.',
  },
  {
    number: '05',
    title: 'Content Generator',
    description: 'Creates Instagram posts, email campaigns, and ad copy based on the selected strategy.',
  },
];

export function PipelineSection() {
  return (
    <section className="glass-panel pipeline-panel">
      <div className="section-heading">
        <span className="section-tag">Pipeline</span>
        <h2>Five-stage ecommerce workflow</h2>
      </div>
      <div className="pipeline-list">
        {STEPS.map((step) => (
          <article key={step.number} className="pipeline-step">
            <div className="pipeline-step__number">{step.number}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
