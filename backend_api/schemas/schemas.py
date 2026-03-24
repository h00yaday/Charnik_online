from pydantic import BaseModel, ConfigDict, Field
from typing import Dict, List, Optional

DICE_PATTERN = r"^\s*(?:[+-]?\s*(?:\d+[dD]\d+|\d+)\s*)+$"

class FeatureBase(BaseModel):
    name: str
    description: str
    source: str = "Класс"

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
        pattern=DICE_PATTERN, 
        json_schema_extra={"examples": ["1d8", "2d6+3"]}
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
    description: Optional[str] = None

class SpellCreate(BaseModel):
    name: str
    level: int = 0
    description: Optional[str] = None
    
    requires_attack_roll: bool = False
    spell_attack_bonus: int = 0
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None

class SpellResponse(BaseModel):
    id: int
    name: str
    level: int
    description: Optional[str] = None
    
    requires_attack_roll: bool
    spell_attack_bonus: int
    damage_dice: Optional[str]
    damage_type: Optional[str]
    
    character_id: int

    class Config:
        from_attributes = True

class CharacterBase(BaseModel):
    name: str
    level: int = 1
    race: str = "Человек"
    character_class: str = "Воин"
    subclass: Optional[str] = None
    background: Optional[str] = None

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

    spell_slots: Dict[str, Dict[str, int]] = Field(default_factory=dict) 
    skills: Dict[str, int] = Field(default_factory=dict) 
    saving_throws: Dict[str, int] = Field(default_factory=dict)

class CharacterCreate(CharacterBase):
    pass 

class CharacterResponse(CharacterBase):
    id: int
    owner_id: int
    attacks: List[AttackResponse] = []
    spells: List[SpellResponse] = []
    features: List[FeatureResponse] = []

    model_config = ConfigDict(from_attributes=True)

class CharacterUpdate(BaseModel):
    current_hp: Optional[int] = None
    max_hp: Optional[int] = None
    armor_class: Optional[int] = None
    level: Optional[int] = None
    skills: Optional[Dict[str, int]] = None
    saving_throws: Optional[Dict[str, int]] = None
    spell_slots: Optional[Dict[str, Dict[str, int]]] = None

    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None

class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=3, max_length=72)

class UserResponse(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class HPUpdate(BaseModel):
    current_hp: int