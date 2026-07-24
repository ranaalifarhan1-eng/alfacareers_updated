"""Initial Database Schema Migration

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-24 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('CANDIDATE', 'EMPLOYER', 'SUPER_ADMIN', name='userrole'), nullable=False, server_default='CANDIDATE'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. Candidate Profiles Table
    op.create_table(
        'candidate_profiles',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('headline', sa.String(length=255), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('experience', sa.JSON(), nullable=True),
        sa.Column('education', sa.JSON(), nullable=True),
        sa.Column('master_cv_url', sa.String(length=512), nullable=True),
    )
    op.create_index(op.f('ix_candidate_profiles_id'), 'candidate_profiles', ['id'], unique=False)

    # 3. Employer Profiles Table
    op.create_table(
        'employer_profiles',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('industry', sa.String(length=255), nullable=True),
        sa.Column('logo_url', sa.String(length=512), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_index(op.f('ix_employer_profiles_id'), 'employer_profiles', ['id'], unique=False)

    # 4. Job Posts Table
    op.create_table(
        'job_posts',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('employer_id', sa.Integer(), sa.ForeignKey('employer_profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('job_type', sa.String(length=100), nullable=True, server_default='Full-time'),
        sa.Column('salary_range', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source_type', sa.Enum('DEEP_WEB', 'GREENHOUSE', 'LEVER', 'WORKABLE', 'DIRECT_EMPLOYER', name='jobsourcetype'), nullable=False, server_default='DEEP_WEB'),
        sa.Column('apply_url', sa.String(length=512), nullable=True),
        sa.Column('apply_email', sa.String(length=255), nullable=True),
        sa.Column('authenticity_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_job_posts_company_name'), 'job_posts', ['company_name'], unique=False)
    op.create_index(op.f('ix_job_posts_id'), 'job_posts', ['id'], unique=False)
    op.create_index(op.f('ix_job_posts_location'), 'job_posts', ['location'], unique=False)
    op.create_index(op.f('ix_job_posts_title'), 'job_posts', ['title'], unique=False)

    # 5. Applications Table
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('candidate_id', sa.Integer(), sa.ForeignKey('candidate_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('job_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.Enum('APPLIED', 'FOLLOWED_UP', 'INTERVIEWED', 'REJECTED', 'OFFERED', name='applicationstatus'), nullable=False, server_default='APPLIED'),
        sa.Column('match_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('track_type', sa.Enum('EMAIL', 'PORTAL', name='applicationtracktype'), nullable=False, server_default='EMAIL'),
        sa.Column('applied_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('follow_up_date', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_applications_id'), 'applications', ['id'], unique=False)

    # 6. Ingest Sources Table
    op.create_table(
        'ingest_sources',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.Enum('DEEP_WEB', 'GREENHOUSE', 'LEVER', 'WORKABLE', 'DIRECT_EMPLOYER', name='jobsourcetype'), nullable=False),
        sa.Column('target_url', sa.String(length=512), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=False, server_default='Pakistan'),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='Finance'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_ingest_sources_id'), 'ingest_sources', ['id'], unique=False)

    # 7. Ingest Runs Table
    op.create_table(
        'ingest_runs',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('source_id', sa.Integer(), sa.ForeignKey('ingest_sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='running'),
        sa.Column('jobs_found', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('jobs_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_ingest_runs_id'), 'ingest_runs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('ingest_runs')
    op.drop_table('ingest_sources')
    op.drop_table('applications')
    op.drop_table('job_posts')
    op.drop_table('employer_profiles')
    op.drop_table('candidate_profiles')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS userrole;')
    op.execute('DROP TYPE IF EXISTS jobsourcetype;')
    op.execute('DROP TYPE IF EXISTS applicationstatus;')
    op.execute('DROP TYPE IF EXISTS applicationtracktype;')
