"""add composite index on characters owner_id and id

Revision ID: 6ab3432e79b8
Revises: 285f7a762bd6
Create Date: 2026-05-04 19:42:32.983471

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ab3432e79b8'
down_revision: Union[str, None] = '285f7a762bd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create composite index on (owner_id, id) for faster lookups
    op.create_index(
        'ix_characters_owner_id_id',
        'characters',
        ['owner_id', 'id'],
    )


def downgrade() -> None:
    # Drop composite index on (owner_id, id)
    op.drop_index(
        'ix_characters_owner_id_id',
        table_name='characters',
    )
