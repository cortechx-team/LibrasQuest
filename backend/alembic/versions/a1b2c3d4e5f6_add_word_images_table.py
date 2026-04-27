"""add word_images table

Revision ID: a1b2c3d4e5f6
Revises: 8d2f5f5ca901
Create Date: 2026-03-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8d2f5f5ca901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('dictionary_words', 'hint_image_url_1', schema='learning')
    op.drop_column('dictionary_words', 'hint_image_url_2', schema='learning')
    op.drop_column('dictionary_words', 'hint_image_url_3', schema='learning')

    op.create_table(
        'word_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('word_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=False),
        sa.Column('position', sa.SmallInteger(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['word_id'], ['learning.dictionary_words.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='learning'
    )
    op.create_index('idx_word_images_word_id', 'word_images', ['word_id'], unique=False, schema='learning')


def downgrade() -> None:
    op.drop_index('idx_word_images_word_id', table_name='word_images', schema='learning')
    op.drop_table('word_images', schema='learning')

    op.add_column('dictionary_words', sa.Column('hint_image_url_1', sa.Text(), nullable=True), schema='learning')
    op.add_column('dictionary_words', sa.Column('hint_image_url_2', sa.Text(), nullable=True), schema='learning')
    op.add_column('dictionary_words', sa.Column('hint_image_url_3', sa.Text(), nullable=True), schema='learning')
