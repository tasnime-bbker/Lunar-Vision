from __future__ import annotations

import json
import re
import warnings
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pandas as pd


ROLE_PATTERNS = {
    "date": ["date", "time", "timestamp", "purchase", "order_purchase", "delivered", "estimated"],
    "revenue": ["revenue", "payment_value", "price", "amount", "total", "value", "sales"],
    "customer_id": ["customer", "customer_id", "customer_unique_id", "client", "buyer", "user_id"],
    "product_id": ["product", "product_id", "sku", "item", "product_code"],
    "order_id": ["order", "order_id", "invoice", "transaction", "purchase_id"],
    "category": ["category", "product_category", "department", "segment"],
    "review_score": ["review_score", "rating", "score", "stars", "sentiment"],
    "delivery_actual": ["delivered", "actual_delivery", "delivery_date", "received"],
    "delivery_estimated": ["estimated_delivery", "eta", "estimated", "promise"],
}


def to_snake_case(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_")
    return value.lower()


def infer_column_type(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    sample = series.dropna().astype(str).head(25)
    if sample.empty:
        return "categorical"

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        parsed_dates = pd.to_datetime(sample, errors="coerce")
    if parsed_dates.notna().mean() >= 0.6:
        return "date"

    unique_ratio = series.nunique(dropna=True) / max(len(series), 1)
    if unique_ratio > 0.8:
        return "id"
    return "categorical"


def score_role(column_name: str, series: pd.Series, role: str) -> float:
    name = column_name.lower()
    score = 0.0
    for pattern in ROLE_PATTERNS.get(role, []):
        if pattern in name:
            score += 0.5
    inferred_type = infer_column_type(series)
    if role == "date":
        if any(token in name for token in ["order_date", "purchase_date", "transaction_date", "order_purchase"]):
            score += 1.0
        if any(token in name for token in ["delivered", "estimated"]):
            score += 0.1
    if role == "date" and inferred_type == "date":
        score += 0.5
    if role in {"revenue", "review_score"} and inferred_type == "numeric":
        score += 0.4
    if role in {"customer_id", "product_id", "order_id"} and inferred_type in {"id", "categorical"}:
        score += 0.4
    if role == "delivery_actual" and any(token in name for token in ["delivered", "received"]):
        score += 0.5
    if role == "delivery_estimated" and any(token in name for token in ["estimated", "eta", "promise"]):
        score += 0.5
    return score


def detect_business_roles(dataframe: pd.DataFrame) -> Dict[str, Any]:
    normalized_columns = [to_snake_case(column) for column in dataframe.columns]
    column_map = dict(zip(dataframe.columns.tolist(), normalized_columns))

    roles: Dict[str, Optional[str]] = {
        "date": None,
        "revenue": None,
        "customer_id": None,
        "product_id": None,
        "order_id": None,
        "category": None,
        "review_score": None,
        "delivery_actual": None,
        "delivery_estimated": None,
    }

    column_details: Dict[str, Dict[str, Any]] = {}
    for original_name in dataframe.columns:
        series = dataframe[original_name]
        inferred_type = infer_column_type(series)
        normalized_name = column_map[original_name]
        if any(token in normalized_name for token in ["_id", "id"]):
            inferred_type = "id"
        column_details[original_name] = {
            "normalized_name": column_map[original_name],
            "column_type": inferred_type,
            "dtype": str(series.dtype),
            "null_count": int(series.isna().sum()),
            "unique_count": int(series.nunique(dropna=True)),
        }

    for role in roles:
        best_column = None
        best_score = 0.0
        for original_name in dataframe.columns:
            score = score_role(original_name, dataframe[original_name], role)
            if score > best_score:
                best_score = score
                best_column = original_name
        if best_score >= 0.5:
            roles[role] = best_column

    return {
        "column_details": column_details,
        "roles": roles,
    }


def detect_table_roles(tables: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    table_schemas: Dict[str, Any] = {}
    for table_name, dataframe in tables.items():
        table_schemas[table_name] = detect_business_roles(dataframe)
    return table_schemas


def safe_json_dumps(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2)
