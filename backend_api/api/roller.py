from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from core.dice import parse_and_roll
from core.limiter import RateLimiter

roller_limiter = RateLimiter(capacity=10, refill_amount=1, refill_period_ms=1000)
router = APIRouter(prefix="/roll", tags=["Roller"], dependencies=[Depends(roller_limiter)])


class RollRequest(BaseModel):
    notation: str


@router.post("/")
async def roll_dice(request: RollRequest):
    try:
        result = parse_and_roll(request.notation)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
