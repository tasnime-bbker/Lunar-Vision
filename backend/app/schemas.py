from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role (user or assistant)")
    content: str = Field(..., description="Message content")


class UploadedFile(BaseModel):
    name: str = Field(..., description="Original file name")
    content_base64: str = Field(..., description="Base64-encoded file content")
    mime_type: Optional[str] = Field(default=None, description="Browser-provided MIME type")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt")
    agent_type: Optional[str] = Field(
        default=None,
        description="Optional agent type override"
    )
    session_id: Optional[str] = Field(default=None)
    chat_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    uploaded_files: Optional[List[UploadedFile]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    content: str
    success: bool
    agent_type: Optional[str] = None
    execution_time: float = 0.0
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class EcommerceAnalyzeRequest(BaseModel):
    prompt: Optional[str] = Field(default="", description="Optional analysis prompt")
    uploaded_files: List[UploadedFile] = Field(default_factory=list)


class EcommerceAnalyzeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    file_name: str
    schema_data: Dict[str, Any] = Field(..., alias="schema")
    kpis: Dict[str, Any]
    insights: Dict[str, Any]
    strategies: Dict[str, Any]
    content: Dict[str, Any] = Field(default_factory=dict)
    strategic_report: Optional[Dict[str, Any]] = None
    strategy_report: Optional[Dict[str, Any]] = None
    explainability: Dict[str, Any] = Field(default_factory=dict)
    dashboard: Dict[str, Any] = Field(default_factory=dict)
    note: str = ""
