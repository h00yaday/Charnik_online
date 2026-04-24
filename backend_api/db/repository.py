from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Attack, Character, Feature, Spell


class CharacterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, char_id: int, owner_id: int):
        result = await self.db.execute(
            select(Character)
            .where(Character.id == char_id, Character.owner_id == owner_id)
            .options(
                selectinload(Character.attacks),
                selectinload(Character.spells),
                selectinload(Character.features),
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int):
        result = await self.db.execute(select(Character).where(Character.owner_id == owner_id))
        return result.scalars().all()

    async def get_list_by_owner(self, owner_id: int, limit: int, offset: int):
        result = await self.db.execute(
            select(Character)
            .where(Character.owner_id == owner_id)
            .order_by(Character.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def get_owned_with_relations(self, character_id: int, owner_id: int):
        result = await self.db.execute(
            select(Character)
            .where(Character.id == character_id, Character.owner_id == owner_id)
            .options(
                selectinload(Character.attacks),
                selectinload(Character.spells),
                selectinload(Character.features),
            )
        )
        return result.scalar_one_or_none()

    async def get_owned(self, character_id: int, owner_id: int):
        result = await self.db.execute(
            select(Character).where(
                Character.id == character_id,
                Character.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_owned_attack(self, attack_id: int, character_id: int, owner_id: int):
        result = await self.db.execute(
            select(Attack)
            .join(Character)
            .where(
                Attack.id == attack_id,
                Attack.character_id == character_id,
                Character.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_owned_spell(self, spell_id: int, character_id: int, owner_id: int):
        result = await self.db.execute(
            select(Spell)
            .join(Character)
            .where(
                Spell.id == spell_id,
                Spell.character_id == character_id,
                Character.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_feature(self, feature_id: int, character_id: int):
        result = await self.db.execute(
            select(Feature).where(
                Feature.id == feature_id,
                Feature.character_id == character_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete_attack(self, attack_id: int, character_id: int):
        result = await self.db.execute(
            delete(Attack).where(
                Attack.id == attack_id,
                Attack.character_id == character_id,
            )
        )
        return result.rowcount or 0
