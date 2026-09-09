from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from src.agents.content_agent import ContentAgent
from src.agents.insight_agent import InsightAgent
from src.agents.kpi_agent import KPIAgent
from src.agents.marketing_agent import MarketingAgent
from src.agents.schema_agent import SchemaAgent
from src.agents.strategic_analyst_agent import StrategicAnalystAgent
from src.utils.csv_loader import LoadedDataset, load_uploaded_file


GLOBAL_SYSTEM_SPEC = """
This system is a multi-agent AI analytics platform specialized in E-commerce datasets (Olist dataset format).

The system MUST:
- Accept CSV files with unknown schema
- Automatically detect column meanings
- Restrict KPI computation to detected valid columns
- Never hallucinate missing fields
- Pass structured JSON between agents only
- Focus on e-commerce business insights
""".strip()


@dataclass
class PipelineResult:
    schema: Dict[str, Any]
    kpis: Dict[str, Any]
    insights: Dict[str, Any]
    strategies: Dict[str, Any]
    content: Dict[str, Any]
    explainability: Dict[str, Any]


class EcommercePipeline:
    """Orchestrates the ecommerce analytics workflow.

    DO NOT:
    - hardcode column names
    - assume schema
    - compute KPIs before schema detection
    - pass raw CSV to LLM

    ALWAYS:
    - use SchemaAgent first
    - use structured JSON between agents
    - restrict KPI logic to detected columns

    Architecture:
    CSV/Excel/SQLite -> SchemaAgent -> KPIAgent -> InsightAgent -> MarketingAgent -> ContentAgent
    """

    def __init__(self):
        self.schema_agent = SchemaAgent()
        self.kpi_agent = KPIAgent()
        self.insight_agent = InsightAgent()
        self.marketing_agent = MarketingAgent()
        self.content_agent = ContentAgent()
        self.strategic_agent = StrategicAnalystAgent()

    def run(self, file_name: str, raw_bytes: bytes, prompt: str = "") -> Dict[str, Any]:
        loaded = load_uploaded_file(file_name, raw_bytes)
        if loaded.dataframe is not None:
            schema = self.schema_agent.analyze_dataframe(loaded.dataframe, source_name=file_name)
            payload = {"kind": "single_table", "dataframe": loaded.dataframe}
        else:
            schema = self.schema_agent.analyze_tables(loaded.tables or {}, source_name=file_name)
            payload = {"kind": "multi_table", "tables": loaded.tables or {}}

        kpis = self.kpi_agent.compute(payload, schema)
        insights = self.insight_agent.analyze(kpis)
        strategies = self.marketing_agent.strategize(insights)
        content = self.content_agent.generate(strategies)
        strategy_report = self.strategic_agent.analyze(kpis, schema)

        return {
            "file_name": file_name,
            "schema": schema,
            "kpis": kpis,
            "insights": insights,
            "strategies": strategies,
            "content": content,
            "strategy_report": strategy_report,
            "strategic_report": strategy_report,
            "explainability": kpis.get("explainability", {}),
            "dashboard": self._build_dashboard(schema, kpis, insights, strategies, content, strategy_report),
            "note": prompt.strip() or "Ecommerce pipeline executed successfully.",
        }

    def _build_dashboard(self, schema: Dict[str, Any], kpis: Dict[str, Any], insights: Dict[str, Any], strategies: Dict[str, Any], content: Dict[str, Any], strategy_report: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "schema_summary": {
                "dataset_type": schema.get("dataset_type"),
                "mode": schema.get("mode"),
                "primary_table": schema.get("primary_table"),
                "roles": schema.get("roles", {}),
            },
            "kpi_summary": kpis.get("kpis", {}),
            "insight_summary": insights,
            "strategy_summary": strategies,
            "content_summary": content,
            "strategic_report": strategy_report,
        }


def run_pipeline(csv_file_name: str, raw_bytes: bytes, prompt: str = "") -> Dict[str, Any]:
    return EcommercePipeline().run(csv_file_name, raw_bytes, prompt=prompt)
