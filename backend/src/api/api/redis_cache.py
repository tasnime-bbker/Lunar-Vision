#!/usr/bin/env python3
"""
Redis Cache Manager for Competitive Intelligence System
Handles caching of Gemini API responses and analysis results

This file is part of the redis-test branch implementation
"""

import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache manager for competitive intelligence data"""

    def __init__(self):
        """Initialize Redis connection with configuration from environment"""
        self.redis_client = None
        self.default_ttl = int(
            os.getenv("REDIS_DEFAULT_TTL", "3600"))  # 1 hour default
        # 24 hours for analysis
        self.analysis_ttl = int(os.getenv("REDIS_ANALYSIS_TTL", "86400"))
        self.enabled = os.getenv("REDIS_ENABLED", "false").lower() == "true" or bool(os.getenv("REDIS_URL"))

        if self.enabled:
            self._connect()

    def _connect(self):
        """Establish Redis connection"""
        try:
            # Redis configuration from environment
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", "6379"))
            redis_password = os.getenv("REDIS_PASSWORD")
            redis_db = int(os.getenv("REDIS_DB", "0"))
            redis_url = os.getenv("REDIS_URL")

            # Use Redis URL if provided (for cloud services like Railway, Heroku)
            if redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=1,
                    socket_timeout=1,
                    retry_on_timeout=False
                )
            else:
                # Use individual parameters
                self.redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    password=redis_password,
                    db=redis_db,
                    decode_responses=True,
                    socket_connect_timeout=1,
                    socket_timeout=1,
                    retry_on_timeout=False
                )

            # Test connection
            self.redis_client.ping()
            logger.info(
                f"✅ Redis connected successfully to {redis_host}:{redis_port}")

        except redis.RedisError as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            logger.info(
                "💡 Continuing without cache - add Redis configuration to enable caching")
            self.enabled = False
            self.redis_client = None
        except Exception as e:
            logger.warning(f"⚠️ Redis setup error: {e}")
            self.enabled = False
            self.redis_client = None

    def _generate_cache_key(self, prefix: str, data: Union[str, Dict]) -> str:
        """Generate a cache key from data"""
        if isinstance(data, dict):
            # Sort dict keys for consistent hashing
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)

        # Create hash of the data
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        return f"ci:{prefix}:{data_hash}"

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached data"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            cached_data = self.redis_client.get(key)
            if cached_data:
                data = json.loads(cached_data)
                logger.info(f"🎯 Cache HIT: {key[:50]}...")
                return data
            else:
                logger.info(f"❌ Cache MISS: {key[:50]}...")
                return None

        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.warning(f"⚠️ Cache get error: {e}")
            return None

    def set(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set cached data with TTL"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            # Add metadata
            cache_data = {
                "data": data,
                "cached_at": datetime.now().isoformat(),
                "ttl": ttl or self.default_ttl
            }

            # Set with TTL
            result = self.redis_client.setex(
                key,
                ttl or self.default_ttl,
                json.dumps(cache_data, default=str)
            )

            if result:
                logger.info(
                    f"💾 Cache SET: {key[:50]}... (TTL: {ttl or self.default_ttl}s)")

            return result

        except (redis.RedisError, json.JSONEncodeError) as e:
            logger.warning(f"⚠️ Cache set error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete cached data"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            result = self.redis_client.delete(key)
            if result:
                logger.info(f"🗑️ Cache DELETE: {key[:50]}...")
            return bool(result)

        except redis.RedisError as e:
            logger.warning(f"⚠️ Cache delete error: {e}")
            return False

    def get_analysis(self, competitor_name: str, competitor_website: Optional[str] = None, niche: str = "all") -> Optional[Dict[str, Any]]:
        """Get cached competitive analysis"""
        cache_key = self._generate_cache_key("analysis", {
            "competitor": competitor_name.lower().strip(),
            "website": competitor_website,
            "niche": niche.lower().strip()
        })

        cached_result = self.get(cache_key)
        if cached_result and "data" in cached_result:
            return cached_result["data"]
        return None

    def set_analysis(self, competitor_name: str, analysis_result: Dict[str, Any],
                     competitor_website: Optional[str] = None, niche: str = "all") -> bool:
        """Cache competitive analysis result"""
        cache_key = self._generate_cache_key("analysis", {
            "competitor": competitor_name.lower().strip(),
            "website": competitor_website,
            "niche": niche.lower().strip()
        })

        return self.set(cache_key, analysis_result, self.analysis_ttl)

    def get_research_data(self, query: str) -> Optional[Dict[str, Any]]:
        """Get cached research data"""
        cache_key = self._generate_cache_key("research", query.lower().strip())

        cached_result = self.get(cache_key)
        if cached_result and "data" in cached_result:
            return cached_result["data"]
        return None

    def set_research_data(self, query: str, research_data: Dict[str, Any]) -> bool:
        """Cache research data"""
        cache_key = self._generate_cache_key("research", query.lower().strip())

        # Research data has shorter TTL since it can become outdated
        research_ttl = int(os.getenv("REDIS_RESEARCH_TTL", "7200"))  # 2 hours
        return self.set(cache_key, research_data, research_ttl)

    def get_gemini_response(self, prompt: str, model_params: Dict = None) -> Optional[str]:
        """Get cached Gemini API response"""
        cache_data = {
            "prompt": prompt.strip(),
            "model_params": model_params or {}
        }
        cache_key = self._generate_cache_key("gemini", cache_data)

        cached_result = self.get(cache_key)
        if cached_result and "data" in cached_result:
            return cached_result["data"]
        return None

    def set_gemini_response(self, prompt: str, response: str, model_params: Dict = None) -> bool:
        """Cache Gemini API response"""
        cache_data = {
            "prompt": prompt.strip(),
            "model_params": model_params or {}
        }
        cache_key = self._generate_cache_key("gemini", cache_data)

        # Gemini responses have longer TTL since they're expensive to generate
        gemini_ttl = int(os.getenv("REDIS_GEMINI_TTL", "86400"))  # 24 hours
        return self.set(cache_key, response, gemini_ttl)

    def clear_competitor_cache(self, competitor_name: str) -> int:
        """Clear all cache entries for a specific competitor"""
        if not self.enabled or not self.redis_client:
            return 0

        try:
            # Find all keys related to this competitor
            pattern = f"ci:*{competitor_name.lower().replace(' ', '*')}*"
            keys = self.redis_client.keys(pattern)

            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(
                    f"🗑️ Cleared {deleted} cache entries for {competitor_name}")
                return deleted

            return 0

        except redis.RedisError as e:
            logger.warning(f"⚠️ Cache clear error: {e}")
            return 0

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.enabled or not self.redis_client:
            return {"enabled": False, "error": "Redis not connected"}

        try:
            info = self.redis_client.info()

            # Count keys by type
            analysis_keys = len(self.redis_client.keys("ci:analysis:*"))
            research_keys = len(self.redis_client.keys("ci:research:*"))
            gemini_keys = len(self.redis_client.keys("ci:gemini:*"))

            return {
                "enabled": True,
                "connected": True,
                "total_keys": info.get("db0", {}).get("keys", 0),
                "analysis_cached": analysis_keys,
                "research_cached": research_keys,
                "gemini_cached": gemini_keys,
                "memory_used": info.get("used_memory_human", "Unknown"),
                "uptime": info.get("uptime_in_seconds", 0),
                "ttl_config": {
                    "default": self.default_ttl,
                    "analysis": self.analysis_ttl,
                    "research": int(os.getenv("REDIS_RESEARCH_TTL", "7200")),
                    "gemini": int(os.getenv("REDIS_GEMINI_TTL", "86400"))
                }
            }

        except redis.RedisError as e:
            return {"enabled": True, "connected": False, "error": str(e)}


# Global cache instance
cache = RedisCache()


def get_cache() -> RedisCache:
    """Get the global cache instance"""
    return cache
