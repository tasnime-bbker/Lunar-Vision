# Redis Caching Setup

## Overview

Redis caching for the Competitive Intelligence API improves performance, reduces API costs, and provides faster response times.

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# For cloud Redis (Railway, Heroku, etc.)
REDIS_URL=redis://username:password@hostname:port/database

# Cache TTL Settings (in seconds)
REDIS_DEFAULT_TTL=3600        # 1 hour
REDIS_ANALYSIS_TTL=86400      # 24 hours
REDIS_RESEARCH_TTL=7200       # 2 hours
REDIS_GEMINI_TTL=86400        # 24 hours
```

### Local Setup

**Docker (Recommended):**

```bash
docker run -d --name redis-cache -p 6379:6379 redis:7-alpine
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server
```

## What Gets Cached

| Data Type | TTL | Description |
|-----------|-----|-------------|
| Analysis Results | 24h | Full competitive intelligence reports |
| Gemini Responses | 24h | Individual agent responses |
| Research Data | 2h | Web scraping results |

## API Endpoints

```bash
# Get cache statistics
GET /cache/stats

# Clear competitor cache
DELETE /cache/competitor/{name}

# Force refresh analysis
POST /cache/refresh/{name}?competitor_website=https://example.com
```

## Performance

| Scenario | Without Cache | With Cache | Improvement |
|----------|---------------|------------|-------------|
| First analysis | 30-60s | 30-60s | - |
| Repeat analysis | 30-60s | 0.1-0.5s | 60-600x faster |
| API costs | Full | ~10% | 90% savings |

## Redis CLI Access

```bash
# Connect to Redis
docker exec -it redis-cache redis-cli

# View cache keys
docker exec redis-cache redis-cli keys "ci:*"

# Check memory usage
docker exec redis-cache redis-cli info memory

# Clear all cache
docker exec redis-cache redis-cli flushall
```

## Troubleshooting

1. **Check Redis is running:** `docker exec redis-cache redis-cli ping`
2. **Verify environment:** Ensure `REDIS_ENABLED=true` in `.env`
3. **Check logs:** Look for Redis connection errors in API logs
4. **Restart container:** `docker restart redis-cache`
