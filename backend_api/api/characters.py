from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified # <-- ДОБАВИЛИ ДЛЯ ЯЧЕЕК
import random 
from core.dice import parse_and_roll 
from services.combat_service import CombatService
from db.database import get_db
from db.models import Character, User, Attack, Spell, Feature # <-- ДОБАВИЛИ FEATURE
from db.repository import CharacterRepository
from api.dependencies import get_current_user, CurrentUser
from schemas.schemas import (
    CharacterCreate, CharacterResponse, CharacterUpdate,
    AttackCreate, AttackResponse,
    SpellCreate, SpellResponse, FeatureCreate, FeatureResponse
)

router = APIRouter(prefix="/characters", tags=["Characters"])

@router.post("/", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    char_in: CharacterCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    char_data = char_in.model_dump()

    new_char = Character(**char_data, owner_id=current_user.id)
    new_char.current_hp = char_in.max_hp

    db.add(new_char)
    await db.commit()
    
    stmt = select(Character).where(Character.id == new_char.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells),
        selectinload(Character.features)
    )
    result = await db.execute(stmt)
    character_with_relations = result.scalar_one()

    return character_with_relations
    
@router.get("/", response_model=list[CharacterResponse])
async def get_characters(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    # Запрашиваем всех персонажей текущего пользователя
    # Обязательно подгружаем связи (attacks, spells, features), 
    # так как их скорее всего ожидает CharacterResponse
    stmt = select(Character).where(Character.owner_id == current_user.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells),
        selectinload(Character.features)
    )
    result = await db.execute(stmt)
    characters = result.scalars().all()
    
    return characters

@router.get("/{char_id}", response_model=CharacterResponse)
async def get_character(
    char_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: CurrentUser = Depends(get_current_user)
):
    repo = CharacterRepository(db) # Создаем репозиторий
    character = await repo.get_by_id(char_id, current_user.id)
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return character

@router.post("/{character_id}/attacks", response_model=AttackResponse)
async def add_attack_to_character(
    character_id: int,
    attack_in: AttackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден или у вас нет к нему доступа")

    new_attack = Attack(**attack_in.model_dump(), character_id=character.id)
    db.add(new_attack)
    await db.commit()
    await db.refresh(new_attack)
    
    return new_attack

@router.post("/{character_id}/spells", response_model=SpellResponse)
async def add_spell_to_character(
    character_id: int,
    spell_in: SpellCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден или у вас нет к нему доступа")

    new_spell = Spell(**spell_in.model_dump(), character_id=character.id)
    db.add(new_spell)
    await db.commit()
    await db.refresh(new_spell)
    
    return new_spell

@router.post("/{character_id}/attacks/{attack_id}/roll")
async def roll_character_attack(
    character_id: int,
    attack_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    # 1. Только работа с БД (найти атаку)
    stmt = select(Attack).join(Character).where(
        Attack.id == attack_id,
        Attack.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    attack = result.scalar_one_or_none()
    
    if not attack:
        raise HTTPException(status_code=404, detail="Атака не найдена или у вас нет к ней доступа")

    return CombatService.process_attack_roll(attack)

@router.post("/{character_id}/spells/{spell_id}/roll")
async def roll_character_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    stmt = select(Spell).join(Character).where(
        Spell.id == spell_id,
        Spell.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    spell = result.scalar_one_or_none()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Заклинание не найдено или у вас нет к нему доступа")

    return CombatService.process_spell_roll(spell)

@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: int,
    char_update: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    stmt = select(Character).where(Character.id == character_id, Character.owner_id == current_user.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells),
        selectinload(Character.features)
    )
    result = await db.execute(stmt)
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")

    update_data = char_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)

    # Принудительно говорим алхимии, что мы изменили JSON словари
    if "spell_slots" in update_data:
        flag_modified(character, "spell_slots")
    if "skills" in update_data:
        flag_modified(character, "skills")
    if "saving_throws" in update_data:
        flag_modified(character, "saving_throws")

    await db.commit()
    await db.refresh(character)
    return character
    
@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    result = await db.execute(select(Character).where(Character.id == character_id, Character.owner_id == current_user.id))
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    
    await db.delete(character)
    await db.commit()

@router.delete("/{character_id}/attacks/{attack_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attack(
    character_id: int,
    attack_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    char_stmt = select(Character.id).where(Character.id == character_id, Character.owner_id == current_user.id)
    char_result = await db.execute(char_stmt)
    if not char_result.scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Персонаж не найден")

    stmt = delete(Attack).where(Attack.id == attack_id, Attack.character_id == character_id)
    await db.execute(stmt)
    await db.commit()
    return None

@router.post("/{character_id}/spells/{spell_id}/cast")
async def cast_spell(
    character_id: int,
    spell_id: int,
    cast_level: int = None, 
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    stmt = select(Spell).join(Character).where(
        Spell.id == spell_id,
        Spell.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    spell = result.scalar_one_or_none()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Заклинание не найдено")

    char_stmt = select(Character).where(Character.id == character_id).with_for_update()
    char_result = await db.execute(char_stmt)
    character = char_result.scalar_one()

    response_data = CombatService.process_spell_cast(spell, character, cast_level)

    db.add(character)
    await db.commit()
    
    return response_data

@router.delete("/{character_id}/spells/{spell_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    stmt = select(Spell).join(Character).where(
        Spell.id == spell_id,
        Spell.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    spell = result.scalar_one_or_none()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Заклинание не найдено")
    
    await db.delete(spell)
    await db.commit()

@router.post("/{character_id}/features", response_model=FeatureResponse)
async def add_feature_to_character(
    character_id: int,
    feature_in: FeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    result = await db.execute(select(Character).where(Character.id == character_id, Character.owner_id == current_user.id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")

    new_feature = Feature(**feature_in.model_dump(), character_id=character.id)
    
    if new_feature.modifiers:
        for stat, bonus in new_feature.modifiers.items():
            if hasattr(character, stat):
                current_val = getattr(character, stat)
                setattr(character, stat, current_val + bonus)
                
        # Если меняем max_hp, можно сразу хилить перса
        if "max_hp" in new_feature.modifiers:
             character.current_hp += new_feature.modifiers["max_hp"]
             

    db.add(new_feature)
    await db.commit()
    await db.refresh(new_feature)
    return new_feature

@router.delete("/{character_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    character_id: int,
    feature_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    char_result = await db.execute(
        select(Character).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    character = char_result.scalar_one_or_none()
    
    if not character:
         raise HTTPException(status_code=404, detail="Персонаж не найден")
    feat_result = await db.execute(
        select(Feature).where(Feature.id == feature_id, Feature.character_id == character_id)
    )
    feature = feat_result.scalar_one_or_none()

    if not feature:
        raise HTTPException(status_code=404, detail="Особенность не найдена")

    if feature.modifiers:
        for stat, bonus in feature.modifiers.items():
            if hasattr(character, stat):
                current_val = getattr(character, stat)
                setattr(character, stat, current_val - bonus) # Отнимаем бонус
        
        if "max_hp" in feature.modifiers:
            if character.current_hp > character.max_hp:
                character.current_hp = character.max_hp

    await db.delete(feature)
    await db.commit()
    
    return None

@router.post("/{character_id}/roll-check")
async def roll_character_check(
    character_id: int,
    action: str,
    bonus: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    char_result = await db.execute(
        select(Character.id).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    if not char_result.scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Персонаж не найден")

    return CombatService.process_check_roll(action, bonus)