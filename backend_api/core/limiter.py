import time

from fastapi import HTTPException, Request

# Тот самый Lua-скрипт (Token Bucket)
TOKEN_BUCKET_LUA = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_amount = tonumber(ARGV[2])
local refill_period_ms = tonumber(ARGV[3])
local now_ms = tonumber(ARGV[4])
local requested = 1

local tokens_key = key .. ":tokens"
local time_key = key .. ":time"

local current_tokens = redis.call("GET", tokens_key)
local last_refill_time = redis.call("GET", time_key)

if not current_tokens then
    current_tokens = capacity
    last_refill_time = now_ms
else
    current_tokens = tonumber(current_tokens)
    last_refill_time = tonumber(last_refill_time)
    
    local time_passed = math.max(0, now_ms - last_refill_time)
    local periods_passed = math.floor(time_passed / refill_period_ms)
    
    if periods_passed > 0 then
        local added_tokens = periods_passed * refill_amount
        current_tokens = math.min(capacity, current_tokens + added_tokens)
        last_refill_time = last_refill_time + (periods_passed * refill_period_ms)
    end
end

local allowed = 0
if current_tokens >= requested then
    current_tokens = current_tokens - requested
    allowed = 1
end

redis.call("SET", tokens_key, current_tokens)
redis.call("SET", time_key, last_refill_time)

local ttl = math.ceil((capacity / refill_amount) * (refill_period_ms / 1000)) + 60
redis.call("EXPIRE", tokens_key, ttl)
redis.call("EXPIRE", time_key, ttl)

return allowed
"""

class RateLimiter:
    def __init__(self, capacity: int, refill_amount: int, refill_period_ms: int):
        self.capacity = capacity
        self.refill_amount = refill_amount
        self.refill_period_ms = refill_period_ms

    async def __call__(self, request: Request):
        redis_client = request.app.state.redis
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host
            
        key = f"rate_limit:ip:{client_ip}"
        now_ms = int(time.time() * 1000)

        allowed = await redis_client.eval(
            TOKEN_BUCKET_LUA,
            1, 
            key,
            self.capacity,
            self.refill_amount,
            self.refill_period_ms,
            now_ms
        )

        if not allowed:
            raise HTTPException(
                status_code=429, 
                detail=(
                    "Слишком много запросов. "
                    "Подождите немного перед следующей попыткой."
                )
            )