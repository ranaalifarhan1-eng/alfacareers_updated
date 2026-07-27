import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, Float, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    CANDIDATE = "candidate"
    EMPLOYER = "employer"


class JobSourceType(str, enum.Enum):
    SYNDICATED = "syndicated"
    DEEP_WEB = "deep_web"
    EMPLOYER_DIRECT = "employer_direct"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # 6-Digit Email OTP Verification Fields
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    employer_profile = relationship("EmployerProfile", back_populates="user", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)
    applications = relationship("ApplicationTrack", back_populates="candidate")
    uploaded_cvs = relationship("CandidateCV", back_populates="user")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    
    # JSON list of skills (e.g. ["Python", "FastAPI"])
    skills = Column(JSON, default=list)
    
    # JSON list of past experience objects
    experience = Column(JSON, default=list)
    
    # JSON list of education objects
    education = Column(JSON, default=list)

    # Section 5: Job Preferences & Salary Structure
    target_roles = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)
    job_type = Column(String, default="Full-Time")
    notice_period = Column(String, default="Immediate")
    expected_salary = Column(String, default="Negotiable")
    
    expected_salary_currency = Column(String, default="AED")
    expected_salary_amount = Column(String, default="15,000")
    expected_salary_frequency = Column(String, default="Monthly")
    is_salary_negotiable = Column(Boolean, default=True)

    # Section 6: AI Analytics & Summary
    total_experience_years = Column(String, default="0.0 Years")
    ai_executive_summary = Column(Text, nullable=True)
    
    # Raw Master CV Content or storage URL
    master_cv_url = Column(Text, nullable=True)

    user = relationship("User", back_populates="candidate_profile")


class CandidateCV(Base):
    __tablename__ = "candidate_cvs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    parsed_json = Column(JSON, default=dict)
    is_primary = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="uploaded_cvs")


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    company_name = Column(String, nullable=False)
    company_logo = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="company_profile")
    job_posts = relationship("JobPost", back_populates="company")


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="employer_profile")
    job_posts = relationship("JobPost", back_populates="employer")


class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("employer_profiles.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id"), nullable=True)
    
    title = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    job_type = Column(String, default="Full-time")
    salary_range = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    
    source_type = Column(Enum(JobSourceType), default=JobSourceType.DEEP_WEB)
    apply_url = Column(String, nullable=True)
    apply_email = Column(String, nullable=True)
    
    authenticity_score = Column(Float, default=95.0)
    is_published = Column(Boolean, default=True)
    status = Column(String, default="published")  # draft, pending_approval, published, closed
    vector_indexed = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employer = relationship("EmployerProfile", back_populates="job_posts")
    company = relationship("CompanyProfile", back_populates="job_posts")
    applications = relationship("ApplicationTrack", back_populates="job")


class ApplicationTrack(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_posts.id"), nullable=False)
    
    status = Column(String, default="applied")
    match_score = Column(Float, default=0.0)
    track_type = Column(String, default="email")
    
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("User", back_populates="applications")
    job = relationship("JobPost", back_populates="applications")
