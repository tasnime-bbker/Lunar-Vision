from __future__ import annotations

import io
import sqlite3
import tempfile
from dataclasses import dataclass
from typing import Dict, List, Tuple

import pandas as pd


@dataclass
class LoadedDataset:
    kind: str
    file_name: str
    dataframe: pd.DataFrame | None = None
    tables: Dict[str, pd.DataFrame] | None = None


def load_csv_from_bytes(file_name: str, raw_bytes: bytes) -> LoadedDataset:
    buffer = io.BytesIO(raw_bytes)
    dataframe = pd.read_csv(buffer)
    dataframe.columns = normalize_dataframe_columns(dataframe)
    return LoadedDataset(kind="csv", file_name=file_name, dataframe=dataframe)


def load_excel_from_bytes(file_name: str, raw_bytes: bytes) -> LoadedDataset:
    buffer = io.BytesIO(raw_bytes)
    dataframe = pd.read_excel(buffer)
    dataframe.columns = normalize_dataframe_columns(dataframe)
    return LoadedDataset(kind="excel", file_name=file_name, dataframe=dataframe)


def load_sqlite_from_bytes(file_name: str, raw_bytes: bytes) -> LoadedDataset:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".db") as temp_file:
        temp_file.write(raw_bytes)
        temp_path = temp_file.name

    tables: Dict[str, pd.DataFrame] = {}
    connection = sqlite3.connect(temp_path)
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        table_names = [row[0] for row in cursor.fetchall()]
        for table_name in table_names:
            try:
                frame = pd.read_sql_query(f'SELECT * FROM "{table_name}"', connection)
                frame.columns = normalize_dataframe_columns(frame)
                tables[table_name] = frame
            except Exception:
                continue
    finally:
        connection.close()

    return LoadedDataset(kind="sqlite", file_name=file_name, tables=tables)


def load_uploaded_file(file_name: str, raw_bytes: bytes) -> LoadedDataset:
    lower_name = file_name.lower()
    if lower_name.endswith(".csv"):
        return load_csv_from_bytes(file_name, raw_bytes)
    if lower_name.endswith(".xlsx"):
        return load_excel_from_bytes(file_name, raw_bytes)
    if lower_name.endswith((".db", ".sqlite", ".sqlite3")):
        return load_sqlite_from_bytes(file_name, raw_bytes)
    raise ValueError(f"Unsupported file type: {file_name}")


def normalize_dataframe_columns(dataframe: pd.DataFrame) -> List[str]:
    normalized = (
        dataframe.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9]+", "_", regex=True)
        .str.replace(r"_+", "_", regex=True)
        .str.strip("_")
    )
    dataframe.columns = normalized
    return normalized.tolist()
