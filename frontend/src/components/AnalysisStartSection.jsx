export function AnalysisStartSection({
  backendStatus,
  attachedFiles,
  onFileChange,
  onAnalyze,
  onLoadSample,
  loading,
  progressText,
}) {
  return (
    <section className="start-section glass-panel">
      <div className="section-heading">
        <span className="section-tag">Step 1</span>
        <h2>Upload CSV or DB to start full analysis</h2>
      </div>

      <p className="start-section__description">
        Start with your ecommerce dataset first. The app builds an interactive dashboard with automatic insights, real-time KPIs, and data-driven recommendations.
      </p>

      <div className="status-row">
        <span className={`status-pill ${backendStatus}`}>Backend: {backendStatus}</span>
        <span className="status-pill status-pill--dark">Supported: .csv .xlsx .db .sqlite</span>
      </div>

      {onLoadSample ? (
        <div className="sample-dataset-banner">
          <div>
            <strong>Quick Start Demo</strong>
            <p>
              No CSV file on hand? Click below to instantly load and analyze our pre-configured Olist e-commerce sample dataset (350 orders with revenue, delivery dates, categories & reviews).
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onLoadSample}
            disabled={loading}
          >
            ⚡ Load Sample Dataset (Olist)
          </button>
        </div>
      ) : null}

      <form className="composer composer--modern" onSubmit={onAnalyze}>
        <div className="file-row file-row--stacked">
          <input
            type="file"
            multiple
            accept=".csv,.db,.sqlite,.sqlite3,.xlsx"
            onChange={onFileChange}
          />
          {attachedFiles.length > 0 ? (
            <span className="attachment-summary">
              {attachedFiles.length} selected: {attachedFiles.map((file) => file.name).join(', ')}
            </span>
          ) : (
            <span className="attachment-summary">Please upload at least one file to run the analysis.</span>
          )}
        </div>

        <button type="submit" className="btn-primary btn-primary--full" disabled={loading || attachedFiles.length === 0}>
          {loading ? 'Analyzing dataset...' : 'Run Full Analysis'}
        </button>

        {progressText ? <p className="progress-text">{progressText}</p> : null}
      </form>
    </section>
  );
}
