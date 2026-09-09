export function HeroSection({ onScrollToComposer }) {
  return (
    <section className="hero-section glass-panel">
      <div className="hero-section__content">
        <span className="section-tag">E-commerce AI Analytics</span>
        <h2>Turn CSVs and databases into growth actions.</h2>
        <p>
          Upload unknown ecommerce schemas, detect business columns automatically,
          compute the right KPIs, and turn them into insights, strategies, and content.
        </p>
        <div className="hero-section__actions">
          <button type="button" className="btn-primary" onClick={onScrollToComposer}>
            Start analysis
          </button>
          <span className="hero-section__note">No hardcoded columns. No KPI guessing.</span>
        </div>
      </div>
      <div className="hero-section__cards">
        <article className="mini-card mini-card--blue">
          <strong>Schema Agent</strong>
          <span>Infers dates, IDs, revenue, customer, product, and delivery fields.</span>
        </article>
        <article className="mini-card mini-card--violet">
          <strong>KPI Agent</strong>
          <span>Calculates revenue, orders, AOV, retention, delivery delay, and satisfaction.</span>
        </article>
        <article className="mini-card mini-card--cyan">
          <strong>Content Agent</strong>
          <span>Generates marketing content aligned to actual strategy output.</span>
        </article>
      </div>
    </section>
  );
}
