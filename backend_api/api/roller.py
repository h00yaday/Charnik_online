from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from core.dice import parse_and_roll

router = APIRouter(prefix="/roll", tags=["Roller"])


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
