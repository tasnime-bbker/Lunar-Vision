from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from src.utils.schema_utils import detect_business_roles, detect_table_roles


class SchemaAgent:
    """Detect schema and business meaning without computing KPIs."""

    def analyze_dataframe(self, dataframe: pd.DataFrame, source_name: str = "uploaded_csv") -> Dict[str, Any]:
        detection = detect_business_roles(dataframe)
        column_mapping = self._extract_column_mapping(detection.get("roles", {}))
        return {
            "dataset_type": "ecommerce",
            "source_name": source_name,
            "mode": "single_table",
            "columns": detection["column_details"],
            "column_mapping": column_mapping,
            "roles": detection["roles"],
            "tables": {},
        }

    def analyze_tables(self, tables: Dict[str, pd.DataFrame], source_name: str = "uploaded_database") -> Dict[str, Any]:
        table_detection = detect_table_roles(tables)
        primary_table = self._pick_primary_table(table_detection)
        primary_roles = table_detection.get(primary_table, {}).get("roles", {}) if primary_table else {}
        return {
            "dataset_type": "ecommerce",
            "source_name": source_name,
            "mode": "multi_table" if len(tables) > 1 else "single_table",
            "tables": table_detection,
            "primary_table": primary_table,
            "columns": table_detection.get(primary_table, {}).get("column_details", {}) if primary_table else {},
            "column_mapping": self._extract_column_mapping(primary_roles),
            "roles": primary_roles,
        }

    def _pick_primary_table(self, table_detection: Dict[str, Any]) -> str | None:
        priority_keywords = ["order", "order_items", "orders", "sales", "transactions", "payments"]
        for keyword in priority_keywords:
            for table_name in table_detection.keys():
                if keyword in table_name.lower():
                    return table_name
        return next(iter(table_detection.keys()), None)

    def _extract_column_mapping(self, roles: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "date": roles.get("date"),
            "revenue": roles.get("revenue"),
            "customer_id": roles.get("customer_id"),
            "product_id": roles.get("product_id"),
            "order_id": roles.get("order_id"),
        }
