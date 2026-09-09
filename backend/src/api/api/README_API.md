# Competitive Intelligence API

FastAPI-based REST API for competitive intelligence analysis using multi-agent AI with real-time streaming.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GROQ_API_KEY="your_key"
export GROQ_MODEL="mixtral-8x7b-32768"
export BRIGHTDATA_API_KEY="your_key"
export REDIS_ENABLED=false

# Start server
python app.py
```

**URLs:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Endpoints

### Health & Status

```bash
GET /health              # Health check
GET /status              # API and cache status
```

### Competitive Analysis

```bash
POST /analyze            # Run analysis (non-streaming)
POST /analyze/stream     # Run analysis with real-time updates
```

**Request body:**
```json
{
  "competitor_name": "Slack",
  "competitor_website": "https://slack.com",
  "niche": "all",
  "stream": true
}
```

**Niche options:** `all`, `it`, `sales`, `marketing`, `finance`, `product`, `hr`

### Competitor Discovery

```bash
POST /discover/competitors         # Find competitors from business idea
POST /discover/competitors/stream  # With streaming updates
```

**Request body:**
```json
{
  "business_idea": "A project management tool for remote teams",
  "stream": true
}
```

### Session Management

```bash
GET /sessions              # List active sessions
GET /sessions/{session_id} # Get session details
GET /demo-scenarios        # Get demo test cases
```

### Cache Management

```bash
GET /cache/stats                        # Cache statistics
DELETE /cache/competitor/{name}         # Clear competitor cache
POST /cache/refresh/{name}              # Force refresh
```

## Streaming Events

The streaming endpoints use Server-Sent Events (SSE):

| Event Type | Description |
|------------|-------------|
| session_start | Analysis initiated |
| status_update | Progress updates |
| tool_call | Tool execution |
| complete | Analysis finished |
| error | Error occurred |
| heartbeat | Keep-alive |

## Usage Examples

**Python:**
```python
import requests

response = requests.post("http://localhost:8000/analyze", json={
    "competitor_name": "Slack",
    "competitor_website": "https://slack.com",
    "niche": "all"
})
print(response.json())
```

**cURL:**
```bash
curl -X POST http://localhost:8000/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"competitor_name": "Slack", "stream": true}'
```

## Response Schema

```json
{
  "competitor": "string",
  "website": "string",
  "research_findings": "string",
  "strategic_analysis": "string",
  "final_report": "string",
  "metrics": {},
  "timestamp": "string",
  "status": "success",
  "workflow": "multi_agent"
}
```

## Docker

```bash
docker build -t ci-api ./api
docker run -p 8000:8000 -e GEMINI_API_KEY=xxx ci-api
```
