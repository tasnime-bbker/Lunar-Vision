from __future__ import annotations

import json
from typing import Any, Dict, List

from src.utils.openrouter_client import OpenRouterAdapter


class MarketingAgent:
    """Generate AI-powered actionable growth strategies grounded in specific project data."""

    def __init__(self):
        self.model = OpenRouterAdapter("marketing_strategy")

    def strategize(self, insight_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize insights into high-impact marketing campaigns using AI."""
        
        # 1. Prepare deterministic fallback (Ground Truth)
        fallback = self._generate_fallback_strategies(insight_payload)
        
        # 2. Enrich with OpenRouter for detailed, data-tailored execution plans
        prompt = (
            "You are an expert Ecommerce Growth Strategist. "
            "Analyze the provided business insights, problems, and opportunities. "
            "Your goal is to generate 3-4 highly detailed and tailored marketing strategies. "
            "Each strategy MUST be executable, mention specific segments/channels, and reference the underlying data. "
            "Return ONLY a JSON object with a key 'strategies' which is a list of objects. "
            "Each object must have: 'strategy' (detailed action, 30-50 words) and 'references_insight' (short string).\n\n"
            f"Insights Context:\n{json.dumps(insight_payload, indent=2)}"
        )

        try:
            response = self.model.generate_content(prompt)
            ai_parsed = self._extract_json(response.text)
            if ai_parsed and "strategies" in ai_parsed:
                # Merge AI strategies with our baseline logic for maximum depth
                return {
                    "strategies": self._normalize_strategies(ai_parsed["strategies"] + fallback["strategies"])
                }
        except Exception:
            # Fallback to deterministic logic if AI fails
            pass

        return fallback

    def _generate_fallback_strategies(self, insight_payload: Dict[str, Any]) -> Dict[str, Any]:
        insights = insight_payload.get("insights", [])
        problems = insight_payload.get("problems", [])
        ops = insight_payload.get("opportunities", [])
        
        strategies: List[Dict[str, str]] = []

        # Strategy 1: Data-driven Acquisition/Growth
        if insights:
            primary = insights[0]
            if "Revenue reached" in primary or "Total revenue" in primary:
                strategies.append({
                    "strategy": f"Scale performance marketing budget by 10-15% immediately to capitalize on the verified revenue velocity identified in the data.",
                    "references_insight": primary,
                })
            else:
                strategies.append({
                    "strategy": "Optimize top-funnel organic traffic by aligning landing page content with your highest performing product identifiers.",
                    "references_insight": primary,
                })

        # Strategy 2: Targeted Retention Remediation
        if problems:
            worst = problems[0]
            if "retention" in worst.lower() or "repeat" in worst.lower():
                strategies.append({
                    "strategy": "Launch an automated 'Win-Back' email sequence for inactive segments with a tiered discount (15-20%) to bridge the retention gap.",
                    "references_insight": worst,
                })
            else:
                strategies.append({
                    "strategy": "Implement a rigorous post-purchase audit to resolve the primary friction points identified in your operational metrics.",
                    "references_insight": worst,
                })

        return {"strategies": strategies}

    def _normalize_strategies(self, strategies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen_text = set()
        unique = []
        for s in strategies:
            txt = s.get("strategy", "").strip()
            if txt and txt not in seen_text:
                seen_text.add(txt)
                unique.append(s)
        return unique[:6] # Cap at 6 high-quality strategies

    def _extract_json(self, text: str) -> Dict[str, Any] | None:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            return None

    def _normalize(self, payload: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("strategies", fallback["strategies"])
        return payload
