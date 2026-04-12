
from pydantic import BaseModel, ConfigDict, Field

DICE_PATTERN = r"^\s*(?:[+-]?\s*(?:\d+[dD]\d+|\d+)\s*)+$"


class FeatureBase(BaseModel):
    name: str
    description: str
    source: str = "Класс"
    modifiers: dict[str, int] = Field(default_factory=dict)


class FeatureCreate(FeatureBase):
    pass


class FeatureResponse(FeatureBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)


class AttackBase(BaseModel):
    name: str
    attack_bonus: int = 0
    damage_dice: str = Field(
        pattern=DICE_PATTERN, json_schema_extra={"examples": ["1d8", "2d6+3"]}
    )
    damage_type: str


class AttackCreate(AttackBase):
    pass


class AttackResponse(AttackBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)


class SpellBase(BaseModel):
    name: str
    level: int = 0
    description: str | None = None


class SpellCreate(BaseModel):
    name: str
    level: int = 0
    description: str | None = None

    requires_attack_roll: bool = False
    spell_attack_bonus: int = 0
    damage_dice: str | None = None
    damage_type: str | None = None


class SpellResponse(BaseModel):
    id: int
    name: str
    level: int
    description: str | None = None

    requires_attack_roll: bool
    spell_attack_bonus: int
    damage_dice: str | None
    damage_type: str | None

    character_id: int

    class Config:
        from_attributes = True


class CharacterBase(BaseModel):
    name: str
    level: int = 1
    race: str = "Человек"
    character_class: str = "Воин"
    subclass: str | None = None
    background: str | None = None

    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10

    armor_class: int = 10
    max_hp: int = 10
    current_hp: int = 10
    speed: int = 30
    initiative_bonus: int = 0

    spell_slots: dict[str, dict[str, int]] = Field(default_factory=dict)
    skills: dict[str, int] = Field(default_factory=dict)
    saving_throws: dict[str, int] = Field(default_factory=dict)


class CharacterCreate(CharacterBase):
    pass


class CharacterResponse(CharacterBase):
    id: int
    owner_id: int
    attacks: list[AttackResponse] = []
    spells: list[SpellResponse] = []
    features: list[FeatureResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CharacterUpdate(BaseModel):
    current_hp: int | None = None
    max_hp: int | None = None
    armor_class: int | None = None
    level: int | None = None
    skills: dict[str, int] | None = None
    saving_throws: dict[str, int] | None = None
    spell_slots: dict[str, dict[str, int]] | None = None

    strength: int | None = None
    dexterity: int | None = None
    constitution: int | None = None
    intelligence: int | None = None
    wisdom: int | None = None
    charisma: int | None = None


class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=3, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


class HPUpdate(BaseModel):
    current_hp: int
