from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    characters: Mapped[list["Character"]] = relationship(back_populates="owner")


class Attack(Base):
    __tablename__ = "attacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    attack_bonus: Mapped[int] = mapped_column(default=0)
    damage_dice: Mapped[str] = mapped_column(String(20))
    damage_type: Mapped[str] = mapped_column(String(50))

    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"))
    character: Mapped["Character"] = relationship(back_populates="attacks")


class Spell(Base):
    __tablename__ = "spells"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[int] = mapped_column(default=0)
    description: Mapped[str] = mapped_column(String, nullable=True)

    requires_attack_roll: Mapped[bool] = mapped_column(default=False, server_default="false")
    spell_attack_bonus: Mapped[int] = mapped_column(default=0, server_default="0")
    damage_dice: Mapped[str] = mapped_column(String(20), nullable=True)
    damage_type: Mapped[str] = mapped_column(String(50), nullable=True)

    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"))
    character: Mapped["Character"] = relationship(back_populates="spells")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    level: Mapped[int] = mapped_column(default=1)

    race: Mapped[str] = mapped_column(String(50), server_default="Человек")
    character_class: Mapped[str] = mapped_column(String(50), server_default="Воин")
    subclass: Mapped[str] = mapped_column(String(50), nullable=True)
    background: Mapped[str] = mapped_column(String(50), nullable=True)

    strength: Mapped[int] = mapped_column(default=10)
    dexterity: Mapped[int] = mapped_column(default=10)
    constitution: Mapped[int] = mapped_column(default=10)
    intelligence: Mapped[int] = mapped_column(default=10)
    wisdom: Mapped[int] = mapped_column(default=10)
    charisma: Mapped[int] = mapped_column(default=10)

    skills: Mapped[dict] = mapped_column(JSON, default=dict)

    saving_throws: Mapped[dict] = mapped_column(JSON, default=dict, server_default="{}")

    spell_slots: Mapped[dict] = mapped_column(JSON, default=dict)

    armor_class: Mapped[int] = mapped_column(default=10)
    max_hp: Mapped[int] = mapped_column(default=10)
    current_hp: Mapped[int] = mapped_column(default=10)
    speed: Mapped[int] = mapped_column(server_default="30")
    initiative_bonus: Mapped[int] = mapped_column(server_default="0")

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    owner: Mapped["User"] = relationship(back_populates="characters")

    attacks: Mapped[list["Attack"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    spells: Mapped[list["Spell"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    features: Mapped[list["Feature"]] = relationship(back_populates="character", cascade="all, delete-orphan")


class Feature(Base):
    """Класс для хранения классовых умений, расовых черт и фитов (Feats)"""

    __tablename__ = "features"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String(50))

    modifiers: Mapped[dict] = mapped_column(JSON, default=dict, server_default="{}")

    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"))
    character: Mapped["Character"] = relationship(back_populates="features")
