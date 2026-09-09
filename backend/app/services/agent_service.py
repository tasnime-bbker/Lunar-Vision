from functools import lru_cache
from typing import Any, Dict, List, Optional
import base64
import io
import sqlite3
import tempfile

import pandas as pd

from src.agent_core import MultiAgentCodingAI  # noqa: E402
from src.types import AgentType  # noqa: E402


class InMemoryUpload(io.BytesIO):
    """Simple in-memory file object compatible with legacy file handlers."""

    def __init__(self, name: str, raw_bytes: bytes):
        super().__init__(raw_bytes)
        self.name = name
        self.size = len(raw_bytes)


def _parse_agent_type(agent_type: Optional[str]) -> Optional[AgentType]:
    if not agent_type:
        return None

    # Support enum values and enum names from client input.
    normalized = agent_type.strip()
    for enum_item in AgentType:
        if normalized == enum_item.value or normalized.upper() == enum_item.name:
            return enum_item
    return None


@lru_cache(maxsize=1)
def get_agent_system() -> MultiAgentCodingAI:
    return MultiAgentCodingAI()


def _decode_uploaded_files(uploaded_files: Optional[List[Dict[str, Any]]]) -> List[InMemoryUpload]:
    decoded_files: List[InMemoryUpload] = []
    for file_item in uploaded_files or []:
        try:
            name = file_item.get("name", "uploaded_file")
            base64_payload = file_item.get("content_base64", "")
            raw_bytes = base64.b64decode(base64_payload)
            decoded_files.append(InMemoryUpload(name=name, raw_bytes=raw_bytes))
        except Exception:
            continue
    return decoded_files


def _summarize_csv_file(file_obj: InMemoryUpload) -> str:
    file_obj.seek(0)
    df = pd.read_csv(file_obj)
    preview_rows = df.head(10).to_string(index=False)
    return (
        f"CSV File: {file_obj.name}\n"
        f"Rows: {len(df)}, Columns: {len(df.columns)}\n"
        f"Columns: {', '.join(df.columns.tolist())}\n"
        f"Preview:\n{preview_rows}\n"
    )


def _summarize_sqlite_file(file_obj: InMemoryUpload) -> str:
    file_obj.seek(0)
    raw_bytes = file_obj.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".db") as temp_db:
        temp_db.write(raw_bytes)
        temp_path = temp_db.name

    sections: List[str] = [f"SQLite File: {file_obj.name}"]
    conn = sqlite3.connect(temp_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        table_names = [row[0] for row in cursor.fetchall()]

        if not table_names:
            return f"SQLite File: {file_obj.name}\nNo user tables found."

        sections.append(f"Tables: {', '.join(table_names)}")
        for table in table_names[:5]:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]

            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]

            cursor.execute(f"SELECT * FROM {table} LIMIT 5")
            sample_rows = cursor.fetchall()
            sample_text = "\n".join(str(row) for row in sample_rows) if sample_rows else "(no rows)"

            sections.append(
                f"Table: {table}\n"
                f"Columns: {', '.join(columns)}\n"
                f"Rows: {row_count}\n"
                f"Sample:\n{sample_text}"
            )
    finally:
        conn.close()

    return "\n\n".join(sections)


def _build_file_context(files: List[InMemoryUpload]) -> str:
    summaries: List[str] = []
    for file_obj in files:
        lower_name = file_obj.name.lower()
        try:
            if lower_name.endswith(".csv"):
                summaries.append(_summarize_csv_file(file_obj))
            elif lower_name.endswith((".db", ".sqlite", ".sqlite3")):
                summaries.append(_summarize_sqlite_file(file_obj))
            else:
                summaries.append(f"File: {file_obj.name} ({file_obj.size} bytes)")
        except Exception as exc:
            summaries.append(f"File: {file_obj.name} could not be parsed ({exc})")

    context = "\n\n".join(summaries)
    # Prevent extremely large prompts.
    return context[:10000]


def run_chat(
    message: str,
    agent_type: Optional[str] = None,
    session_id: Optional[str] = None,
    chat_history: Optional[list] = None,
    uploaded_files: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    system = get_agent_system()
    selected_agent = _parse_agent_type(agent_type)
    decoded_files = _decode_uploaded_files(uploaded_files)

    enriched_message = message
    if decoded_files:
        file_context = _build_file_context(decoded_files)
        enriched_message = (
            f"{message}\n\n"
            "Use the following uploaded file context when answering.\n"
            f"{file_context}"
        )
        for file_obj in decoded_files:
            file_obj.seek(0)

    context = {
        "chat_history": chat_history or []
    }

    response = system.route_request(
        request=enriched_message,
        agent_type=selected_agent,
        context=context,
        session_id=session_id,
        files=decoded_files,
    )

    return {
        "content": response.content,
        "success": response.success,
        "agent_type": response.agent_type,
        "execution_time": response.execution_time,
        "metadata": response.metadata,
        "error": response.error_message or response.error,
    }
