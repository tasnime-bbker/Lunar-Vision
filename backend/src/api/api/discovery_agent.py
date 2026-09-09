#!/usr/bin/env python3
"""
Competitor Discovery Agent
Multi-platform search agent for discovering competitors based on business ideas
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
logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()]
)


def get_gemini_model():
    """Configure and return Groq model for discovery"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

    if not groq_api_key:
        raise ValueError("Groq configuration incomplete: GROQ_API_KEY required")

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


# Discovery Agent Prompts
DISCOVERY_RESEARCHER_PROMPT = """You are a Competitor Discovery Researcher Agent specialized in finding potential competitors based on business ideas.

Your role:
1) Business Idea Analysis: Break down the user's business idea into key components:
   - Core product/service offering
   - Target market and customer segments
   - Key value propositions
   - Business model (B2B, B2C, marketplace, SaaS, etc.)
   - Industry/vertical focus
   - Geographic scope

2) Multi-Platform Search Strategy: Search across diverse platforms to find competitors:
   - LinkedIn: Search for companies in similar industries, job postings for similar roles
   - Tech blogs and startup sites: TechCrunch, Product Hunt, AngelList, Crunchbase
   - Industry publications and trade sites
   - Twitter/X: Search for relevant hashtags, industry discussions
   - Google: General web search for similar products/services
   - Reddit: Relevant subreddits and discussions
   - GitHub: Open source projects in similar domains

3) Competitor Identification Criteria:
   - Direct competitors: Same product/service, same target market
   - Indirect competitors: Different approach, same problem/need
   - Adjacent competitors: Related products that could expand into your space
   - Emerging competitors: Early-stage startups in similar space

4) Information to Gather for Each Competitor:
   - Company name and website
   - Brief description of their offering
   - Target market/customers
   - Funding status and stage
   - Key differentiators
   - Market presence and traction
   - Recent news or developments

Search Terms Strategy:
- Use variations of the business idea keywords
- Search for problem-solving keywords (what problem does the idea solve?)
- Look for target market + solution combinations
- Search industry-specific terms and jargon
- Use competitor discovery keywords like "startup", "tool", "platform", "solution"

Deliverable:
Return a structured list of 8-12 potential competitors with:
- Company name and website
- Brief description (1-2 sentences)
- Competitor type (direct/indirect/adjacent)
- Confidence level (high/medium/low)
- Source where found
- Key differentiator from user's idea

CRITICAL: Focus on finding REAL companies with actual websites and presence, not hypothetical or made-up competitors.
"""

DISCOVERY_ANALYST_PROMPT = """You are a Discovery Analyst Agent for competitive landscape analysis.

Inputs: Business idea + Discovered competitors list

Your role:
1) Competitive Landscape Mapping:
   - Categorize competitors by type (direct, indirect, adjacent)
   - Assess market saturation level
   - Identify market gaps and opportunities
   - Analyze competitive positioning

2) Market Analysis:
   - Estimate total addressable market (TAM)
   - Identify market trends and growth patterns
   - Assess barriers to entry
   - Evaluate competitive intensity

3) Strategic Insights:
   - Market positioning opportunities
   - Differentiation strategies
   - Go-to-market considerations
   - Competitive advantages to leverage
   - Potential threats and challenges

4) Competitor Prioritization:
   - Rank competitors by threat level
   - Identify key players to watch
   - Highlight emerging threats
   - Note potential acquisition targets

Output Format:
## MARKET LANDSCAPE
- Market size and growth potential
- Competitive intensity (1-5 scale)
- Market maturity level
- Key trends affecting the space

## COMPETITOR ANALYSIS
- Direct competitors (3-5 most relevant)
- Indirect competitors (2-3 key players)
- Emerging threats (1-2 startups to watch)

## STRATEGIC OPPORTUNITIES
- Market gaps identified
- Differentiation opportunities
- Positioning recommendations
- Go-to-market insights

## COMPETITIVE INTELLIGENCE
- Key players to monitor closely
- Market trends to track
- Potential partnership opportunities
- Acquisition targets or threats

Keep analysis concise but actionable, focusing on strategic insights for the business idea.
"""

DISCOVERY_WRITER_PROMPT = """You are a Discovery Writer Agent creating competitor discovery reports.

Inputs: Business idea + Competitive landscape analysis

Structure your response as a comprehensive competitor discovery report:

## EXECUTIVE SUMMARY
- Brief overview of the competitive landscape
- Key findings and insights (3-4 bullets)
- Market opportunity assessment
- Strategic recommendations summary

## YOUR MARKET LANDSCAPE
- Market overview and size
- Competitive intensity assessment
- Key market trends and drivers
- Growth opportunities

## DISCOVERED COMPETITORS

### Direct Competitors
For each competitor:
- Company name and brief description
- Target market and positioning
- Key strengths and differentiators
- Potential threat level

### Indirect Competitors
- Companies solving similar problems differently
- Adjacent market players who could pivot
- Substitute solutions

### Emerging Players
- Early-stage startups in the space
- Companies to watch for future competition

## STRATEGIC INSIGHTS
- Market positioning opportunities
- Competitive advantages to leverage
- Differentiation strategies
- Go-to-market recommendations

## NEXT STEPS
- Competitors to analyze in detail
- Market research priorities
- Strategic decisions to make
- Monitoring and tracking plan

Keep the tone professional and actionable, suitable for entrepreneurs and business strategists.
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


class CompetitorDiscoveryAgent:
    """Multi-Agent Competitor Discovery Workflow"""

    def __init__(self, stream_callback: Optional[Callable] = None):
        """Initialize specialized agents for competitor discovery"""
        try:
            gemini_model = get_gemini_model()

            # Create callback handler for streaming
            callback_handler = StreamingCallbackHandler(
                stream_callback) if stream_callback else None

            # Discovery Researcher Agent with web capabilities
            configured_bright_data = get_configured_bright_data()
            self.researcher_agent = Agent(
                model=gemini_model,
                system_prompt=DISCOVERY_RESEARCHER_PROMPT,
                tools=[configured_bright_data],
                callback_handler=callback_handler
            )

            # Discovery Analyst Agent for landscape analysis
            self.analyst_agent = Agent(
                model=gemini_model,
                system_prompt=DISCOVERY_ANALYST_PROMPT,
                callback_handler=callback_handler
            )

            # Discovery Writer Agent for final report creation
            self.writer_agent = Agent(
                model=gemini_model,
                system_prompt=DISCOVERY_WRITER_PROMPT,
                callback_handler=callback_handler
            )

            self.stream_callback = stream_callback

            if not stream_callback:  # Only print if not in API mode
                print("✅ Competitor Discovery workflow initialized successfully!")
                print("   🔍 Discovery Researcher: Multi-platform competitor search")
                print("   📊 Discovery Analyst: Competitive landscape analysis")
                print("   📝 Discovery Writer: Strategic insights and recommendations")

        except Exception as e:
            if not stream_callback:
                print(f"❌ Discovery agent initialization failed: {e}")
            raise

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

    def discover_competitors(self, business_idea: str) -> Dict[str, Any]:
        """
        Multi-agent competitor discovery workflow with Redis caching and robust error handling
        """
        # Input validation
        if not business_idea or not business_idea.strip():
            return {
                "business_idea": business_idea,
                "error": "Business idea cannot be empty",
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "workflow": "competitor_discovery"
            }

        # Clean and validate business idea
        business_idea = business_idea.strip()
        if len(business_idea) < 10:
            return {
                "business_idea": business_idea,
                "error": "Business idea too short. Please provide more details (minimum 10 characters)",
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "workflow": "competitor_discovery"
            }

        if len(business_idea) > 1000:
            return {
                "business_idea": business_idea,
                "error": "Business idea too long. Please keep it under 1000 characters",
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "workflow": "competitor_discovery"
            }

        cache = get_cache()

        # Create cache key based on business idea
        import hashlib
        cache_key = f"discovery:{hashlib.md5(business_idea.encode()).hexdigest()}"

        # Check if we have cached discovery for this business idea
        try:
            cached_discovery = cache.get_analysis(cache_key)
            if cached_discovery:
                self._send_status_update(
                    f"🎯 Found cached competitor discovery for similar business idea", "cache_hit")
                return cached_discovery
        except Exception as cache_error:
            self._send_status_update(
                f"⚠️ Cache lookup failed, proceeding with fresh discovery: {str(cache_error)}", "cache_warning")

        self._send_status_update(
            f"🔍 Starting Competitor Discovery for business idea", "start")

        try:
            # Step 1: Discovery Researcher searches for competitors
            self._send_status_update(
                "🔍 Discovery Researcher searching across multiple platforms...", "research_start")

            research_query = f"""Discover potential competitors for this business idea:

            BUSINESS IDEA: "{business_idea}"

            MULTI-PLATFORM SEARCH STRATEGY:

            1. LINKEDIN SEARCH:
            - Search for companies in similar industries
            - Look for job postings with similar role requirements
            - Find companies posting about similar solutions
            - Search terms: [extract key industry terms from business idea]

            2. TECH BLOGS & STARTUP SITES:
            - TechCrunch: Search for similar product launches and funding announcements
            - Product Hunt: Find products solving similar problems
            - AngelList/Wellfound: Search for startups in related categories
            - Crunchbase: Industry and competitor research
            - Search for: "startup [problem domain]", "funding [industry]", "launch [product type]"

            3. TWITTER/X SEARCH:
            - Hashtags related to the industry and problem space
            - Discussions about similar tools/solutions
            - Startup announcements and product launches
            - Search: #[industry]tech #[problem]solution #startup[domain]

            4. GOOGLE WEB SEARCH:
            - "[problem] solution companies"
            - "[target market] [product type] tools"
            - "best [product category] for [use case]"
            - "[industry] software companies"
            - "alternatives to [similar known product]"

            5. REDDIT SEARCH:
            - r/entrepreneur, r/startups, r/[industry]
            - Product recommendation threads
            - "What tools do you use for [use case]?"
            - Industry-specific subreddits

            6. GITHUB SEARCH:
            - Open source projects solving similar problems
            - Companies contributing to related repositories
            - Search by programming language + problem domain

            COMPETITOR IDENTIFICATION CRITERIA:
            - Direct competitors: Same product/service, same target market
            - Indirect competitors: Different approach, same problem/need  
            - Adjacent competitors: Related products that could expand into your space
            - Emerging competitors: Early-stage startups in similar space

            For each competitor found, provide:
            - Company name and website URL
            - Brief description of their offering (1-2 sentences)
            - Target market/customer segment
            - Competitor type (direct/indirect/adjacent/emerging)
            - Confidence level (high/medium/low)
            - Source platform where found
            - Key differentiator from the business idea
            - Estimated company stage (startup/growth/established)

            Focus on finding 10-15 real companies with actual websites and market presence.
            Prioritize companies that are actively marketing and have recent online activity.
            """

            self._send_status_update(
                "🔍 LinkedIn: Searching for industry players and job postings...")
            self._send_status_update(
                "📰 Tech Blogs: Scanning TechCrunch, Product Hunt, AngelList...")
            self._send_status_update(
                "🐦 Twitter/X: Analyzing industry discussions and hashtags...")
            self._send_status_update(
                "🌐 Google: Comprehensive web search for solution providers...")
            self._send_status_update(
                "💬 Reddit: Checking community recommendations and discussions...")
            self._send_status_update(
                "👨‍💻 GitHub: Exploring open source projects and contributors...")

            try:
                researcher_response = self.researcher_agent(research_query)
                research_findings = str(researcher_response)

                # Validate research findings
                if not research_findings or len(research_findings) < 50:
                    raise ValueError(
                        "Research findings too limited - insufficient competitor data found")

                self._send_status_update(
                    "✅ Discovery research complete - Found potential competitors", "research_complete")
            except Exception as research_error:
                error_msg = f"Research phase failed: {str(research_error)}"
                self._send_status_update(f"❌ {error_msg}", "research_error")

                # Return partial results with error
                return {
                    "business_idea": business_idea,
                    "error": error_msg,
                    "competitors_found": "Research phase failed - unable to gather competitor data",
                    "timestamp": datetime.now().isoformat(),
                    "status": "error",
                    "workflow": "competitor_discovery"
                }

            # Step 2: Discovery Analyst analyzes the competitive landscape
            self._send_status_update(
                "📊 Discovery Analyst analyzing competitive landscape...", "analysis_start")

            analysis_query = f"""Analyze the competitive landscape for this business idea:

            BUSINESS IDEA: "{business_idea}"

            DISCOVERED COMPETITORS:
            {research_findings}

            Provide strategic analysis including:
            1. Market landscape assessment (size, growth, maturity)
            2. Competitive intensity and saturation level
            3. Competitor categorization and prioritization
            4. Market gaps and positioning opportunities
            5. Strategic insights and recommendations
            6. Key players to monitor and emerging threats

            Focus on actionable insights for market entry and competitive positioning.
            """

            self._send_status_update("🎯 Mapping competitive positioning...")
            self._send_status_update("📈 Analyzing market opportunities...")

            try:
                analyst_response = self.analyst_agent(analysis_query)
                strategic_analysis = str(analyst_response)

                # Validate analysis results
                if not strategic_analysis or len(strategic_analysis) < 50:
                    raise ValueError(
                        "Analysis results too limited - insufficient strategic insights")

                self._send_status_update(
                    "✅ Competitive landscape analysis complete", "analysis_complete")
            except Exception as analysis_error:
                error_msg = f"Analysis phase failed: {str(analysis_error)}"
                self._send_status_update(f"❌ {error_msg}", "analysis_error")

                # Continue with basic analysis using research findings only
                strategic_analysis = f"Analysis phase encountered issues: {error_msg}\n\nBasic competitive insights based on research findings:\n{research_findings[:500]}..."
                self._send_status_update(
                    "⚠️ Continuing with basic analysis", "analysis_fallback")

            # Step 3: Discovery Writer creates comprehensive report
            self._send_status_update(
                "📝 Discovery Writer generating strategic insights report...", "report_start")

            report_query = f"""Create a comprehensive competitor discovery report for this business idea:

            BUSINESS IDEA: "{business_idea}"

            RESEARCH FINDINGS:
            {research_findings}

            STRATEGIC ANALYSIS:
            {strategic_analysis}

            Generate a professional discovery report with:
            - Executive summary of competitive landscape
            - Detailed competitor profiles by category
            - Market opportunity assessment
            - Strategic positioning recommendations
            - Next steps and action items

            Focus on actionable intelligence for business strategy and market entry decisions.
            """

            self._send_status_update(
                "✍️ Creating competitor profiles and insights...")

            try:
                final_report = self.writer_agent(report_query)

                # Validate final report
                if not final_report or len(str(final_report)) < 100:
                    raise ValueError(
                        "Final report too brief - insufficient content generated")

                self._send_status_update(
                    "✅ Competitor Discovery Complete!", "complete")
            except Exception as writer_error:
                error_msg = f"Report generation failed: {str(writer_error)}"
                self._send_status_update(f"❌ {error_msg}", "writer_error")

                # Create fallback report
                final_report = f"""# Competitor Discovery Report
                
## Business Idea
{business_idea}

## Research Findings
{research_findings}

## Strategic Analysis  
{strategic_analysis}

## Note
Report generation encountered technical issues: {error_msg}
The above findings represent the core competitive intelligence gathered during the discovery process.
"""
                self._send_status_update(
                    "⚠️ Generated fallback report", "report_fallback")

            # Prepare comprehensive results
            result = {
                "business_idea": business_idea,
                "competitors_found": research_findings,
                "competitive_analysis": strategic_analysis,
                "discovery_report": str(final_report),
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "workflow": "competitor_discovery"
            }

            # Cache the successful discovery (only if status is success)
            if result.get("status") == "success":
                try:
                    cache_success = cache.set_analysis(cache_key, result)
                    if cache_success:
                        self._send_status_update(
                            "💾 Discovery results cached for future use", "cache_stored")
                except Exception as cache_error:
                    self._send_status_update(
                        f"⚠️ Failed to cache results: {str(cache_error)}", "cache_error")

            return result

        except Exception as e:
            error_msg = str(e)
            self._send_status_update(
                f"❌ Competitor discovery failed: {error_msg}", "error")

            # Return error with any partial results
            return {
                "business_idea": business_idea,
                "error": error_msg,
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "workflow": "competitor_discovery"
            }


def main():
    """Main demo function for competitor discovery"""
    print("🚀 Competitor Discovery Agent Demo")
    print("   Multi-platform competitor search and analysis")
    print("=" * 70)

    try:
        print("\n🔧 Initializing competitor discovery workflow...")
        discovery_system = CompetitorDiscoveryAgent()

    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\nRequired Environment Variables:")
        print("- GEMINI_API_KEY: Your Google AI Studio API key")
        print("- BRIGHTDATA_API_KEY: Your Bright Data API key")
        return
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        return

    demo_business_ideas = [
        "A project management tool specifically designed for remote teams with built-in video conferencing",
        "An AI-powered meal planning app that creates shopping lists based on dietary preferences",
        "A marketplace connecting freelance developers with startups for short-term projects",
        "A SaaS platform for small businesses to manage customer reviews across multiple platforms"
    ]

    print("\nDemo Business Ideas:")
    for i, idea in enumerate(demo_business_ideas, 1):
        print(f"{i}. {idea}")

    print("\nOptions:")
    print("- Enter 1-4 to run discovery for a demo business idea")
    print("- Enter your own business idea for discovery")
    print("- Enter 'quit' to exit")

    while True:
        try:
            user_input = input("\n> ").strip()

            if user_input.lower() in ['quit', 'exit', 'q']:
                break

            elif user_input in ['1', '2', '3', '4']:
                business_idea = demo_business_ideas[int(user_input) - 1]
                print(f"\n🔍 Discovering competitors for: {business_idea}")
                result = discovery_system.discover_competitors(business_idea)

                if result.get('status') == 'success':
                    print(f"\n📊 Discovery completed for: {business_idea}")
                    print("-" * 50)
                    discovery_report = result.get('discovery_report', '')
                    if discovery_report and len(discovery_report) > 300:
                        print(f"\n📝 Discovery Report:\n{discovery_report}")
                    else:
                        print("Discovery completed - check full results for details")
                else:
                    error = result.get('error', 'Unknown error')
                    print(f"\n❌ Discovery failed: {error}")

            else:
                # Custom business idea discovery
                business_idea = user_input
                print(f"\n🔍 Discovering competitors for: {business_idea}")
                result = discovery_system.discover_competitors(business_idea)

                if result.get('status') == 'success':
                    print(f"\n📊 Discovery completed!")
                    discovery_report = result.get('discovery_report', '')
                    if discovery_report and len(discovery_report) > 200:
                        print(f"\n📝 Report:\n{discovery_report}")
                else:
                    error = result.get('error', 'Unknown error')
                    print(f"\n❌ Discovery failed: {error}")

        except KeyboardInterrupt:
            print("\n\n👋 Demo interrupted by user")
            break
        except Exception as e:
            print(f"\n⚠️  Unexpected error: {e}")
            print("Continuing...")

    print("\n👋 Demo completed!")


if __name__ == "__main__":
    main()
