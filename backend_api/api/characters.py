from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload
import random 
from core.dice import parse_and_roll 
from db.database import get_db
from db.models import Character, User, Attack, Spell
from api.dependencies import get_current_user
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user) 
):
    stmt = select(Character).where(Character.owner_id == current_user.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells),
        selectinload(Character.features)
    )
    result = await db.execute(stmt)
    characters = result.scalars().all()
    return characters



@router.post("/{character_id}/attacks", response_model=AttackResponse)
async def add_attack_to_character(
    character_id: int,
    attack_in: AttackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    stmt = select(Attack).join(Character).where(
        Attack.id == attack_id,
        Attack.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    attack = result.scalar_one_or_none()
    
    if not attack:
        raise HTTPException(status_code=404, detail="Атака не найдена или у вас нет к ней доступа")

    d20_roll = random.randint(1, 20)
    hit_total = d20_roll + attack.attack_bonus
    
    is_critical = d20_roll == 20
    is_critical_fail = d20_roll == 1

    try:
        damage_result = parse_and_roll(attack.damage_dice)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Ошибка в формуле кубиков атаки: {e}")

    return {
        "action": f"Атака: {attack.name}",
        "hit_roll": {
            "d20_face": d20_roll,
            "bonus": attack.attack_bonus,
            "total": hit_total,
            "is_critical": is_critical,
            "is_critical_fail": is_critical_fail
        },
        "damage": {
            "total": damage_result["total"],
            "dice_rolls": damage_result["rolls_detail"], 
            "modifier": damage_result["modifier"],
            "type": attack.damage_type
        }
    }
@router.post("/{character_id}/spells/{spell_id}/roll")
async def roll_character_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    response_data = {
        "action": f"Каст: {spell.name}"
    }

    if getattr(spell, 'requires_attack_roll', False):
        d20_roll = random.randint(1, 20)
        bonus = getattr(spell, 'spell_attack_bonus', 0)
        response_data["hit_roll"] = {
            "d20_face": d20_roll,
            "bonus": bonus,
            "total": d20_roll + bonus,
            "is_critical": d20_roll == 20,
            "is_critical_fail": d20_roll == 1
        }

    damage_dice = getattr(spell, 'damage_dice', None)
    if damage_dice:
        try:
            damage_result = parse_and_roll(damage_dice)
            response_data["damage"] = {
                "total": damage_result["total"],
                "dice_rolls": damage_result["rolls_detail"], 
                "modifier": damage_result["modifier"],
                "type": getattr(spell, 'damage_type', "Магический")
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Ошибка в формуле кубиков урона: {e}")

    if not getattr(spell, 'requires_attack_roll', False) and not damage_dice:
        response_data["effect"] = "Заклинание применено (без бросков урона/попадания)"

    return response_data

@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: int,
    char_update: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    await db.commit()
    await db.refresh(character)
    return character
    
@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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

    char_result = await db.execute(select(Character).where(Character.id == character_id))
    character = char_result.scalar_one()

    actual_cast_level = cast_level if cast_level is not None else spell.level

    if actual_cast_level > 0:
        level_key = str(actual_cast_level)
        slots = character.spell_slots or {}
        
        slot_data = slots.get(level_key, {"total": 0, "used": 0})
        
        if slot_data["total"] - slot_data["used"] <= 0:
            raise HTTPException(status_code=400, detail=f"Нет доступных ячеек {actual_cast_level} уровня!")

        slot_data["used"] += 1
        slots[level_key] = slot_data

        character.spell_slots = slots

        db.add(character)

    response_data = {
        "action": f"Каст заклинания: {spell.name} (Уровень {actual_cast_level})",
        "spell_slots_remaining": slots[level_key]["total"] - slots[level_key]["used"] if actual_cast_level > 0 else "Бесконечно (заговор)"
    }

    if spell.requires_attack_roll:
        d20_roll = random.randint(1, 20)
        response_data["hit_roll"] = {
            "d20_face": d20_roll,
            "bonus": spell.spell_attack_bonus,
            "total": d20_roll + spell.spell_attack_bonus,
            "is_critical": d20_roll == 20,
            "is_critical_fail": d20_roll == 1
        }

    if spell.damage_dice:
        try:
            damage_result = parse_and_roll(spell.damage_dice) 
            response_data["damage"] = {
                "total": damage_result["total"],
                "dice_rolls": damage_result["rolls_detail"], 
                "modifier": damage_result["modifier"],
                "type": spell.damage_type
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Ошибка в формуле кубиков урона: {e}")

    await db.commit()
    return response_data


@router.delete("/{character_id}/spells/{spell_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Character).where(Character.id == character_id, Character.owner_id == current_user.id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")

    new_feature = Feature(**feature_in.model_dump(), character_id=character.id)
    db.add(new_feature)
    await db.commit()
    await db.refresh(new_feature)
    return new_feature

@router.delete("/{character_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    character_id: int,
    feature_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    char_result = await db.execute(select(Character.id).where(Character.id == character_id, Character.owner_id == current_user.id))
    if not char_result.scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Персонаж не найден")

    await db.execute(delete(Feature).where(Feature.id == feature_id, Feature.character_id == character_id))
    await db.commit()
    return None

@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Character).where(Character.id == character_id, Character.owner_id == current_user.id))
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден")

    await db.execute(delete(Character).where(Character.id == character_id))
    await db.commit()
    return None