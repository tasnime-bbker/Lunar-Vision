import { useEffect, useState } from 'react';

const SOCIAL_OPTIONS = [
  {
    id: 'instagram',
    label: 'Instagram Post',
    icon: '📸',
    hint: 'Create a punchy visual-first post with CTA and hashtags.',
  },
  {
    id: 'email',
    label: 'Email Campaign',
    icon: '✉️',
    hint: 'Write a conversion-focused lifecycle email with subject and body.',
  },
  {
    id: 'ads',
    label: 'Ad Copy',
    icon: '📢',
    hint: 'Generate high-intent ad copy for paid social/search.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    icon: '💼',
    hint: 'Create a professional post for B2B or premium audiences.',
  },
  {
    id: 'sms',
    label: 'SMS Campaign',
    icon: '📲',
    hint: 'Write a concise message with urgent CTA and offer hook.',
  },
  {
    id: 'tiktok',
    label: 'TikTok Script',
    icon: '🎬',
    hint: 'Build a short-form hook-script-CTA sequence for video content.',
  },
  {
    id: 'visuals',
    label: 'Visual Concept',
    icon: '🖼️',
    hint: 'Generate art direction, layout, and overlay text for campaign visuals.',
  },
];

export function MarketingStudioSection({
  dashboard,
  selectedOption,
  onSelectOption,
  prompt,
  onPromptChange,
  onGenerate,
  loading,
  progressText,
  content,
  visualType,
  onVisualTypeChange,
  visualImageUrls,
  campaignForm,
  onCampaignFormChange,
  campaignSuggestions,
  onApplySuggestion,
}) {
  const disabled = !dashboard;
  const selectedMeta = SOCIAL_OPTIONS.find((option) => option.id === selectedOption) || SOCIAL_OPTIONS[0];

  return (
    <section className="marketing-section">
      <div className="section-heading">
        <span className="section-tag">Step 3</span>
        <h2>Marketing content studio</h2>
      </div>

      <div className="marketing-layout">
        <div className="glass-panel marketing-composer">
          <h3>Ask for content</h3>
          <p>
            Choose a format, then request ideas adapted to your product, audience, and campaign objective.
          </p>

          <div className="option-grid">
            {SOCIAL_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={selectedOption === option.id ? 'option-chip active' : 'option-chip'}
                onClick={() => onSelectOption(option.id)}
              >
                <span>{option.icon}</span>
                <div>
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </div>
              </button>
            ))}
          </div>

          <form className="composer composer--modern" onSubmit={onGenerate}>
            <div className="campaign-grid">
              <label className="visual-type-field">
                Campaign objective
                <select
                  value={campaignForm.objective}
                  onChange={(event) => onCampaignFormChange('objective', event.target.value)}
                >
                  {(campaignForm.objectiveOptions || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="visual-type-field">
                Target audience
                <select
                  value={campaignForm.audience}
                  onChange={(event) => onCampaignFormChange('audience', event.target.value)}
                >
                  {(campaignForm.audienceOptions || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="visual-type-field">
                Product focus
                <select
                  value={campaignForm.productFocus}
                  onChange={(event) => onCampaignFormChange('productFocus', event.target.value)}
                >
                  {(campaignForm.productOptions || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="visual-type-field">
                Product angle
                <select
                  value={campaignForm.productAngle}
                  onChange={(event) => onCampaignFormChange('productAngle', event.target.value)}
                >
                  <option value="trending">Trending product</option>
                  <option value="less_known">Less known product</option>
                  <option value="balanced">Balanced mix</option>
                </select>
              </label>
            </div>

            {selectedOption === 'visuals' ? (
              <label className="visual-type-field">
                Visual format
                <select value={visualType} onChange={(event) => onVisualTypeChange(event.target.value)}>
                  <option value="photo">Photo</option>
                  <option value="poster">Poster</option>
                  <option value="banner">Banner</option>
                </select>
              </label>
            ) : null}

            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              rows={5}
              placeholder={selectedOption === 'visuals'
                ? 'Example: Luxury skincare launch visual for women 25-35, spring campaign, soft neutral palette, premium mood'
                : 'Example: Write an Instagram launch post for high-value repeat customers with a premium tone'}
            />
            <button type="submit" className="btn-primary btn-primary--full" disabled={loading || disabled || !prompt.trim()}>
              {loading ? 'Generating...' : selectedOption === 'visuals' ? 'Generate Visual' : 'Generate Marketing Content'}
            </button>
            {progressText ? <p className="progress-text">{progressText}</p> : null}
            {disabled ? <p className="attachment-summary">Run analysis first to unlock context-aware marketing generation.</p> : null}
          </form>

          <div className="suggestions-panel">
            <p className="suggestions-panel__title">Campaign suggestions from your data</p>
            <div className="suggestion-list">
              {(campaignSuggestions || []).map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => onApplySuggestion(suggestion)}
                >
                  <strong>{suggestion.title}</strong>
                  <small>{suggestion.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="marketing-results">
          {selectedOption === 'visuals' ? <VisualPreview imageUrls={visualImageUrls} /> : null}
          <PostCard icon={selectedMeta.icon} title={selectedMeta.label} content={content} />
        </div>
      </div>
    </section>
  );
}

function VisualPreview({ imageUrls }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [imageUrls]);

  const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
  const current = hasImages ? imageUrls[index] : '';

  return (
    <article className="post-card glass-panel">
      <div className="post-card__header">
        <span className="post-card__icon">🖼️</span>
        <h3>Generated Visual Preview</h3>
      </div>
      {current ? (
        <div className="visual-preview">
          <img
            src={current}
            alt="Generated campaign visual"
            loading="lazy"
            onError={() => {
              if (index < imageUrls.length - 1) {
                setIndex((prev) => prev + 1);
              }
            }}
          />
        </div>
      ) : (
        <p className="results-empty">No visual generated yet.</p>
      )}
      {hasImages && index >= imageUrls.length - 1 ? (
        <p className="visual-preview__hint">If this preview still looks off, click Generate Visual again for a new variation.</p>
      ) : null}
    </article>
  );
}

function PostCard({ icon, title, content }) {
  return (
    <article className="post-card glass-panel">
      <div className="post-card__header">
        <span className="post-card__icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="post-card__content">
        {content ? <p>{content}</p> : <p className="results-empty">No content generated yet.</p>}
      </div>
    </article>
  );
}
