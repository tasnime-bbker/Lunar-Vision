import { useEffect, useMemo, useState } from 'react';
import { analyzeEcommerceFiles, checkHealth, fetchSampleDataset, sendChatMessage } from './api';
import { AnalysisStartSection } from './components/AnalysisStartSection';
import { BusinessInsightsSection } from './components/BusinessInsightsSection';
import { MarketingStudioSection } from './components/MarketingStudioSection';
import { MarketCompetitiveWatch } from './components/MarketCompetitiveWatch';
import { HeadToHeadComparison } from './components/HeadToHeadComparison';
import { AgentCopilotChat } from './components/AgentCopilotChat';

function App() {
  const [platformSection, setPlatformSection] = useState('ecommerce');

  const [messages, setMessages] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activeView, setActiveView] = useState('kpi');
  const [marketingPrompt, setMarketingPrompt] = useState('');
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingProgress, setMarketingProgress] = useState('');
  const [selectedOption, setSelectedOption] = useState('instagram');
  const [contentCards, setContentCards] = useState({});
  const [visualType, setVisualType] = useState('poster');
  const [visualImageUrls, setVisualImageUrls] = useState([]);
  const [detailQuestion, setDetailQuestion] = useState('');
  const [detailAnswer, setDetailAnswer] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    objective: 'Improve retention',
    audience: 'New customers',
    productFocus: 'Auto from DB',
    productAngle: 'trending',
    objectiveOptions: ['Improve retention', 'Increase AOV', 'Drive repeat purchases', 'Promote category growth'],
    audienceOptions: ['New customers', 'Returning customers', 'High-value customers', 'At-risk customers'],
    productOptions: ['Auto from DB'],
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  useEffect(() => {
    if (!dashboard) {
      return;
    }
    const derived = deriveCampaignFormOptions(dashboard);
    setCampaignForm((prev) => ({
      ...prev,
      objectiveOptions: derived.objectiveOptions,
      audienceOptions: derived.audienceOptions,
      productOptions: derived.productOptions,
      objective: derived.objectiveOptions.includes(prev.objective) ? prev.objective : derived.objectiveOptions[0],
      audience: derived.audienceOptions.includes(prev.audience) ? prev.audience : derived.audienceOptions[0],
      productFocus: derived.productOptions.includes(prev.productFocus) ? prev.productFocus : derived.productOptions[0],
    }));
  }, [dashboard]);

  const campaignSuggestions = useMemo(() => buildCampaignSuggestions(dashboard), [dashboard]);

  const chatHistory = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        content: m.content
      })),
    [messages]
  );

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (attachedFiles.length === 0 || analysisLoading) {
      return;
    }

    setAnalysisLoading(true);
    setAnalysisProgress('Reading file structure...');

    try {
      setTimeout(() => setAnalysisProgress('Detecting schema and business columns...'), 450);
      setTimeout(() => setAnalysisProgress('Computing KPIs and business diagnostics...'), 1000);
      setTimeout(() => setAnalysisProgress('Generating actionable insights...'), 1550);

      const uploadedFiles = await Promise.all(
        attachedFiles.map(async (file) => ({
          name: file.name,
          mime_type: file.type || null,
          content_base64: await readFileAsBase64(file)
        }))
      );

      const response = await analyzeEcommerceFiles({
        prompt: '',
        uploadedFiles,
      });

      setDashboard(response);
      setActiveView('kpi');
      setAnalysisProgress('Analysis complete. KPIs and recommendations are ready.');
      setMarketingPrompt('');
    } catch (error) {
      setAnalysisProgress(`Analysis failed: ${error.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAskInsightDetails = async (event) => {
    event.preventDefault();
    const question = detailQuestion.trim();
    if (!question || !dashboard || detailLoading) {
      return;
    }

    setDetailLoading(true);
    setDetailAnswer('');
    try {
      const context = JSON.stringify({
        kpis: dashboard.kpis?.kpis || {},
        insights: dashboard.insights || {},
        strategies: dashboard.strategies || {},
      }, null, 2);

      const response = await sendChatMessage({
        message: `You are an ecommerce business analyst.

Answer the follow-up question using ONLY the provided KPI/insight context.
Do NOT output generic statistical analysis sections, raw number arrays, or formulas.
Do NOT output headings like "Statistical Analysis".

Required response style:
1) Problem diagnosis (plain language)
2) Likely business impact
3) 3 concrete actions for next 30 days
4) What to monitor next (specific KPIs)

Question: ${question}

Context:
${context}`,
        agentType: 'data_analysis_and_insights',
        chatHistory: [],
        uploadedFiles: [],
      });
      const cleaned = cleanAssistantText(response.content || 'No additional details generated.');
      setDetailAnswer(cleaned);
    } catch (error) {
      setDetailAnswer(`Could not generate details: ${error.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerateMarketing = async (event) => {
    event.preventDefault();
    const trimmed = marketingPrompt.trim();
    const requirementBrief = buildRequirementBrief(trimmed, campaignForm);
    if (!requirementBrief || marketingLoading || !dashboard) {
      return;
    }

    setMarketingLoading(true);
    setMarketingProgress('Preparing campaign context from your business insights...');

    const userMessage = {
      role: 'user',
      content: requirementBrief,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setTimeout(() => setMarketingProgress(selectedOption === 'visuals' ? 'Generating visual concept and preview...' : 'Generating social-ready marketing copy...'), 650);

      const strategyContext = JSON.stringify(dashboard.strategies || {}, null, 2);
      const requestedChannel = getOptionOutputLabel(selectedOption);
      const prompt = `Create ecommerce marketing content using the strategy context below. Do not mention internal systems.

Requested focus: ${selectedOption}
    Requested output label: ${requestedChannel}
Visual format: ${selectedOption === 'visuals' ? visualType : 'not_applicable'}
User request: ${trimmed}
Form context:
- Objective: ${campaignForm.objective}
- Audience: ${campaignForm.audience}
- Product focus: ${campaignForm.productFocus}
- Product angle: ${campaignForm.productAngle}

Strategy context:
${strategyContext}

Data-backed KPI context:
${JSON.stringify(dashboard.kpis?.kpis || {}, null, 2)}

Problem and opportunity context:
${JSON.stringify({
  problems: dashboard.insights?.problems || [],
  opportunities: dashboard.insights?.opportunities || [],
}, null, 2)}

    Rules:
    - Return JSON only with keys: content and campaign_suggestions
    - content is the requested channel output and must be a plain string
    - campaign_suggestions must contain exactly 3 distinct campaign ideas
    - each idea must include: title, audience, product_focus, angle (trending or less_known), and rationale linked to KPI/problem
    - Generate only the requested channel output (${requestedChannel}), do not include other channels
    - Adapt output to selected objective, audience, and product focus
    - Avoid generic hype phrasing (unlock, exclusive rewards, elevate your experience)
    - Include clear CTA and concrete value proposition
    - Avoid hashtags unless explicitly requested in user request
    - One campaign suggestion must use a trending product angle and one must use a less-known product angle
    - If requested output is visual_concept, provide a practical creative brief with: core concept, visual style, color direction, layout idea, and text overlay suggestions
    `;

      const response = await sendChatMessage({
        message: prompt,
        agentType: 'content_creation_and_generation',
        chatHistory: [...chatHistory, userMessage],
        uploadedFiles: [],
      });

      const cleanedContent = cleanAssistantText(response.content || 'No response received.');
      const generated = parseMarketingContent(cleanedContent, selectedOption, trimmed);

      setContentCards((prev) => ({
        ...prev,
        [selectedOption]: generated,
      }));

      if (selectedOption === 'visuals') {
        const imagePrompt = buildVisualImagePrompt(generated, trimmed, visualType, campaignForm);
        setVisualImageUrls(buildVisualImageUrls(imagePrompt));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Marketing content generated. You can now adapt tone, channel, and CTA.',
        },
      ]);
      setMarketingProgress(selectedOption === 'visuals' ? 'Visual concept and preview ready.' : 'Marketing content ready.');
    } catch (error) {
      if (selectedOption === 'visuals') {
        const fallbackConcept = buildPromptFromCampaignForm(campaignForm);
        const imagePrompt = buildVisualImagePrompt('', trimmed || fallbackConcept, visualType, campaignForm);
        setContentCards((prev) => ({
          ...prev,
          visuals: `Visual concept fallback: ${trimmed || fallbackConcept}`,
        }));
        setVisualImageUrls(buildVisualImageUrls(imagePrompt));
        setMarketingProgress('Visual generated with fallback mode.');
      } else {
        setMarketingProgress(`Generation failed: ${error.message}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not generate content this time. Please try a more specific brief.',
        },
      ]);
    } finally {
      setMarketingLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(files);
  };

  const handleLoadSample = async () => {
    if (analysisLoading) {
      return;
    }
    setAnalysisLoading(true);
    setAnalysisProgress('Fetching Olist e-commerce sample dataset (350 orders)...');

    try {
      const sample = await fetchSampleDataset();
      setAnalysisProgress('Running 6-agent e-commerce intelligence pipeline...');

      const response = await analyzeEcommerceFiles({
        prompt: '',
        uploadedFiles: [
          {
            name: sample.name,
            mime_type: sample.mime_type,
            content_base64: sample.content_base64,
          },
        ],
      });

      setDashboard(response);
      setActiveView('kpi');
      setAnalysisProgress('Analysis complete. KPIs, SWOT scorecard, and recommendations are ready.');
      setMarketingPrompt('');
    } catch (error) {
      setAnalysisProgress(`Sample load failed: ${error.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="app-shell app-shell--ecommerce">
      <div className="aurora" />
      <div className="grid-overlay" />

      {/* Global Sticky Navbar */}
      <nav className="global-navbar glass-panel">
        <div className="global-navbar__brand" onClick={() => setPlatformSection('ecommerce')} style={{ cursor: 'pointer' }}>
          <span className="brand-icon">🌙</span>
          <div>
            <div className="brand-name">Lunar Vision</div>
            <div className="brand-sub">Intelligence Platform</div>
          </div>
        </div>

        <div className="global-navbar__nav">
          <button
            type="button"
            className={`global-nav-pill ${platformSection === 'ecommerce' ? 'active' : ''}`}
            onClick={() => setPlatformSection('ecommerce')}
          >
            📊 E-Commerce Analytics
          </button>
          <button
            type="button"
            className={`global-nav-pill ${platformSection === 'competitive' ? 'active' : ''}`}
            onClick={() => setPlatformSection('competitive')}
          >
            🌐 Competitive Radar
          </button>
          <button
            type="button"
            className={`global-nav-pill ${platformSection === 'comparison' ? 'active' : ''}`}
            onClick={() => setPlatformSection('comparison')}
          >
            ⚔️ Head-to-Head
          </button>
          <button
            type="button"
            className={`global-nav-pill ${platformSection === 'copilot' ? 'active' : ''}`}
            onClick={() => setPlatformSection('copilot')}
          >
            💬 Agent Copilot
          </button>
        </div>

        <div className="global-navbar__actions">
          <span className={`status-pill ${backendStatus}`} style={{ fontSize: '11.5px', padding: '4px 10px' }}>
            ● {backendStatus === 'online' ? 'Online (Port 8000)' : backendStatus}
          </span>
          {platformSection === 'ecommerce' && !dashboard && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLoadSample}
              disabled={analysisLoading}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ⚡ Quick Sample
            </button>
          )}
          {dashboard && platformSection === 'ecommerce' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setDashboard(null);
                setAnalysisProgress('');
                setMarketingProgress('');
              }}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              🔄 New Dataset
            </button>
          )}
        </div>
      </nav>

      {/* Hero Intro */}
      <header className="topbar topbar--app-intro glass-panel" style={{ marginTop: '16px' }}>
        <div>
          <span className="brand-kicker">
            {platformSection === 'ecommerce' && 'Autonomous E-Commerce Diagnostics'}
            {platformSection === 'competitive' && 'Continuous Market Sensing Radar'}
            {platformSection === 'comparison' && 'Dual-Competitor Battleground'}
            {platformSection === 'copilot' && 'Multi-Agent Strategy Fleet'}
          </span>
          <h1>
            {platformSection === 'ecommerce' && 'E-Commerce Growth & Diagnostic Platform'}
            {platformSection === 'competitive' && 'Market Threat Sensing & Competitive Radar'}
            {platformSection === 'comparison' && 'Head-to-Head Battleground Comparison'}
            {platformSection === 'copilot' && 'Direct Multi-Agent Strategy Copilot'}
          </h1>
          <p className="topbar__slogan">
            {platformSection === 'ecommerce' && 'Transform raw customer and sales transactions into actionable KPIs, diagnostic root causes, and high-converting marketing campaigns.'}
            {platformSection === 'competitive' && 'Deploy synchronized Researcher, Analyst, and Writer agents to capture feature velocity, ThreatRadar scores, and battle cards.'}
            {platformSection === 'comparison' && 'Pit two industry rivals against each other to contrast ThreatRadar scores, capability moats, and strategic whitespace.'}
            {platformSection === 'copilot' && 'Engage directly in real-time dialogue with our 4 specialized agents for deep strategic planning and operational problem solving.'}
          </p>
        </div>
      </header>

      {/* Active Section Router */}
      {platformSection === 'competitive' && <MarketCompetitiveWatch />}
      {platformSection === 'comparison' && <HeadToHeadComparison />}
      {platformSection === 'copilot' && <AgentCopilotChat />}

      {platformSection === 'ecommerce' && (
        <>
          <AnalysisStartSection
            backendStatus={backendStatus}
            attachedFiles={attachedFiles}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            onLoadSample={handleLoadSample}
            loading={analysisLoading}
            progressText={analysisProgress}
          />

      {dashboard ? (
        <section className="action-panel glass-panel">
          <p className="action-panel__title">Choose your next action</p>
          <div className="action-list">
            <button
              type="button"
              className={activeView === 'kpi' ? 'action-chip active' : 'action-chip'}
              onClick={() => setActiveView('kpi')}
            >
              View KPI Dashboard
            </button>
            <button
              type="button"
              className={activeView === 'marketing' ? 'action-chip active' : 'action-chip'}
              onClick={() => setActiveView('marketing')}
            >
              Generate Marketing Posts
            </button>
            <button
              type="button"
              className="action-chip"
              onClick={() => {
                setDashboard(null);
                setAnalysisProgress('');
                setMarketingProgress('');
              }}
            >
              Upload New Dataset
            </button>
          </div>
        </section>
      ) : null}

      {dashboard && activeView === 'kpi' ? (
        <BusinessInsightsSection
          dashboard={dashboard}
          detailQuestion={detailQuestion}
          onDetailQuestionChange={setDetailQuestion}
          onAskDetails={handleAskInsightDetails}
          detailAnswer={detailAnswer}
          detailLoading={detailLoading}
        />
      ) : null}

      {activeView === 'marketing' ? (
        <MarketingStudioSection
          dashboard={dashboard}
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
          prompt={marketingPrompt}
          onPromptChange={setMarketingPrompt}
          onGenerate={handleGenerateMarketing}
          loading={marketingLoading}
          progressText={marketingProgress}
          content={contentCards[selectedOption] || ''}
          visualType={visualType}
          onVisualTypeChange={setVisualType}
          visualImageUrls={visualImageUrls}
          campaignForm={campaignForm}
          onCampaignFormChange={(field, value) => {
            setCampaignForm((prev) => {
              const next = { ...prev, [field]: value };
              setMarketingPrompt(buildPromptFromCampaignForm(next));
              return next;
            });
          }}
          campaignSuggestions={campaignSuggestions}
          onApplySuggestion={(suggestion) => {
            setCampaignForm((prev) => ({
              ...prev,
              objective: suggestion.objective || prev.objective,
              audience: suggestion.audience || prev.audience,
              productFocus: suggestion.productFocus || prev.productFocus,
              productAngle: suggestion.productAngle || prev.productAngle,
            }));
            setMarketingPrompt(suggestion.prompt);
          }}
        />
      ) : null}
        </>
      )}

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-scroll-top glass-panel"
          title="Back to Top"
        >
          ↑
        </button>
      )}

    </div>
  );
}

function cleanAssistantText(text) {
  return text
    .replace(/data analysis agent/gi, 'analysis details')
    .replace(/content creation agent/gi, 'content service')
    .replace(/automation agent/gi, 'automation service')
    .replace(/customer service agent/gi, 'assistant')
    .replace(/schema agent|kpi agent|insight agent|marketing agent/gi, 'analysis engine')
    .trim();
}

function parseMarketingContent(text, selectedOption, originalPrompt) {
  const outputKey = getOptionOutputLabel(selectedOption);
  const stripped = stripCodeFences(text);
  const cleanedWrapper = trimGeneratedWrapper(stripped);

  const fromContentField = extractContentField(cleanedWrapper);
  if (fromContentField) {
    return fromContentField;
  }

  try {
    const parsed = extractJsonObject(cleanedWrapper);
    if (parsed && typeof parsed === 'object') {
      const direct = normalizeContentValue(parsed.content, '');
      if (direct) {
        return direct;
      }

      const mapped = normalizeContentValue(parsed[outputKey], '');
      if (mapped) {
        return mapped;
      }

      for (const value of Object.values(parsed)) {
        const firstString = normalizeContentValue(value, '');
        if (firstString) {
          return firstString;
        }
      }
    }
  } catch {
    // fall through to text-based parser
  }

  const fromLabeled = extractLabeledContent(cleanedWrapper, outputKey);
  if (fromLabeled) {
    return fromLabeled;
  }

  return (cleanedWrapper || originalPrompt).trim();
}

function extractJsonObject(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return JSON.parse(text.slice(start, end + 1));
}

function extractLabeledContent(text, outputKey) {
  const keyPattern = outputKey.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const quoted = new RegExp(`"${keyPattern}"\\s*:\\s*"([\\s\\S]*?)"`, 'i');
  const quotedMatch = text.match(quoted);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].replace(/\\n/g, '\n').trim();
  }

  const plain = new RegExp(`${keyPattern}\\s*:\\s*([\\s\\S]+)$`, 'i');
  const plainMatch = text.match(plain);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }
  return '';
}

function stripCodeFences(text) {
  return text
    .replace(/^```[a-zA-Z0-9]*\s*/g, '')
    .replace(/\s*```$/g, '')
    .trim();
}

function trimGeneratedWrapper(text) {
  if (!text) {
    return '';
  }

  let value = text;

  // Drop markdown report section if present.
  const detailsMarker = value.search(/\n---\s*\n|\n###\s*📊\s*Content Details:/i);
  if (detailsMarker !== -1) {
    value = value.slice(0, detailsMarker);
  }

  // Remove common label wrappers while keeping the payload.
  value = value
    .replace(/^##\s*📝\s*Social Media Created\s*/i, '')
    .replace(/^Instagram Post\s*/i, '')
    .replace(/^Email Campaign\s*/i, '')
    .replace(/^Ad Copy\s*/i, '')
    .trim();

  return value;
}

function extractContentField(text) {
  if (!text) {
    return '';
  }

  const match = text.match(/"content"\s*:\s*"([\s\S]*?)"\s*(,|})/i);
  if (!match?.[1]) {
    return '';
  }

  try {
    return JSON.parse(`"${match[1]}"`).trim();
  } catch {
    return match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .trim();
  }
}

function getOptionOutputLabel(selectedOption) {
  const mapping = {
    instagram: 'instagram_post',
    email: 'email_campaign',
    ads: 'ad_copy',
    linkedin: 'linkedin_post',
    sms: 'sms_campaign',
    tiktok: 'tiktok_script',
    visuals: 'visual_concept',
  };
  return mapping[selectedOption] || 'marketing_content';
}

function buildVisualImagePrompt(generatedContent, originalPrompt, visualType, campaignForm) {
  const styleMap = {
    photo: 'photorealistic ecommerce product photo, studio lighting, sharp focus, premium composition',
    poster: 'high-impact ecommerce advertising poster, bold composition, clear headline zone, branded look',
    banner: 'ecommerce hero banner, wide layout, strong product focus, CTA area, modern style',
  };
  const style = styleMap[visualType] || styleMap.poster;
  const objective = campaignForm?.objective || 'increase conversions';
  const audience = campaignForm?.audience || 'ecommerce shoppers';
  const productFocus = campaignForm?.productFocus || 'featured product';
  const angle = campaignForm?.productAngle || 'balanced';

  const source = (generatedContent || originalPrompt || '').slice(0, 350).replace(/\s+/g, ' ').trim();
  const conciseBrief = [
    `product: ${productFocus}`,
    `audience: ${audience}`,
    `objective: ${objective}`,
    `angle: ${angle}`,
    source ? `campaign message: ${source}` : '',
  ].filter(Boolean).join(', ');

  return `${style}. ${conciseBrief}. ecommerce marketing visual strictly aligned to this brief, no random objects, no unrelated scenes, no watermark, no gibberish text`;
}

function buildVisualImageUrls(imagePrompt) {
  const fallbackSvg = buildVisualFallbackSvg(imagePrompt);
  return [fallbackSvg];
}

function buildVisualFallbackSvg(prompt) {
  const title = extractPromptTitle(prompt);
  const subtitle = extractPromptSubtitle(prompt);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1324"/>
      <stop offset="50%" stop-color="#123267"/>
      <stop offset="100%" stop-color="#0f4c81"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="180" fill="rgba(255,255,255,0.08)"/>
  <rect x="86" y="98" width="1108" height="524" rx="26" fill="rgba(7,14,28,0.58)" stroke="rgba(255,255,255,0.22)"/>
  <text x="132" y="210" fill="#eaf2ff" font-size="52" font-family="Segoe UI, Arial" font-weight="700">${escapeXml(title)}</text>
  <text x="132" y="282" fill="#c9dcff" font-size="30" font-family="Segoe UI, Arial">${escapeXml(subtitle)}</text>
  <text x="132" y="520" fill="#d8e6ff" font-size="26" font-family="Segoe UI, Arial">Prompt-aligned fallback visual</text>
  <rect x="132" y="550" width="320" height="64" rx="12" fill="#3b82f6"/>
  <text x="172" y="592" fill="#ffffff" font-size="28" font-family="Segoe UI, Arial" font-weight="600">Shop Now</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractPromptTitle(prompt) {
  const text = String(prompt || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'Campaign Visual';
  }
  const productMatch = text.match(/product:\s*([^,]+)/i);
  if (productMatch?.[1]) {
    return `${productMatch[1].trim()} Campaign`;
  }
  return text.slice(0, 42);
}

function extractPromptSubtitle(prompt) {
  const text = String(prompt || '').replace(/\s+/g, ' ').trim();
  const audienceMatch = text.match(/audience:\s*([^,]+)/i);
  const objectiveMatch = text.match(/objective:\s*([^,]+)/i);
  const audience = audienceMatch?.[1]?.trim() || 'Target Audience';
  const objective = objectiveMatch?.[1]?.trim() || 'Conversion Focus';
  return `${audience} • ${objective}`;
}

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPromptFromCampaignForm(form) {
  return [
    `Create a campaign for objective: ${form.objective}.`,
    `Target audience: ${form.audience}.`,
    `Product focus: ${form.productFocus}.`,
    `Product angle: ${form.productAngle}.`,
    'Keep the tone conversion-focused and ecommerce-specific.',
  ].join(' ');
}

function buildRequirementBrief(freeText, form) {
  if (freeText && freeText.trim()) {
    return freeText.trim();
  }
  return [
    `Objective: ${form.objective}`,
    `Audience: ${form.audience}`,
    `Product focus: ${form.productFocus}`,
    `Product angle: ${form.productAngle}`,
  ].join(' | ');
}

function deriveCampaignFormOptions(dashboard) {
  const kpis = dashboard?.kpis?.kpis || {};
  const products = Array.isArray(kpis.top_products)
    ? kpis.top_products.map((item) => String(item.product_id || item.product || item.id || '')).filter(Boolean)
    : [];
  const categories = Array.isArray(kpis.revenue_per_product_category)
    ? kpis.revenue_per_product_category.map((item) => String(item.category || item.product_category || item.name || '')).filter(Boolean)
    : [];

  const objectiveOptions = ['Improve retention', 'Increase AOV', 'Drive repeat purchases', 'Promote category growth'];
  const audienceOptions = ['New customers', 'Returning customers', 'High-value customers', 'At-risk customers'];
  const productOptions = ['Auto from DB', ...products.slice(0, 5), ...categories.slice(0, 3)].filter((value, index, arr) => arr.indexOf(value) === index);

  return { objectiveOptions, audienceOptions, productOptions };
}

function buildCampaignSuggestions(dashboard) {
  if (!dashboard) {
    return [];
  }

  const kpis = dashboard?.kpis?.kpis || {};
  const problems = Array.isArray(dashboard?.insights?.problems) ? dashboard.insights.problems : [];
  const opportunities = Array.isArray(dashboard?.insights?.opportunities) ? dashboard.insights.opportunities : [];
  const topProducts = Array.isArray(kpis.top_products) ? kpis.top_products : [];
  const trending = topProducts[0]?.product_id || topProducts[0]?.product || 'top product';
  const lessKnown = topProducts[topProducts.length - 1]?.product_id || topProducts[topProducts.length - 1]?.product || 'underexposed product';

  return [
    {
      id: 's1',
      title: 'Retention Rescue Campaign',
      subtitle: `Audience: New customers | Problem: ${problems[0] || 'low repeat purchases'}`,
      objective: 'Improve retention',
      audience: 'New customers',
      productFocus: trending,
      productAngle: 'trending',
      prompt: `Build a retention campaign for new customers using ${trending}. Use KPI-driven urgency and a 30-day repeat purchase incentive.`,
    },
    {
      id: 's2',
      title: 'Hidden Gem Revival',
      subtitle: `Audience: Returning customers | Opportunity: ${opportunities[0] || 'cross-sell opportunity'}`,
      objective: 'Promote category growth',
      audience: 'Returning customers',
      productFocus: lessKnown,
      productAngle: 'less_known',
      prompt: `Create a campaign that positions ${lessKnown} as a discovery offer for returning buyers and ties it to loyalty benefits.`,
    },
    {
      id: 's3',
      title: 'AOV Booster Bundle',
      subtitle: 'Audience: High-value customers | Angle: Trending + less-known pairing',
      objective: 'Increase AOV',
      audience: 'High-value customers',
      productFocus: `${trending} + ${lessKnown}`,
      productAngle: 'balanced',
      prompt: `Design an AOV campaign bundling ${trending} with ${lessKnown}, with premium positioning and a clear checkout CTA.`,
    },
  ];
}

function normalizeContentValue(value, fallback) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const cleaned = value.trim();
    return cleaned || fallback;
  }
  if (typeof value === 'object') {
    const parts = [];
    for (const key of ['subject', 'headline', 'body', 'text', 'caption', 'cta']) {
      const fieldValue = value[key];
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        parts.push(`${label}: ${fieldValue.trim()}`);
      }
    }
    if (parts.length > 0) {
      return parts.join('\n');
    }
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default App;
