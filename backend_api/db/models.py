from sqlalchemy import ForeignKey, String, JSON
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
    
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"))
    character: Mapped["Character"] = relationship(back_populates="spells")

class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    level: Mapped[int] = mapped_column(default=1)

    strength: Mapped[int] = mapped_column(default=10)
    dexterity: Mapped[int] = mapped_column(default=10)
    constitution: Mapped[int] = mapped_column(default=10)
    intelligence: Mapped[int] = mapped_column(default=10)
    wisdom: Mapped[int] = mapped_column(default=10)
    charisma: Mapped[int] = mapped_column(default=10)

    spell_slots: Mapped[dict] = mapped_column(JSON, default=dict)
    skills: Mapped[dict] = mapped_column(JSON, default=dict)

    armor_class: Mapped[int] = mapped_column(default=10)
    max_hp: Mapped[int] = mapped_column(default=10)
    current_hp: Mapped[int] = mapped_column(default=10)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    owner: Mapped["User"] = relationship(back_populates="characters")

    attacks: Mapped[list["Attack"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    spells: Mapped[list["Spell"]] = relationship(back_populates="character", cascade="all, delete-orphan")