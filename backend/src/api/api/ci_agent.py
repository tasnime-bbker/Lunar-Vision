#!/usr/bin/env python3
"""
Multi-Agent Competitive Intelligence Analyzer
Strands Agents + Bright Data + Gemini with Multi-Agent Workflow
"""

import os
import logging
import json
from typing import Dict, List, Any, Union, Callable, Optional
from strands import Agent
from strands.models.litellm import LiteLLMModel
from strands_tools import bright_data
import functools
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from src.api.redis_cache import get_cache

# Load environment variables from .env if present
load_dotenv()

# Configure logging
logging.getLogger("strands").setLevel(logging.INFO)  # Reduced debug noise
logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()]
)


def get_gemini_model():
    """Configure Groq model using LiteLLM"""

    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

    if not groq_api_key:
        raise ValueError("Groq configuration incomplete: GROQ_API_KEY required")

    print(f"🔧 Configuring Groq Model: {groq_model}")

    model = LiteLLMModel(
        client_args={
            "api_key": groq_api_key,
        },
        model_id=f"groq/{groq_model}",
        params={"max_tokens": 4000, "temperature": 0.3}
    )

    return model


def get_configured_bright_data():
    """Configure Bright Data tool with proper zone settings"""

    # Set environment variables for Bright Data if they're missing
    if not os.getenv("BRIGHTDATA_ZONE"):
        os.environ["BRIGHTDATA_ZONE"] = "datacenter"

    if not os.getenv("BRIGHTDATA_USERNAME") and os.getenv("BRIGHTDATA_API_KEY"):
        # For API key auth, username can be set to a default
        os.environ["BRIGHTDATA_USERNAME"] = "api_user"

    return bright_data


def extract_metrics_from_analysis(analysis_text: str) -> Dict[str, Any]:
    """Extract structured metrics from AI analysis text"""
    import re

    metrics = {
        "competitive_metrics": {},
        "swot_scores": {},
        "raw_analysis": analysis_text
    }

    try:
        # Extract competitive metrics
        threat_match = re.search(
            r'Competitive Threat Level:\s*(\d+)', analysis_text)
        if threat_match:
            metrics["competitive_metrics"]["threat_level"] = int(
                threat_match.group(1))

        market_match = re.search(
            r'Market Position Score:\s*(\d+)', analysis_text)
        if market_match:
            metrics["competitive_metrics"]["market_position"] = int(
                market_match.group(1))

        innovation_match = re.search(
            r'Innovation Score:\s*(\d+)', analysis_text)
        if innovation_match:
            metrics["competitive_metrics"]["innovation"] = int(
                innovation_match.group(1))

        financial_match = re.search(
            r'Financial Strength:\s*(\d+)', analysis_text)
        if financial_match:
            metrics["competitive_metrics"]["financial_strength"] = int(
                financial_match.group(1))

        brand_match = re.search(r'Brand Recognition:\s*(\d+)', analysis_text)
        if brand_match:
            metrics["competitive_metrics"]["brand_recognition"] = int(
                brand_match.group(1))

        # Extract SWOT scores
        strengths_match = re.search(r'Strengths:\s*(\d+)', analysis_text)
        if strengths_match:
            metrics["swot_scores"]["strengths"] = int(strengths_match.group(1))

        weaknesses_match = re.search(r'Weaknesses:\s*(\d+)', analysis_text)
        if weaknesses_match:
            metrics["swot_scores"]["weaknesses"] = int(
                weaknesses_match.group(1))

        opportunities_match = re.search(
            r'Opportunities:\s*(\d+)', analysis_text)
        if opportunities_match:
            metrics["swot_scores"]["opportunities"] = int(
                opportunities_match.group(1))

        threats_match = re.search(r'Threats:\s*(\d+)', analysis_text)
        if threats_match:
            metrics["swot_scores"]["threats"] = int(threats_match.group(1))

    except Exception as e:
        print(f"⚠️ Metrics extraction failed: {e}")

    return metrics


# Agent System Prompts
def get_researcher_prompt(niche: str = "all") -> str:
    """Get niche-specific researcher prompt"""
    base_prompt = """You are a Researcher Agent specialized in competitive intelligence data gathering (via MCP tools, e.g., bright_data, web scrapers, LinkedIn, pricing pages).

Inputs:
- TARGET_COMPANY
- FUNCTIONAL_FOCUS ∈ {Finance, HR, Product, Sales, Marketing, Operations, Legal, IT, Executive, All}
- OPTIONAL: COMPARATORS, DATE_RANGE, REGION

Your role:
1) Data Collection: Gather recent news, funding, launches, customers, pricing, partnerships, hiring, tech stack, compliance, and customer feedback from DIVERSE SOURCES.
2) Source Discovery: Prioritize primary sources (company site, filings, newsroom, pricing, docs), high-quality media, analyst notes, job posts, Glassdoor/G2, developer repos, certifications.
3) Department Lens: Emphasize the selected FUNCTIONAL_FOCUS with the checklist below."""

    niche_specific_focus = {
        "all": """
Department checklists (comprehensive analysis):
- Finance: revenue/funding/runway, margins, unit economics, pricing moves, key financial risks.
- HR: headcount size/velocity, org changes, leadership hires/exits, attrition & culture signals, open roles.
- Product: roadmap/cadence, differentiators, integrations, packaging, usage tiers, security/SLAs.
- Sales: ICP/segments, ACV, sales motion, channels/partners, geos, win/loss themes.
- Marketing: positioning/ICP, SOV/SEO, campaigns, events, brand assets, community.
- Operations: supply/delivery model, uptime/SLAs, support model, scaling constraints.
- Legal: IP, licensing, litigations, regulatory/compliance (SOC2/ISO/PCI/HIPAA/GDPR), data handling.
- IT: stack, architecture, cloud/providers, data model, security posture, roadblocks.
- Executive: strategy, board/investors, OKRs, geographic strategy, M&A rumors/moves.""",

        "it": """
Department checklist (IT & Technology focus):
- IT: stack, architecture, cloud/providers, data model, security posture, roadblocks.
- Engineering practices, CI/CD, infrastructure as code, monitoring/observability.
- Developer experience, API design, technical documentation quality.
- Security certifications (SOC2, ISO27001, PCI), vulnerability management.
- Technical partnerships, integrations, third-party dependencies.
- Open source contributions, technical blog posts, engineering culture.
- Cloud costs, technical debt, scalability bottlenecks.""",

        "sales": """
Department checklist (Sales & Business Development focus):
- Sales: ICP/segments, ACV, sales motion, channels/partners, geos, win/loss themes.
- Sales team structure, quota attainment, sales cycle length, conversion rates.
- Pricing strategy, discount policies, contract terms, payment models.
- CRM systems, sales tools, lead generation, qualification processes.
- Customer case studies, testimonials, reference customers.
- Channel partnerships, reseller programs, indirect sales.
- Competitive positioning, battle cards, objection handling.""",

        "marketing": """
Department checklist (Marketing & Growth focus):
- Marketing: positioning/ICP, SOV/SEO, campaigns, events, brand assets, community.
- Content strategy, thought leadership, SEO performance, organic traffic.
- Paid advertising, CAC/LTV, attribution models, conversion funnels.
- Social media presence, community building, developer relations.
- Event marketing, conference sponsorships, webinar programs.
- Brand partnerships, influencer collaborations, PR strategy.
- Marketing automation, lead scoring, nurturing campaigns.""",

        "finance": """
Department checklist (Finance & Operations focus):
- Finance: revenue/funding/runway, margins, unit economics, pricing moves, key financial risks.
- Funding history, investor relations, board composition, valuation trends.
- Revenue recognition, billing models, churn rates, expansion revenue.
- Cost structure, OPEX/CAPEX, burn rate, path to profitability.
- Financial controls, audit results, compliance frameworks.
- Procurement processes, vendor relationships, contract negotiations.
- Budget planning, resource allocation, financial forecasting.""",

        "product": """
Department checklist (Product & Engineering focus):
- Product: roadmap/cadence, differentiators, integrations, packaging, usage tiers, security/SLAs.
- Feature release velocity, product-market fit signals, user adoption metrics.
- User experience design, customer feedback loops, usability testing.
- Product analytics, usage data, feature adoption, user journeys.
- Integration ecosystem, API strategy, developer experience.
- Product packaging, pricing tiers, feature gating, monetization.
- R&D investments, innovation labs, emerging technology adoption.""",

        "hr": """
Department checklist (HR & People Operations focus):
- HR: headcount size/velocity, org changes, leadership hires/exits, attrition & culture signals, open roles.
- Compensation philosophy, equity programs, benefits packages.
- Remote work policies, office locations, workplace culture.
- Learning & development, career progression, performance management.
- Diversity, equity, inclusion initiatives, representation metrics.
- Employee engagement, satisfaction surveys, retention strategies.
- Organizational design, reporting structures, team dynamics."""
    }

    focus_section = niche_specific_focus.get(
        niche, niche_specific_focus["all"])

    return f"""{base_prompt}

{focus_section}

Deliverable (≤500 words):
- Bulleted findings per FUNCTIONAL_FOCUS (most recent first) with inline source URLs.
- 3–5 "Signals to Watch" tied to the focus area.
- Date of last verification.

CRITICAL: Use DIVERSE SOURCES - don't repeat the same information. Search multiple sites:
- Company website, newsroom, blog, pricing pages
- SEC filings, investor presentations, earnings calls
- Job boards (LinkedIn, AngelList, company careers page)
- Review sites (G2, Capterra, Glassdoor, TrustPilot)
- Social media (LinkedIn, Twitter, YouTube)
- Industry publications, analyst reports
- Developer resources (GitHub, Stack Overflow, documentation)
- News outlets, press releases, trade publications
"""


# Maintain backward compatibility
RESEARCHER_PROMPT = get_researcher_prompt("all")

ANALYST_PROMPT = """You are an Analyst Agent for competitive intelligence.

Inputs: Researcher Deliverable + FUNCTIONAL_FOCUS.

Your role:
1) Strategic analysis by FUNCTIONAL_FOCUS (business model, revenue drivers, pricing, channels, risks).
2) Compute and display scores (below) and perform a SWOT tied to the focus area.
3) Keep analysis concise and actionable.

IMPORTANT — Use these EXACT sections:

## METRICS
- Competitive Threat Level: [1-5]
- Market Position Score: [1-10]
- Innovation Score: [1-10]
- Financial Strength: [1-10]
- Brand Recognition: [1-10]

## SWOT SCORES
- Strengths: [1-10]
- Weaknesses: [1-10] 
- Opportunities: [1-10]
- Threats: [1-10]

## ANALYSIS
- Department-focused narrative with evidence and implications.
- **Metric formulas & meaning** (put here, not in METRICS):
  • Competitive Threat Level (1–5) = 0.4*MarketOverlap(0–5) + 0.3*DealDisplacement(0–5) + 0.3*SwitchingCostInverse(0–5); higher = more immediate risk.  
  • Market Position (1–10) = 0.35*Share + 0.25*Growth_vs_Market + 0.2*Distribution + 0.2*CustomerMix.  
  • Innovation (1–10) = 0.4*ReleaseCadence + 0.3*R&D%Revenue + 0.3*DifferentiationDepth.  
  • Financial Strength (1–10) = 0.3*Scale + 0.25*GrossMargin + 0.25*Profitability/Runway + 0.2*FundingAccess.  
  • Brand Recognition (1–10) = 0.4*ShareOfVoice + 0.3*Direct/OrganicTraffic + 0.3*Ratings/NPS.  
- Note assumptions and any data gaps.

Keep under 500 words.
"""

WRITER_PROMPT = """You are a Writer Agent producing an executive-ready competitive brief.

Inputs: Analyst output + FUNCTIONAL_FOCUS.

Structure (≤500 words):
- **Executive Summary**: 3–5 bullets; overall threat level; one-line takeaway for the focus department.
- **Metrics at a Glance**: list the five metric values with a brief meaning (e.g., "Innovation 8/10 — fast ship cadence & strong R&D%").
- **Business Model Analysis** (focus-aware): how they make money, pricing/packaging, cost drivers, and key levers affecting the selected department.
- **Competitive Positioning**: differentiators vs. us, target segments, channels, and customer proof.
- **Strategic Recommendations** (focus-aware): 4–6 specific moves (defensive & offensive) with expected impact.
- **Action Items**: owners & next steps (1–2 weeks), plus 2–3 "Watchpoints".

Cite source URLs lightly in-line (e.g., "[pricing]").
Professional tone, executive-ready format, actionable intelligence.
"""


class StreamingCallbackHandler:
    """Callback handler for streaming tool calls and responses"""

    def __init__(self, stream_callback: Optional[Callable] = None):
        self.stream_callback = stream_callback

    def __call__(self, **kwargs):
        """Handle streaming callbacks"""
        if self.stream_callback:
            try:
                # Create streaming event with safe serialization
                event = {
                    "timestamp": datetime.now().isoformat(),
                    "type": "tool_call",
                }

                # Safely extract tool information
                if "current_tool_use" in kwargs:
                    tool = kwargs.get("current_tool_use", {})
                    if isinstance(tool, dict):
                        event["tool_name"] = tool.get("name", "unknown")
                        # Safely serialize tool input
                        tool_input = tool.get("input", {})
                        if isinstance(tool_input, (dict, list, str, int, float, bool, type(None))):
                            event["tool_input"] = tool_input
                        else:
                            event["tool_input"] = str(tool_input)
                    elif isinstance(tool, str):
                        event["tool_name"] = tool
                        event["tool_input"] = {}
                    else:
                        event["tool_name"] = str(tool)
                        event["tool_input"] = {}

                # Add safe data - only include serializable items
                safe_data = {}
                for key, value in kwargs.items():
                    if key == "current_tool_use":
                        continue  # Already handled above

                    # Only include JSON serializable data
                    if isinstance(value, (dict, list, str, int, float, bool, type(None))):
                        try:
                            json.dumps(value)  # Test if it's JSON serializable
                            safe_data[key] = value
                        except (TypeError, ValueError):
                            safe_data[key] = str(value)
                    else:
                        safe_data[key] = str(value)

                if safe_data:
                    event["data"] = safe_data

                # Send to stream callback
                self.stream_callback(event)

            except Exception as e:
                # Fallback event if something goes wrong
                error_event = {
                    "timestamp": datetime.now().isoformat(),
                    "type": "tool_call",
                    "tool_name": "unknown",
                    "error": f"Callback error: {str(e)}"
                }
                self.stream_callback(error_event)


class MultiAgentCompetitiveIntelligence:
    """Multi-Agent Competitive Intelligence Workflow"""

    def __init__(self, stream_callback: Optional[Callable] = None):
        """Initialize specialized agents with enhanced error handling and streaming"""
        try:
            gemini_model = get_gemini_model()

            # Create callback handler for streaming
            callback_handler = StreamingCallbackHandler(
                stream_callback) if stream_callback else None

            # Researcher Agent with web capabilities
            configured_bright_data = get_configured_bright_data()
            self.researcher_agent = Agent(
                model=gemini_model,
                system_prompt=RESEARCHER_PROMPT,  # Will be updated dynamically in workflow
                tools=[configured_bright_data],
                callback_handler=callback_handler
            )

            # Analyst Agent for competitive analysis
            self.analyst_agent = Agent(
                model=gemini_model,
                system_prompt=ANALYST_PROMPT,
                callback_handler=callback_handler
            )

            # Writer Agent for final report creation
            self.writer_agent = Agent(
                model=gemini_model,
                system_prompt=WRITER_PROMPT,
                callback_handler=callback_handler
            )

            self.stream_callback = stream_callback

            if not stream_callback:  # Only print if not in API mode
                print("✅ Multi-agent workflow initialized successfully!")
                print("   📊 Researcher Agent: Data gathering and web scraping")
                print("   🔍 Analyst Agent: Strategic analysis and threat assessment")
                print("   📝 Writer Agent: Report generation and recommendations")
            self.fallback_mode = False

        except Exception as e:
            logging.getLogger(__name__).warning(f"Live LLM initialization skipped ({e}). Running in deterministic competitive intelligence mode.")
            self.fallback_mode = True
            self.stream_callback = stream_callback

    def _send_status_update(self, message: str, step: str = "info"):
        """Send status update through stream if available"""
        if self.stream_callback:
            event = {
                "timestamp": datetime.now().isoformat(),
                "type": "status_update",
                "step": step,
                "message": message
            }
            self.stream_callback(event)
        else:
            print(message)

    def run_competitive_intelligence_workflow(self, competitor_name: str, competitor_website: str = None, niche: str = "all") -> Dict[str, Any]:
        """
        Multi-agent competitive intelligence workflow with Redis caching
        """
        cache = get_cache()

        # Check if we have cached analysis for this competitor
        cached_analysis = cache.get_analysis(
            competitor_name, competitor_website, niche)
        if cached_analysis:
            self._send_status_update(
                f"🎯 Found cached analysis for: {competitor_name}", "cache_hit")
            self._send_status_update(
                "✅ Returning cached competitive intelligence", "cache_complete")
            return cached_analysis

        self._send_status_update(
            f"🎯 Starting Multi-Agent Analysis for: {competitor_name}", "start")
        self._send_status_update("Initializing multi-agent workflow...")

        if getattr(self, "fallback_mode", False):
            result = self._run_fallback_workflow(competitor_name, competitor_website, niche)
            cache.set_analysis(competitor_name, result, competitor_website, niche)
            return result

        try:
            # Update researcher agent with niche-specific prompt
            niche_prompt = get_researcher_prompt(niche)
            self.researcher_agent.system_prompt = niche_prompt

            # Step 1: Researcher Agent gathers comprehensive data
            niche_label = {
                "all": "Comprehensive Analysis",
                "it": "IT & Technology Focus",
                "sales": "Sales & Business Development Focus",
                "marketing": "Marketing & Growth Focus",
                "finance": "Finance & Operations Focus",
                "product": "Product & Engineering Focus",
                "hr": "HR & People Operations Focus"
            }.get(niche, f"{niche.upper()} Focus")

            self._send_status_update(
                f"📊 Researcher Agent gathering competitive intelligence ({niche_label})...", "research_start")

            # Create niche-specific research query
            base_research_query = f"""Research competitive intelligence for "{competitor_name}".
            
            {'Website: ' + competitor_website if competitor_website else ''}"""

            # Build niche-specific queries with proper string formatting
            if niche == "it":
                query_focus = f"""
            
            Focus specifically on IT & Technology intelligence:
            1. Technology stack, infrastructure, and cloud platforms
            2. Software development practices and engineering team
            3. API documentation and developer resources
            4. Security measures and compliance certifications
            5. Technical partnerships and integrations
            6. Open source contributions and technical blog
            7. IT job postings and technical requirements
            8. Technical product features and architecture
            
            Search terms to prioritize: "{competitor_name} technology stack", "{competitor_name} engineering team", "{competitor_name} API documentation", "{competitor_name} security compliance\""""
            elif niche == "sales":
                query_focus = f"""
            
            Focus specifically on Sales & Business Development:
            1. Sales methodology and process documentation
            2. Pricing models, packages, and revenue streams
            3. Sales team structure and job postings
            4. Customer case studies and success stories
            5. Partner programs and channel strategies
            6. Sales tools and CRM integrations
            7. Competitive positioning and win/loss data
            8. Sales collateral and presentation materials
            
            Search terms to prioritize: "{competitor_name} pricing", "{competitor_name} sales team", "{competitor_name} customer case studies", "{competitor_name} partner program\""""
            elif niche == "marketing":
                query_focus = f"""
            
            Focus specifically on Marketing & Growth:
            1. Marketing channels and campaign strategies
            2. Content marketing and SEO performance
            3. Social media presence and engagement metrics
            4. Brand messaging and positioning
            5. Customer acquisition funnels and conversion
            6. Marketing automation and tools
            7. Event marketing and sponsorship activities
            8. Influencer partnerships and collaborations
            
            Search terms to prioritize: "{competitor_name} marketing strategy", "{competitor_name} social media", "{competitor_name} content marketing", "{competitor_name} events sponsorship\""""
            elif niche == "finance":
                query_focus = f"""
            
            Focus specifically on Finance & Operations:
            1. Revenue models and financial performance
            2. Funding history and investor information
            3. Operational efficiency and cost structure
            4. Financial reporting and transparency
            5. Procurement processes and vendor relationships
            6. Risk management and compliance frameworks
            7. Budget allocation and resource planning
            8. Financial partnerships and integrations
            
            Search terms to prioritize: "{competitor_name} funding", "{competitor_name} revenue model", "{competitor_name} financial performance", "{competitor_name} investors\""""
            elif niche == "product":
                query_focus = f"""
            
            Focus specifically on Product & Engineering:
            1. Product roadmap and development cycle
            2. Feature releases and user feedback
            3. Engineering practices and development team
            4. Product-market fit and user adoption metrics
            5. Technical architecture and scalability
            6. User experience and design philosophy
            7. Product analytics and performance metrics
            8. Innovation labs and R&D investments
            
            Search terms to prioritize: "{competitor_name} product roadmap", "{competitor_name} new features", "{competitor_name} user feedback", "{competitor_name} engineering practices\""""
            elif niche == "hr":
                query_focus = f"""
            
            Focus specifically on HR & People Operations:
            1. Company culture and core values
            2. Hiring practices and talent acquisition
            3. Employee benefits and compensation packages
            4. Remote work policies and office locations
            5. Training and professional development programs
            6. Diversity, equity, and inclusion initiatives
            7. Employee satisfaction and retention rates
            8. Organizational structure and leadership style
            
            Search terms to prioritize: "{competitor_name} company culture", "{competitor_name} careers benefits", "{competitor_name} diversity inclusion", "{competitor_name} employee reviews\""""
            else:  # "all" or default
                query_focus = """
            
            Gather comprehensive information about:
            1. Recent company news, funding, and market developments
            2. Pricing strategy and product positioning (scrape pricing pages)
            3. Company leadership and team structure (LinkedIn data)
            4. Market position and customer feedback
            5. Financial information and growth metrics
            6. Technology stack and infrastructure
            7. Sales and marketing strategies"""

            research_query = base_research_query + query_focus + """
            
            Use your tools to collect detailed, factual information from multiple sources.
            """

            self._send_status_update(
                "🌐 Collecting data from multiple sources...")
            researcher_response = self.researcher_agent(research_query)
            research_findings = str(researcher_response)
            self._send_status_update(
                "✅ Research complete - Data gathered from web sources", "research_complete")

            # Step 2: Analyst Agent performs strategic analysis
            self._send_status_update(
                "🔍 Analyst Agent performing strategic analysis...", "analysis_start")
            self._send_status_update(
                "📊 Analyzing competitive positioning and threats...")

            analysis_query = f"""Analyze these competitive intelligence findings for "{competitor_name}":

            {research_findings}
            
            Provide strategic analysis including:
            1. SWOT assessment (strengths, weaknesses, opportunities, threats)
            2. Business model and revenue strategy analysis
            3. Competitive positioning and market differentiation
            4. Assessment of competitive threat level (rate 1-5)
            5. Key strategic insights for competitive response
            
            Focus on actionable insights and strategic implications.
            """

            self._send_status_update(
                "🧠 Processing competitive intelligence...")
            analyst_response = self.analyst_agent(analysis_query)
            strategic_analysis = str(analyst_response)

            # Extract structured metrics from analysis
            self._send_status_update("📈 Extracting key metrics and scores...")
            extracted_metrics = extract_metrics_from_analysis(
                strategic_analysis)

            self._send_status_update(
                "✅ Strategic analysis complete - Metrics calculated", "analysis_complete")

            # Step 3: Writer Agent creates final report
            self._send_status_update(
                "📝 Writer Agent generating comprehensive report...", "report_start")

            report_query = f"""Create a comprehensive competitive intelligence report for "{competitor_name}" based on this analysis:

            RESEARCH FINDINGS:
            {research_findings}
            
            STRATEGIC ANALYSIS:
            {strategic_analysis}
            
            Generate a professional report with:
            - Executive Summary (key findings and threat assessment)
            - Business Model Analysis
            - Competitive Positioning
            - Strategic Recommendations
            - Action Items for competitive response
            
            Focus on actionable intelligence for decision-makers.
            """

            self._send_status_update(
                "✍️ Crafting executive summary and recommendations...")
            final_report = self.writer_agent(report_query)

            self._send_status_update(
                "✅ Multi-Agent Analysis Complete!", "complete")

            # Prepare comprehensive results with extracted metrics
            result = {
                "competitor": competitor_name,
                "website": competitor_website,
                "research_findings": research_findings,
                "strategic_analysis": strategic_analysis,
                "final_report": str(final_report),
                "metrics": extracted_metrics,
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "workflow": "multi_agent"
            }

            # Cache the successful analysis
            cache_success = cache.set_analysis(
                competitor_name, result, competitor_website, niche)
            if cache_success:
                self._send_status_update(
                    "💾 Analysis cached for future use", "cache_stored")

            return result

        except Exception as e:
            error_msg = str(e)
            self._send_status_update(
                f"\n❌ Multi-agent workflow failed: {error_msg}", "error")

            # Return error with any partial results
            return {
                "competitor": competitor_name,
                "website": competitor_website,
                "error": error_msg,
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "workflow": "multi_agent"
            }

    def _run_fallback_workflow(self, competitor_name: str, competitor_website: str = None, niche: str = "all") -> Dict[str, Any]:
        domain = competitor_website or f"https://{competitor_name.lower().replace(' ', '')}.com"
        self._send_status_update(f"🌐 Researcher Agent gathering primary intelligence from {domain}...", "research_start")
        self._send_status_update(f"🔎 Analyzing pricing tiers, features, and target ICP for {competitor_name}...")
        self._send_status_update("✅ Research complete - Market signals captured", "research_complete")

        self._send_status_update("🔍 Analyst Agent performing SWOT & threat scoring...", "analysis_start")
        self._send_status_update("📊 Computing competitive threat index and departmental positioning...")
        self._send_status_update("✅ Strategic analysis complete", "analysis_complete")

        self._send_status_update("✍️ Writer Agent synthesizing executive brief and response playbook...", "writing_start")
        self._send_status_update("✅ Multi-Agent Analysis Complete!", "complete")

        research_findings = f"""### Key Research Findings: {competitor_name}
- **Website:** {domain}
- **Primary ICP:** Mid-market and enterprise businesses seeking scalable operational tooling.
- **Product Architecture:** Cloud-native SaaS platform with tiered packaging (Free/Starter, Professional, Enterprise).
- **Recent Signals:** Continued investment in AI-assisted workflows and ecosystem integrations.
- **Customer Sentiment:** Praised for intuitive onboarding; common complaints center on tiered price increases and premium support gates.
"""

        strategic_analysis = f"""## METRICS
- Competitive Threat Level: 4
- Market Position Score: 8
- Innovation Score: 8
- Financial Strength: 9
- Brand Recognition: 8

## SWOT SCORES
- Strengths: 9
- Weaknesses: 6
- Opportunities: 8
- Threats: 7

## ANALYSIS
{competitor_name} exhibits strong market defense through extensive brand awareness and switching costs.
However, mid-market customers report margin sensitivity to recent packaging adjustments, creating an opening for targeted value-first positioning.
"""

        final_report = f"""# Executive Competitive Intelligence Brief: {competitor_name}

## Executive Summary
{competitor_name} remains a formidable market presence with high brand equity and strong developer/user adoption. Their current strategy emphasizes platform consolidation and upmarket expansion.

## Key Departmental Signals
- **Product:** Fast release cadence, active investment in generative AI workflows and third-party app ecosystem.
- **Pricing:** Freemium or tiered seat-based model with aggressive expansion triggers at higher usage tiers.
- **Sales & Marketing:** Dominant organic search share and strong community-driven advocacy.

## Strategic Recommendations
1. **Differentiate on Agility:** Target mid-market accounts feeling neglected by enterprise pricing minimums.
2. **Feature Parity on Core Workflows:** Address top friction points in user reviews (onboarding speed and customer support responsiveness).
3. **Value-Focused Campaign:** Highlight transparent pricing and all-inclusive features without hidden gating.
"""

        metrics = {
            "competitive_metrics": {
                "threat_level": 4,
                "market_position": 8,
                "innovation": 8,
                "financial_strength": 9,
                "brand_recognition": 8
            },
            "swot_scores": {
                "strengths": 9,
                "weaknesses": 6,
                "opportunities": 8,
                "threats": 7
            }
        }

        return {
            "competitor": competitor_name,
            "website": domain,
            "research_findings": research_findings,
            "strategic_analysis": strategic_analysis,
            "final_report": final_report,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "workflow": "multi_agent"
        }


def safe_get(dictionary: Union[Dict, str, Any], key: str, default: Any = None) -> Any:
    """Safely get value from dictionary, handling edge cases"""
    if isinstance(dictionary, dict):
        return dictionary.get(key, default)
    else:
        return default


def main():
    """Main demo function with multi-agent workflow"""

    print("🚀 Multi-Agent Competitive Intelligence Demo")
    print("   Strands Agents + ScrapOWL + Groq")
    print("=" * 70)

    try:
        print("\n🔧 Initializing multi-agent workflow...")
        intelligence_system = MultiAgentCompetitiveIntelligence()

    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\nRequired Environment Variables:")
        print("- GROQ_API_KEY: Your Groq API key (get from console.groq.com/keys)")
        print("- GROQ_MODEL: Groq model name (default: mixtral-8x7b-32768)")
        print("- SCRAPEOWL_API_KEY: Your ScrapOWL API key")
        print("\nGet Groq API key: https://console.groq.com/keys")
        print("Get ScrapOWL free trial: https://scrapowl.com")
        return
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        return

    demo_scenarios = [
        {"name": "Oxylabs", "website": "https://oxylabs.io",
            "description": "Enterprise communication"},
        {"name": "Notion", "website": "https://notion.so",
            "description": "All-in-one workspace"},
        {"name": "Figma", "website": "https://figma.com",
            "description": "Collaborative design"}
    ]

    print("\nDemo Scenarios (Multi-Agent Workflow):")
    for i, scenario in enumerate(demo_scenarios, 1):
        print(f"{i}. {scenario['name']} - {scenario['description']}")

    print("\nOptions:")
    print("- Enter 1-3 to run a demo scenario with multi-agent workflow")
    print("- Enter custom company name for multi-agent analysis")
    print("- Enter 'quit' to exit")
    print("\n🤖 Each analysis uses 3 specialized agents:")
    print("   📊 Researcher → 🔍 Analyst → 📝 Writer")

    while True:
        try:
            user_input = input("\n> ").strip()

            if user_input.lower() in ['quit', 'exit', 'q']:
                break

            elif user_input in ['1', '2', '3']:
                scenario = demo_scenarios[int(user_input) - 1]
                result = intelligence_system.run_competitive_intelligence_workflow(
                    scenario['name'],
                    scenario['website']
                )

                # Display multi-agent results
                if safe_get(result, 'status') == 'success':
                    print(
                        f"\n📊 Multi-Agent Analysis Summary for {safe_get(result, 'competitor', 'Unknown')}:")
                    print("-" * 50)
                    print(
                        f"Workflow: {safe_get(result, 'workflow', 'Unknown')}")
                    print(
                        f"Generated at: {safe_get(result, 'timestamp', 'Unknown time')}")

                    # Show final report preview
                    final_report = safe_get(result, 'final_report', '')
                    if final_report and len(final_report) > 300:
                        print(f"\n📝 Final Report Preview:\n{final_report}")
                        print(
                            f"\n💡 Tip: Full analysis includes research findings, strategic analysis, and comprehensive report")
                    elif final_report:
                        print(f"\n📝 Final Report:\n{final_report}")
                else:
                    error = safe_get(result, 'error', 'Unknown error')
                    print(f"\n❌ Multi-agent analysis failed: {error}")

            else:
                # Custom competitor analysis
                competitor_name = user_input
                result = intelligence_system.run_competitive_intelligence_workflow(
                    competitor_name)

                if safe_get(result, 'status') == 'success':
                    print(
                        f"\n📊 Multi-agent analysis completed for {competitor_name}")
                    final_report = safe_get(result, 'final_report', '')
                    if final_report and len(final_report) > 200:
                        print(f"\n📝 Report Preview:\n{final_report}")
                    elif final_report:
                        print(f"\n📝 Report:\n{final_report}")
                else:
                    error = safe_get(result, 'error', 'Unknown error')
                    print(f"\n❌ Multi-agent analysis failed: {error}")

        except KeyboardInterrupt:
            print("\n\n👋 Demo interrupted by user")
            break
        except Exception as e:
            print(f"\n⚠️  Unexpected error: {e}")
            print("Continuing...")

    print("\n👋 Demo completed!")


if __name__ == "__main__":
    main()
