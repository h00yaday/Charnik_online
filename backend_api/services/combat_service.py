import random

from fastapi import HTTPException
from sqlalchemy.orm.attributes import flag_modified

from core.dice import parse_and_roll
from db.models import Attack, Character, Spell


class CombatService:
    @staticmethod
    def process_attack_roll(attack: Attack) -> dict:
        """Обрабатывает бросок атаки и расчет урона"""
        d20_roll = random.randint(1, 20)
        hit_total = d20_roll + attack.attack_bonus

        is_critical = d20_roll == 20
        is_critical_fail = d20_roll == 1

        try:
            damage_result = parse_and_roll(attack.damage_dice)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Ошибка в формуле кубиков атаки: {e}",
            ) from e

        return {
            "action": f"Атака: {attack.name}",
            "hit_roll": {
                "d20_face": d20_roll,
                "bonus": attack.attack_bonus,
                "total": hit_total,
                "is_critical": is_critical,
                "is_critical_fail": is_critical_fail,
            },
            "damage": {
                "total": damage_result["total"],
                "dice_rolls": damage_result["rolls_detail"],
                "modifier": damage_result["modifier"],
                "type": attack.damage_type,
            },
        }

    @staticmethod
    def process_spell_cast(
        spell: Spell, character: Character, cast_level: int | None = None
    ) -> dict:
        """Обрабатывает применение заклинания и расход ячеек"""
        actual_cast_level = cast_level if cast_level is not None else spell.level
        slots = character.spell_slots or {}
        level_key = str(actual_cast_level)

        # 1. Логика расхода ячеек (если это не заговор)
        if actual_cast_level > 0:
            slot_data = slots.get(level_key, {"total": 0, "used": 0})

            if slot_data["total"] - slot_data["used"] <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Нет доступных ячеек {actual_cast_level} уровня!",
                )

            slot_data["used"] += 1
            slots[level_key] = slot_data

            # Обновляем состояние персонажа
            character.spell_slots = slots
            flag_modified(character, "spell_slots")

        # 2. Формирование ответа
        spell_slots_remaining = (
            slots[level_key]["total"] - slots[level_key]["used"]
            if actual_cast_level > 0
            else "Бесконечно (заговор)"
        )

        response_data = {
            "action": f"Каст заклинания: {spell.name} (Уровень {actual_cast_level})",
            "spell_slots_remaining": spell_slots_remaining,
        }

        # 3. Логика броска атаки заклинанием
        if spell.requires_attack_roll:
            d20_roll = random.randint(1, 20)
            response_data["hit_roll"] = {
                "d20_face": d20_roll,
                "bonus": spell.spell_attack_bonus,
                "total": d20_roll + spell.spell_attack_bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            }

        # 4. Логика урона
        if spell.damage_dice:
            try:
                damage_result = parse_and_roll(spell.damage_dice)
                response_data["damage"] = {
                    "total": damage_result["total"],
                    "dice_rolls": damage_result["rolls_detail"],
                    "modifier": damage_result["modifier"],
                    "type": spell.damage_type,
                }
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ошибка в формуле кубиков урона: {e}",
                ) from e

        return response_data

    @staticmethod
    def process_spell_roll(spell: Spell) -> dict:
        """Обрабатывает просто бросок заклинания (без расхода ячеек)"""
        response_data = {"action": f"Каст: {spell.name}"}

        if getattr(spell, "requires_attack_roll", False):
            d20_roll = random.randint(1, 20)
            bonus = getattr(spell, "spell_attack_bonus", 0)
            response_data["hit_roll"] = {
                "d20_face": d20_roll,
                "bonus": bonus,
                "total": d20_roll + bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            }

        damage_dice = getattr(spell, "damage_dice", None)
        if damage_dice:
            try:
                damage_result = parse_and_roll(damage_dice)
                response_data["damage"] = {
                    "total": damage_result["total"],
                    "dice_rolls": damage_result["rolls_detail"],
                    "modifier": damage_result["modifier"],
                    "type": getattr(spell, "damage_type", "Магический"),
                }
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ошибка в формуле кубиков урона: {e}",
                ) from e

        if not getattr(spell, "requires_attack_roll", False) and not damage_dice:
            response_data["effect"] = (
                "Заклинание применено (без бросков урона/попадания)"
            )

        return response_data

    @staticmethod
    def process_check_roll(action: str, bonus: int) -> dict:
        """Обрабатывает бросок проверки характеристик/навыков"""
        d20_roll = random.randint(1, 20)
        return {
            "action": action,
            "hit_roll": {
                "d20_face": d20_roll,
                "bonus": bonus,
                "total": d20_roll + bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            },
        }