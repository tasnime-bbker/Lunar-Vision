from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from src.utils.openrouter_client import OpenRouterAdapter


class StrategicAnalystAgent:
    """Agent that produces executive scorecards and SWOT analysis from business KPIs and data schema."""

    def __init__(self):
        try:
            self.model = OpenRouterAdapter("business_analysis")
        except Exception:
            self.model = None

    def analyze(self, kpi_payload: Dict[str, Any], schema_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Compute strategic scores and SWOT analysis grounded in computed metrics."""
        kpis = kpi_payload.get("kpis", {}) if isinstance(kpi_payload, dict) else {}
        baseline = self._deterministic_strategic_analysis(kpis, schema_payload)

        if not self.model:
            return baseline

        prompt = (
            "You are a Chief Strategy Officer evaluating a company based on real e-commerce metrics. "
            "Analyze the KPIs and deterministic baseline provided below. "
            "Return ONLY a JSON object with: "
            "1. 'scores': object with integer values 1-10 for 'market_position', 'innovation', 'financial_strength', 'brand_health'. "
            "2. 'swot': object with string arrays for 'strengths', 'weaknesses', 'opportunities', 'threats' (3-4 concise points each).\n\n"
            f"KPIs: {json.dumps(kpis, indent=2)}\n"
            f"Baseline: {json.dumps(baseline, indent=2)}"
        )

        try:
            response = self.model.generate_content(prompt)
            ai_data = self._extract_json(response.text)
            if ai_data and "scores" in ai_data and "swot" in ai_data:
                return {
                    "scores": self._validate_scores(ai_data.get("scores", baseline["scores"])),
                    "swot": self._validate_swot(ai_data.get("swot", baseline["swot"])),
                    "summary": ai_data.get("summary", baseline.get("summary", "")),
                }
        except Exception:
            pass

        return baseline

    def _deterministic_strategic_analysis(self, kpis: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        revenue = float(kpis.get("total_revenue") or 0.0)
        orders = int(kpis.get("orders") or 0)
        aov = float(kpis.get("aov") or 0.0)
        repeat_rate = float(kpis.get("repeat_purchase_rate") or 0.0)
        late_delivery = float(kpis.get("late_delivery_rate") or 0.0)
        customer_count = int(kpis.get("customer_count") or 0)

        # 1. Market Position (1-10): Based on orders volume and customer scale
        if orders > 5000 or customer_count > 4000:
            market_position = 8.5
        elif orders > 1000 or customer_count > 800:
            market_position = 7.0
        elif orders > 200:
            market_position = 6.0
        else:
            market_position = 4.5

        # 2. Financial Strength (1-10): Based on revenue and AOV
        if revenue > 500000 or aov > 150:
            financial_strength = 8.5
        elif revenue > 100000 or aov > 80:
            financial_strength = 7.5
        elif revenue > 20000:
            financial_strength = 6.5
        else:
            financial_strength = 5.0

        # 3. Brand Health (1-10): Based on repeat purchase rate and delivery satisfaction
        if repeat_rate >= 0.35 and late_delivery < 0.08:
            brand_health = 8.8
        elif repeat_rate >= 0.20 and late_delivery < 0.15:
            brand_health = 7.2
        elif repeat_rate < 0.15:
            brand_health = 5.5
        else:
            brand_health = 6.5

        # 4. Innovation (1-10): Product velocity & catalog diversity
        top_products = kpis.get("top_products") or []
        innovation = 7.5 if len(top_products) >= 5 else 6.0

        strengths: List[str] = []
        weaknesses: List[str] = []
        opportunities: List[str] = []
        threats: List[str] = []

        if revenue > 50000:
            strengths.append(f"Strong top-line revenue velocity (${revenue:,.2f}) with proven market demand.")
        else:
            strengths.append("Agile sales operations with low barrier to testing new product iterations.")

        if aov >= 75:
            strengths.append(f"Solid basket value with an Average Order Value of ${aov:,.2f}.")
        else:
            weaknesses.append(f"Compressed margins due to lower basket size (${aov:,.2f} AOV).")

        if repeat_rate >= 0.25:
            strengths.append(f"Healthy customer stickiness ({repeat_rate:.1%} repeat purchase rate).")
        else:
            weaknesses.append(f"Vulnerability to high CAC due to modest customer retention ({repeat_rate:.1%}).")
            opportunities.append("Deploy automated lifecycle marketing and VIP tiering to lift customer lifetime value.")

        if late_delivery > 0.12:
            weaknesses.append(f"Fulfillment drag: {late_delivery:.1%} late delivery rate hurts brand sentiment.")
            threats.append("Customer churn towards competitors with faster standard delivery SLAs.")
        else:
            strengths.append("Reliable fulfillment operations with minimal delivery exceptions.")

        opportunities.append("Expand cross-sell and up-sell bundles around the most profitable hero SKUs.")
        opportunities.append("Leverage multichannel automated ad funnels to lower customer acquisition cost.")
        threats.append("Rising paid advertising costs eroding margins unless organic and email channels expand.")
        threats.append("Macro pricing pressures in high-volume competitive commodity categories.")

        return {
            "scores": {
                "market_position": round(market_position, 1),
                "innovation": round(innovation, 1),
                "financial_strength": round(financial_strength, 1),
                "brand_health": round(brand_health, 1),
            },
            "swot": {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "opportunities": opportunities,
                "threats": threats,
            },
            "summary": "Deterministic multi-dimensional strategic health assessment."
        }

    def _validate_scores(self, scores: Dict[str, Any]) -> Dict[str, float]:
        validated = {}
        for key in ["market_position", "innovation", "financial_strength", "brand_health"]:
            val = scores.get(key, 7.0)
            try:
                num = float(val)
                validated[key] = max(1.0, min(10.0, round(num, 1)))
            except (ValueError, TypeError):
                validated[key] = 7.0
        return validated

    def _validate_swot(self, swot: Dict[str, Any]) -> Dict[str, List[str]]:
        validated = {}
        for key in ["strengths", "weaknesses", "opportunities", "threats"]:
            items = swot.get(key, [])
            if isinstance(items, list):
                validated[key] = [str(x) for x in items if x]
            else:
                validated[key] = [str(items)]
        return validated

    def _extract_json(self, text: str) -> Dict[str, Any] | None:
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
        except Exception:
            pass
        return None
