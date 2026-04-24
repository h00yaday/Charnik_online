from types import SimpleNamespace

import pytest

from schemas.schemas import CharacterCreate, SpellSlot, UserCreate
from services.character_service import CharacterService
from services.combat_service import CombatService
from services.domain_exceptions import ValidationDomainError


def test_spell_slot_invariant_rejects_used_gt_total():
    with pytest.raises(ValueError):
        SpellSlot(total=1, used=2)


def test_password_policy_requires_letters_and_digits():
    with pytest.raises(ValueError):
        UserCreate(username="hero123", password="aaaaaaaaaaaa")
    UserCreate(username="hero123", password="aaaaaaa11111")


def test_character_create_hp_invariant():
    with pytest.raises(ValueError):
        CharacterCreate(
            name="Hero",
            level=1,
            race="Human",
            character_class="Fighter",
            max_hp=10,
            current_hp=11,
        )


def test_user_password_min_len_12():
    with pytest.raises(ValueError):
        UserCreate(username="hero123", password="short")


def test_apply_feature_modifiers_clamps_values():
    character = SimpleNamespace(
        strength=40,
        dexterity=0,
        constitution=10,
        intelligence=10,
        wisdom=10,
        charisma=10,
        armor_class=999,
        max_hp=-5,
        current_hp=999,
        speed=30,
        initiative_bonus=0,
    )
    CharacterService.apply_feature_modifiers(character, {"strength": 0})
    assert character.strength == 30
    assert character.max_hp == 1
    assert character.current_hp == 1
    assert character.armor_class == 50


def test_normalize_spell_slots_rejects_invalid_shape():
    with pytest.raises(ValidationDomainError):
        CharacterService.normalize_character_patch({"spell_slots": {"1": {"foo": 1}}})


def test_combat_service_spell_slots_fail_safe():
    spell = SimpleNamespace(
        name="Fire Bolt",
        level=1,
        requires_attack_roll=False,
        spell_attack_bonus=0,
        damage_dice=None,
        damage_type=None,
    )
    character = SimpleNamespace(spell_slots={"1": {"foo": 1}})
    with pytest.raises(ValidationDomainError):
        CombatService.process_spell_cast(spell, character, cast_level=1)


def test_parse_roll_check_validates_action_and_bonus():
    with pytest.raises(ValidationDomainError):
        CharacterService.parse_roll_check("   ", 2)
    with pytest.raises(ValidationDomainError):
        CharacterService.parse_roll_check("Проверка", 999)
    action, bonus = CharacterService.parse_roll_check("  Проверка ловкости  ", 5)
    assert action == "Проверка ловкости"
    assert bonus == 5
