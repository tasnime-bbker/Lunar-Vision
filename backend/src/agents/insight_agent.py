from __future__ import annotations

import json
from typing import Any, Dict, List

from src.utils.openrouter_client import OpenRouterAdapter


class InsightAgent:
    """Convert computed KPIs into AI-boosted business insights using OpenRouter."""

    def __init__(self):
        self.model = OpenRouterAdapter("business_analysis")

    def analyze(self, kpi_payload: Dict[str, Any]) -> Dict[str, Any]:
        kpis = kpi_payload.get("kpis", {}) if isinstance(kpi_payload, dict) else {}

        # 1. Run deterministic baseline
        baseline = self._deterministic_analyze(kpis)

        # 2. Enrich with OpenRouter AI for "Clear and Detailed" insights
        prompt = (
            "You are a Senior Ecommerce Analyst. Analyze the following KPI data and deterministic findings. "
            "Your goal is to provide deep, detailed, and clear strategic insights that go beyond simple numbers. "
            "Think about growth, risk, and operational efficiency. "
            "Return ONLY a JSON object with keys: 'insights', 'problems', 'opportunities'. "
            "Each value should be a list of highly detailed strings (20-40 words each).\n\n"
            f"KPI Data: {json.dumps(kpis, indent=2)}\n"
            f"Deterministic Baseline: {json.dumps(baseline, indent=2)}"
        )

        try:
            response = self.model.generate_content(prompt)
            ai_data = self._extract_json(response.text)
            if ai_data:
                return {
                    "insights": self._unique(baseline["insights"] + ai_data.get("insights", [])),
                    "problems": self._unique(baseline["problems"] + ai_data.get("problems", [])),
                    "opportunities": self._unique(baseline["opportunities"] + ai_data.get("opportunities", [])),
                }
        except Exception:
            pass

        return baseline

    def _deterministic_analyze(self, kpis: Dict[str, Any]) -> Dict[str, Any]:
        insights: List[str] = []
        problems: List[str] = []
        opportunities: List[str] = []

        orders = self._to_float(kpis.get("orders"))
        revenue = self._to_float(kpis.get("total_revenue"))
        aov = self._to_float(kpis.get("aov"))
        repeat_rate = self._to_float(kpis.get("repeat_purchase_rate"))
        late_delivery = self._to_float(kpis.get("late_delivery_rate"))
        avg_review = self._to_float(kpis.get("review_score_average"))
        customer_count = self._to_float(kpis.get("customer_count"))
        top_products = kpis.get("top_products") if isinstance(kpis.get("top_products"), list) else []

        if revenue is not None and orders is not None and orders > 0:
            avg_rev = revenue / orders
            insights.append(f"Business has generated total revenue of {revenue:,.2f} from {int(orders)} unique orders, averaging {avg_rev:,.2f} per transaction.")
            
            if revenue > 100000:
                insights.append("Significant revenue volume detected, suggesting a mature or high-velocity sales channel.")
            elif revenue > 0:
                insights.append("Early-stage revenue patterns observed; focus on scaling order frequency to stabilize cash flow.")

        if aov is not None:
            if aov > 150:
                insights.append(f"High Average Order Value ({aov:,.2f}) indicates a premium positioning or successful bundling strategy.")
            elif aov < 50:
                problems.append(f"Low Average Order Value ({aov:,.2f}) may lead to thin margins after shipping and acquisition costs.")
                opportunities.append("Implement 'Buy More, Save More' tiered discounts to lift the baseline AOV.")
            else:
                insights.append(f"Healthy Average Order Value of {aov:,.2f} provides a solid foundation for sustainable growth.")

        if top_products:
            leader = top_products[0]
            leader_name = leader.get("product_id") or leader.get("product") or leader.get("id") or "top product"
            insights.append(f"Product '{leader_name}' is your primary revenue engine.")

        if repeat_rate is not None:
            if repeat_rate < 0.2:
                problems.append(f"Critical retention risk: Only {repeat_rate:.0%} of customers are returning. This creates a reliance on expensive new acquisition.")
            elif repeat_rate >= 0.5:
                insights.append(f"Exceptional customer loyalty detected with a {repeat_rate:.0%} repeat rate; this is a major competitive moat.")

        if late_delivery is not None:
            if late_delivery > 0.2:
                problems.append(f"Severe operational bottleneck: {late_delivery:.0%} of orders are late, likely causing a spike in support tickets.")
            else:
                insights.append(f"Logistics performance is stable with a {late_delivery:.1%} late delivery rate.")

        if not problems and revenue is not None and revenue > 0:
             problems.append("No critical issues detected in the current data slice, indicating stable operations.")
        
        if not opportunities and top_products:
             opportunities.append("Optimize ad spend by focusing on the top-performing SKUs to maximize immediate ROI.")

        return {
            "insights": insights,
            "problems": problems,
            "opportunities": opportunities,
        }

    def _extract_json(self, text: str) -> Dict[str, Any] | None:
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start : end + 1])
        except:
            pass
        return None

    def _to_float(self, value: Any) -> float | None:
        try:
            return float(value) if value is not None else None
        except:
            return None

    def _unique(self, items: List[str]) -> List[str]:
        seen = set()
        return [x for x in items if x and not (x in seen or seen.add(x))]
