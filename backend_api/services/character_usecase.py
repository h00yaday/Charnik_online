from db.models import Attack, Character, Feature, Spell
from db.repository import CharacterRepository
from services.character_service import CharacterService
from services.domain_exceptions import EntityNotFoundError


class CharacterUseCase:
    def __init__(self, repo: CharacterRepository):
        self.repo = repo

    async def get_list(self, owner_id: int, limit: int, offset: int) -> list[Character]:
        return await self.repo.get_list_by_owner(owner_id, limit=limit, offset=offset)

    async def get_detail(self, character_id: int, owner_id: int) -> Character:
        character = await self.repo.get_owned_with_relations(character_id, owner_id)
        if not character:
            raise EntityNotFoundError("Персонаж не найден")
        CharacterService._clamp_character_invariants(character)
        return character

    async def get_owned_character(self, character_id: int, owner_id: int) -> Character:
        character = await self.repo.get_owned(character_id, owner_id)
        if not character:
            raise EntityNotFoundError("Персонаж не найден")
        return character

    async def get_owned_attack(self, attack_id: int, character_id: int, owner_id: int) -> Attack:
        attack = await self.repo.get_owned_attack(attack_id, character_id, owner_id)
        if not attack:
            raise EntityNotFoundError("Атака не найдена или у вас нет к ней доступа")
        return attack

    async def get_owned_spell(self, spell_id: int, character_id: int, owner_id: int) -> Spell:
        spell = await self.repo.get_owned_spell(spell_id, character_id, owner_id)
        if not spell:
            raise EntityNotFoundError("Заклинание не найдено или у вас нет к нему доступа")
        return spell

    async def get_feature(self, feature_id: int, character_id: int) -> Feature:
        feature = await self.repo.get_feature(feature_id, character_id)
        if not feature:
            raise EntityNotFoundError("Особенность не найдена")
        return feature
