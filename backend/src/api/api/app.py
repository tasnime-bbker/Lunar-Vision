#!/usr/bin/env python3
"""
FastAPI Application for Multi-Agent Competitive Intelligence
RESTful API with streaming capabilities for real-time tool call monitoring
"""

from src.api.redis_cache import get_cache
from src.api.ci_agent import MultiAgentCompetitiveIntelligence, get_gemini_model
from src.api.discovery_agent import CompetitorDiscoveryAgent
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Get environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:6969")

# Import our competitive intelligence system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global storage for streaming sessions
streaming_sessions: Dict[str, Dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    logger.info("🚀 Starting Multi-Agent Competitive Intelligence API")

    # Test environment setup on startup (non-blocking)
    try:
        get_gemini_model()
        logger.info("✅ Gemini model configuration verified")
    except Exception as e:
        logger.warning(f"⚠️ Environment setup incomplete: {e}")
        logger.info(
            "💡 Add real API keys to api/.env to enable full functionality")

    yield

    logger.info("🛑 Shutting down API")

# Initialize FastAPI app
app = FastAPI(
    title="Multi-Agent Competitive Intelligence API",
    description="RESTful API for competitive intelligence analysis using specialized AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for frontend integration
# Configure allowed origins based on environment
allowed_origins = ["*"] if ENVIRONMENT == "development" else [
    FRONTEND_URL,
    "https://*.vercel.app",
    "https://*.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses


class AnalysisRequest(BaseModel):
    """Request model for competitive analysis"""
    competitor_name: str = Field(...,
                                 description="Name of the competitor to analyze")
    competitor_website: Optional[str] = Field(
        None, description="Website URL of the competitor")
    niche: str = Field(
        "all", description="Analysis focus area (all, it, sales, marketing, finance, product, hr)")
    stream: bool = Field(
        False, description="Enable streaming for real-time updates")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "competitor_name": "Slack",
                    "competitor_website": "https://slack.com",
                    "niche": "all",
                    "stream": True
                }
            ]
        }
    }


class AnalysisResponse(BaseModel):
    """Response model for completed analysis"""
    competitor: str
    website: Optional[str]
    research_findings: str
    strategic_analysis: str
    final_report: str
    metrics: Optional[Dict[str, Any]] = None
    timestamp: str
    status: str
    workflow: str
    session_id: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    timestamp: str
    status: str = "error"


class StreamEvent(BaseModel):
    """Streaming event model"""
    timestamp: str
    type: str  # "status_update", "tool_call", "complete", "error"
    step: Optional[str] = None
    message: Optional[str] = None
    tool_name: Optional[str] = None
    tool_input: Optional[Dict] = None
    data: Optional[Dict] = None

# Health check endpoint


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Environment status endpoint


@app.get("/status")
async def get_status():
    """Get API and environment status"""
    try:
        # Test Gemini connection
        get_gemini_model()
        gemini_status = "connected"
    except Exception as e:
        gemini_status = f"error: {str(e)}"

    # Get cache status
    cache = get_cache()
    cache_stats = cache.get_cache_stats()

    return {
        "api_status": "running",
        "gemini_status": gemini_status,
        "cache_status": cache_stats,
        "active_sessions": len(streaming_sessions),
        "timestamp": datetime.now().isoformat()
    }

# Non-streaming analysis endpoint


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_competitor(request: AnalysisRequest):
    """
    Perform competitive intelligence analysis

    This endpoint runs the full multi-agent workflow and returns complete results.
    For real-time updates, use the streaming endpoint.
    """
    try:
        logger.info(f"Starting analysis for: {request.competitor_name}")

        # Initialize the intelligence system
        intelligence_system = MultiAgentCompetitiveIntelligence()

        # Run the workflow
        result = intelligence_system.run_competitive_intelligence_workflow(
            competitor_name=request.competitor_name,
            competitor_website=request.competitor_website,
            niche=request.niche
        )

        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get(
                "error", "Analysis failed"))

        logger.info(f"Analysis completed for: {request.competitor_name}")

        return AnalysisResponse(**result)

    except Exception as e:
        logger.error(
            f"Analysis failed for {request.competitor_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Streaming analysis endpoint


@app.post("/analyze/stream")
async def analyze_competitor_stream(request: AnalysisRequest):
    """
    Perform competitive intelligence analysis with real-time streaming

    This endpoint provides real-time updates during the analysis process,
    including tool calls, status updates, and intermediate results.
    """
    if not request.stream:
        # If streaming not requested, redirect to regular endpoint
        return await analyze_competitor(request)

    session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{request.competitor_name.replace(' ', '_')}"

    async def generate_stream():
        """Generate streaming events"""
        try:
            # Initialize session tracking
            streaming_sessions[session_id] = {
                "start_time": datetime.now().isoformat(),
                "competitor": request.competitor_name,
                "status": "running"
            }

            events_queue = asyncio.Queue()

            def stream_callback(event):
                """Callback to capture streaming events"""
                try:
                    # Validate event is JSON serializable before queuing
                    json.dumps(event)
                    asyncio.create_task(events_queue.put(event))
                except (TypeError, ValueError) as json_error:
                    # Create a safe fallback event
                    safe_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "tool_call",
                        "message": f"Non-serializable event received: {str(json_error)}",
                        "original_type": event.get("type", "unknown") if isinstance(event, dict) else "unknown"
                    }
                    asyncio.create_task(events_queue.put(safe_event))
                except Exception as e:
                    logger.error(f"Stream callback error: {e}")

            # Start analysis in background
            async def run_analysis():
                intelligence_system = None
                try:
                    intelligence_system = MultiAgentCompetitiveIntelligence(
                        stream_callback)
                    result = intelligence_system.run_competitive_intelligence_workflow(
                        competitor_name=request.competitor_name,
                        competitor_website=request.competitor_website,
                        niche=request.niche
                    )

                    # Send final result
                    final_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "complete",
                        "data": result
                    }
                    await events_queue.put(final_event)

                    # Update session status
                    streaming_sessions[session_id]["status"] = "completed"
                    streaming_sessions[session_id]["result"] = result

                except Exception as e:
                    logger.error(
                        f"Analysis error for session {session_id}: {e}")
                    error_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "error",
                        "message": str(e)
                    }
                    await events_queue.put(error_event)
                    streaming_sessions[session_id]["status"] = "error"
                finally:
                    # Cleanup resources if possible
                    if intelligence_system:
                        try:
                            # Add cleanup for any resources if needed
                            pass
                        except Exception as cleanup_error:
                            logger.warning(f"Cleanup warning: {cleanup_error}")

                    # Signal end of stream
                    await events_queue.put(None)

            # Start analysis
            analysis_task = asyncio.create_task(run_analysis())

            # Send initial event
            initial_event = {
                "timestamp": datetime.now().isoformat(),
                "type": "session_start",
                "session_id": session_id,
                "message": f"Starting analysis for {request.competitor_name}"
            }
            yield f"data: {json.dumps(initial_event)}\n\n"

            # Stream events as they come
            while True:
                try:
                    # Wait for event with timeout
                    event = await asyncio.wait_for(events_queue.get(), timeout=1.0)

                    if event is None:  # End of stream signal
                        break

                    # Safe JSON serialization
                    try:
                        event_json = json.dumps(event)
                        yield f"data: {event_json}\n\n"
                    except (TypeError, ValueError) as e:
                        # Fallback for non-serializable events
                        safe_event = {
                            "timestamp": datetime.now().isoformat(),
                            "type": "error",
                            "message": f"Event serialization error: {str(e)}",
                            "original_type": event.get("type", "unknown")
                        }
                        yield f"data: {json.dumps(safe_event)}\n\n"

                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    heartbeat = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "heartbeat"
                    }
                    yield f"data: {json.dumps(heartbeat)}\n\n"
                    continue

            # Clean up
            await analysis_task

        except Exception as e:
            logger.error(f"Streaming error for session {session_id}: {e}")
            error_event = {
                "timestamp": datetime.now().isoformat(),
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_event)}\n\n"
        finally:
            # Clean up session after delay
            async def cleanup():
                await asyncio.sleep(300)  # Keep session for 5 minutes
                streaming_sessions.pop(session_id, None)

            asyncio.create_task(cleanup())

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

# Get active sessions


@app.get("/sessions")
async def get_active_sessions():
    """Get information about active streaming sessions"""
    return {
        "active_sessions": len(streaming_sessions),
        "sessions": {
            session_id: {
                "start_time": data["start_time"],
                "competitor": data["competitor"],
                "status": data["status"]
            }
            for session_id, data in streaming_sessions.items()
        },
        "timestamp": datetime.now().isoformat()
    }

# Get session details


@app.get("/sessions/{session_id}")
async def get_session_details(session_id: str):
    """Get details for a specific session"""
    if session_id not in streaming_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return streaming_sessions[session_id]

# Demo scenarios endpoint


@app.get("/demo-scenarios")
async def get_demo_scenarios():
    """Get available demo scenarios for testing"""
    scenarios = [
        {
            "id": 1,
            "name": "Oxylabs",
            "website": "https://oxylabs.io",
            "description": "Data collection and web scraping"
        },
        {
            "id": 2,
            "name": "Notion",
            "website": "https://notion.so",
            "description": "All-in-one workspace"
        },
        {
            "id": 3,
            "name": "Figma",
            "website": "https://figma.com",
            "description": "Collaborative design"
        }
    ]

    return {
        "scenarios": scenarios,
        "timestamp": datetime.now().isoformat()
    }

# Competitor Discovery endpoints


class DiscoveryRequest(BaseModel):
    """Request model for competitor discovery"""
    business_idea: str = Field(..., description="Business idea description")
    stream: bool = Field(
        False, description="Enable streaming for real-time updates")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "business_idea": "A project management tool for remote teams with built-in video conferencing",
                    "stream": True
                }
            ]
        }
    }


class DiscoveryResponse(BaseModel):
    """Response model for completed discovery"""
    business_idea: str
    competitors_found: str
    competitive_analysis: str
    discovery_report: str
    timestamp: str
    status: str
    workflow: str


@app.post("/discover/competitors", response_model=DiscoveryResponse)
async def discover_competitors(request: DiscoveryRequest):
    """
    Discover potential competitors based on business idea

    This endpoint runs the multi-agent competitor discovery workflow
    to find and analyze potential competitors across multiple platforms.
    """
    try:
        logger.info(
            f"Starting competitor discovery for business idea: {request.business_idea[:50]}...")

        # Initialize the discovery system
        discovery_system = CompetitorDiscoveryAgent()

        # Run the discovery workflow
        result = discovery_system.discover_competitors(request.business_idea)

        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get(
                "error", "Discovery failed"))

        logger.info(
            f"Discovery completed for business idea: {request.business_idea[:50]}...")

        return DiscoveryResponse(**result)

    except Exception as e:
        logger.error(f"Discovery failed for business idea: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/discover/competitors/stream")
async def discover_competitors_stream(request: DiscoveryRequest):
    """
    Discover competitors with real-time streaming updates

    This endpoint provides real-time updates during the discovery process,
    including multi-platform search progress and competitor findings.
    """
    if not request.stream:
        # If streaming not requested, redirect to regular endpoint
        return await discover_competitors(request)

    session_id = f"discovery_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{request.business_idea.replace(' ', '_')[:20]}"

    async def generate_discovery_stream():
        """Generate streaming events for competitor discovery"""
        try:
            # Initialize session tracking
            streaming_sessions[session_id] = {
                "start_time": datetime.now().isoformat(),
                "business_idea": request.business_idea,
                "status": "running",
                "type": "discovery"
            }

            events_queue = asyncio.Queue()

            def stream_callback(event):
                """Callback to capture discovery streaming events"""
                try:
                    # Validate event is JSON serializable before queuing
                    json.dumps(event)
                    asyncio.create_task(events_queue.put(event))
                except (TypeError, ValueError) as json_error:
                    # Create a safe fallback event
                    safe_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "tool_call",
                        "message": f"Non-serializable discovery event: {str(json_error)}",
                        "original_type": event.get("type", "unknown") if isinstance(event, dict) else "unknown"
                    }
                    asyncio.create_task(events_queue.put(safe_event))
                except Exception as e:
                    logger.error(f"Discovery stream callback error: {e}")

            # Start discovery in background
            async def run_discovery():
                discovery_system = None
                try:
                    discovery_system = CompetitorDiscoveryAgent(
                        stream_callback)
                    result = discovery_system.discover_competitors(
                        request.business_idea)

                    # Send final result
                    final_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "complete",
                        "data": result
                    }
                    await events_queue.put(final_event)

                    # Update session status
                    streaming_sessions[session_id]["status"] = "completed"
                    streaming_sessions[session_id]["result"] = result

                except Exception as e:
                    logger.error(
                        f"Discovery error for session {session_id}: {e}")
                    error_event = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "error",
                        "message": str(e)
                    }
                    await events_queue.put(error_event)
                    streaming_sessions[session_id]["status"] = "error"
                finally:
                    # Signal end of stream
                    await events_queue.put(None)

            # Start discovery
            discovery_task = asyncio.create_task(run_discovery())

            # Send initial event
            initial_event = {
                "timestamp": datetime.now().isoformat(),
                "type": "session_start",
                "session_id": session_id,
                "message": f"Starting competitor discovery for: {request.business_idea[:50]}..."
            }
            yield f"data: {json.dumps(initial_event)}\n\n"

            # Stream events as they come
            while True:
                try:
                    # Wait for event with timeout
                    event = await asyncio.wait_for(events_queue.get(), timeout=1.0)

                    if event is None:  # End of stream signal
                        break

                    # Safe JSON serialization
                    try:
                        event_json = json.dumps(event)
                        yield f"data: {event_json}\n\n"
                    except (TypeError, ValueError) as e:
                        # Fallback for non-serializable events
                        safe_event = {
                            "timestamp": datetime.now().isoformat(),
                            "type": "error",
                            "message": f"Event serialization error: {str(e)}",
                            "original_type": event.get("type", "unknown")
                        }
                        yield f"data: {json.dumps(safe_event)}\n\n"

                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    heartbeat = {
                        "timestamp": datetime.now().isoformat(),
                        "type": "heartbeat"
                    }
                    yield f"data: {json.dumps(heartbeat)}\n\n"
                    continue

            # Clean up
            await discovery_task

        except Exception as e:
            logger.error(
                f"Discovery streaming error for session {session_id}: {e}")
            error_event = {
                "timestamp": datetime.now().isoformat(),
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_event)}\n\n"
        finally:
            # Clean up session after delay
            async def cleanup():
                await asyncio.sleep(300)  # Keep session for 5 minutes
                streaming_sessions.pop(session_id, None)

            asyncio.create_task(cleanup())

    return StreamingResponse(
        generate_discovery_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )


# Cache management endpoints


@app.get("/cache/stats")
async def get_cache_stats():
    """Get detailed cache statistics"""
    cache = get_cache()
    return cache.get_cache_stats()


@app.delete("/cache/competitor/{competitor_name}")
async def clear_competitor_cache(competitor_name: str):
    """Clear cache for a specific competitor"""
    cache = get_cache()
    deleted_count = cache.clear_competitor_cache(competitor_name)

    return {
        "message": f"Cleared cache for {competitor_name}",
        "deleted_entries": deleted_count,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/cache/refresh/{competitor_name}")
async def refresh_competitor_analysis(competitor_name: str, competitor_website: str = None):
    """Force refresh analysis for a competitor (clears cache and re-analyzes)"""
    try:
        cache = get_cache()

        # Clear existing cache
        deleted_count = cache.clear_competitor_cache(competitor_name)

        # Run fresh analysis
        intelligence_system = MultiAgentCompetitiveIntelligence()
        result = intelligence_system.run_competitive_intelligence_workflow(
            competitor_name=competitor_name,
            competitor_website=competitor_website
        )

        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get(
                "error", "Analysis failed"))

        return {
            "message": f"Refreshed analysis for {competitor_name}",
            "cleared_entries": deleted_count,
            "new_analysis": result,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Cache refresh failed for {competitor_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
