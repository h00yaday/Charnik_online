"""add foreign key indexes

Revision ID: c1e8f35a7b8f
Revises: 84dd276cc5a0
Create Date: 2026-04-24 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1e8f35a7b8f"
down_revision: Union[str, None] = "84dd276cc5a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_characters_owner_id", "characters", ["owner_id"], unique=False)
    op.create_index("ix_attacks_character_id", "attacks", ["character_id"], unique=False)
    op.create_index("ix_spells_character_id", "spells", ["character_id"], unique=False)
    op.create_index("ix_features_character_id", "features", ["character_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_features_character_id", table_name="features")
    op.drop_index("ix_spells_character_id", table_name="spells")
    op.drop_index("ix_attacks_character_id", table_name="attacks")
    op.drop_index("ix_characters_owner_id", table_name="characters")
