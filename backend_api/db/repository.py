from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Character


class CharacterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, char_id: int, owner_id: int):
        result = await self.db.execute(
            select(Character).where(
                Character.id == char_id, Character.owner_id == owner_id
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int):
        result = await self.db.execute(
            select(Character).where(Character.owner_id == owner_id)
        )
        return result.scalars().all()
