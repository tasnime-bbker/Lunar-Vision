from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from src.utils.openrouter_client import OpenRouterAdapter


class ContentAgent:
    """Agent that creates ready-to-use marketing copy and visual concepts from growth strategies."""

    def __init__(self):
        try:
            self.model = OpenRouterAdapter("content_creation")
        except Exception:
            self.model = None

    def generate(self, strategy_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Generate multichannel marketing content based on strategy recommendations."""
        strategies = strategy_payload.get("strategies", []) if isinstance(strategy_payload, dict) else []
        baseline = self._generate_baseline_content(strategies)

        if not self.model:
            return baseline

        prompt = (
            "You are an expert Ecommerce Copywriter and Content Creator. "
            "Based on the following marketing strategies, generate concise, high-converting copy across channels. "
            "Return ONLY a JSON object with keys: 'instagram', 'email', 'ads', 'linkedin', 'sms', 'tiktok', 'visuals'. "
            "For 'email', include subject and body. For 'visuals', include visual concept and art direction.\n\n"
            f"Strategies Context:\n{json.dumps(strategies, indent=2)}"
        )

        try:
            response = self.model.generate_content(prompt)
            ai_data = self._extract_json(response.text)
            if ai_data and isinstance(ai_data, dict):
                merged = {**baseline, **{k: v for k, v in ai_data.items() if v}}
                return merged
        except Exception:
            pass

        return baseline

    def _generate_baseline_content(self, strategies: List[Dict[str, Any]]) -> Dict[str, Any]:
        top_strategy = "Accelerate high-impact retention and growth channels"
        if strategies:
            first = strategies[0]
            if isinstance(first, dict):
                top_strategy = first.get("strategy", top_strategy)
            elif isinstance(first, str):
                top_strategy = first

        return {
            "instagram": (
                f"Elevate your routine with curated essentials designed for quality. "
                f"Discover why thousands of customers make the switch every day. "
                f"Link in bio to explore the collection. #QualityFirst #SmartShopping"
            ),
            "email": {
                "subject": "Exclusive update: handcrafted just for your journey",
                "body": (
                    f"Hi there,\n\n"
                    f"We noticed you appreciate quality that lasts. Based on our latest community favorites, "
                    f"we have put together a dedicated selection tailored to what you love most.\n\n"
                    f"Take advantage of complimentary priority delivery on your next order.\n\n"
                    f"Shop the Curated Edit -> [Link]\n\nWarm regards,\nThe Team"
                ),
            },
            "ads": (
                f"Tired of settling for average? Experience the difference premium design makes. "
                f"Loved by over 10,000 satisfied customers. Shop now for 15% off your first order."
            ),
            "linkedin": (
                f"In high-growth e-commerce, customer retention and operational consistency "
                f"are the ultimate differentiators. By aligning our product offerings directly "
                f"with customer demand signals, we continue to see sustainable lifetime value expansion."
            ),
            "sms": (
                f"VIP Flash: Enjoy 15% off your next order today only! Use code LUNAR15 at checkout: https://lunar.shop/vip Reply STOP to opt out."
            ),
            "tiktok": (
                f"Hook: 3 things you didn't know your daily routine was missing.\n"
                f"Body: Watch how easily this solves your #1 frustration in under 30 seconds.\n"
                f"CTA: Tap the basket below before it sells out again!"
            ),
            "visuals": (
                f"Core Concept: Clean, minimalist studio composition with natural side lighting.\n"
                f"Color Palette: Warm neutral backdrop, deep slate accents, warm gold typography.\n"
                f"Overlay Text: 'Designed for Performance. Made for Everyday.'\n"
                f"Format: 4:5 vertical portrait with generous negative space."
            ),
            "campaign_suggestions": [
                {
                    "title": "VIP Retention Lift",
                    "audience": "Returning customers",
                    "product_focus": "Top performing SKUs",
                    "angle": "trending",
                    "rationale": "High repeat purchase value identified in business signals."
                },
                {
                    "title": "AOV Boost Bundle",
                    "audience": "New customers",
                    "product_focus": "Complementary accessories",
                    "angle": "less_known",
                    "rationale": "Increases basket size and introduces higher margin items."
                },
                {
                    "title": "Win-Back Sequence",
                    "audience": "At-risk customers",
                    "product_focus": "Best sellers",
                    "angle": "trending",
                    "rationale": "Addresses retention drop-off with targeted incentive."
                }
            ]
        }

    def _extract_json(self, text: str) -> Dict[str, Any] | None:
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
        except Exception:
            pass
        return None
