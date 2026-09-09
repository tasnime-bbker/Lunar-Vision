Ecommerce pipeline modules live here.

System design contract:

- Accept unknown ecommerce CSV/Excel/SQLite schemas.
- Detect semantic column roles in SchemaAgent before any KPI logic.
- Compute KPIs only from schema-mapped columns.
- Pass only structured JSON from agent to agent.
- Never send raw tabular data directly to LLM stages in this pipeline.

Pipeline order:

SchemaAgent -> KPIAgent -> InsightAgent -> MarketingAgent -> ContentAgent
