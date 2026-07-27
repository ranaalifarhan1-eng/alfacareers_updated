import asyncio
import logging
from sqlalchemy.future import select
from app.db.base import init_db, AsyncSessionLocal
from app.db.models import User, UserRole, CandidateProfile, EmployerProfile, CompanyProfile
from app.core.security import get_password_hash

logger = logging.getLogger("seed_accounts")


async def seed_default_accounts():
    """Generate default pre-verified test accounts for Candidate, Employer, and Super Admin roles."""
    await init_db()

    accounts_data = [
        {
            "email": "candidate@alfacareers.com",
            "password": "Password123!",
            "role": UserRole.CANDIDATE,
            "full_name": "Candidate Demo User",
            "company_name": None
        },
        {
            "email": "employer@alfacareers.com",
            "password": "Password123!",
            "role": UserRole.EMPLOYER,
            "full_name": None,
            "company_name": "TechVerse Solutions Ltd"
        },
        {
            "email": "admin@alfacareers.com",
            "password": "Password123!",
            "role": UserRole.SUPER_ADMIN,
            "full_name": "Platform Super Admin",
            "company_name": None
        }
    ]

    created_summary = []

    async with AsyncSessionLocal() as session:
        for acc in accounts_data:
            # Check existing user
            res = await session.execute(select(User).where(User.email == acc["email"]))
            user = res.scalars().first()

            if not user:
                hashed_pwd = get_password_hash(acc["password"])
                user = User(
                    email=acc["email"],
                    hashed_password=hashed_pwd,
                    role=acc["role"],
                    is_active=True,
                    is_verified=True
                )
                session.add(user)
                await session.flush()
                await session.refresh(user)
                status_str = "CREATED"
            else:
                user.is_verified = True
                user.is_active = True
                user.role = acc["role"]
                user.hashed_password = get_password_hash(acc["password"])
                status_str = "UPDATED/SYNCED"

            # Create/sync Candidate Profile
            if acc["role"] == UserRole.CANDIDATE:
                prof_res = await session.execute(select(CandidateProfile).where(CandidateProfile.user_id == user.id))
                cp = prof_res.scalars().first()
                if not cp:
                    cp = CandidateProfile(
                        user_id=user.id,
                        full_name=acc["full_name"],
                        headline="Performance Marketing Manager",
                        skills=["Google Ads", "Meta Ads", "GA4", "Python"],
                        target_roles=["Performance Marketing Manager", "Digital Marketer"],
                        preferred_locations=["Dubai, UAE", "Lahore, Pakistan", "Remote"]
                    )
                    session.add(cp)

            # Create/sync Employer & Company Profile
            elif acc["role"] == UserRole.EMPLOYER:
                emp_res = await session.execute(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
                ep = emp_res.scalars().first()
                if not ep:
                    ep = EmployerProfile(
                        user_id=user.id,
                        company_name=acc["company_name"],
                        industry="Information Technology & Software",
                        company_size="50-200 Employees",
                        website="https://techverse.com"
                    )
                    session.add(ep)

                comp_res = await session.execute(select(CompanyProfile).where(CompanyProfile.user_id == user.id))
                comp = comp_res.scalars().first()
                if not comp:
                    comp = CompanyProfile(
                        user_id=user.id,
                        company_name=acc["company_name"],
                        industry="Information Technology & Software",
                        company_size="50-200 Employees",
                        website="https://techverse.com",
                        is_verified=True
                    )
                    session.add(comp)

            created_summary.append({
                "email": user.email,
                "role": user.role.value,
                "password": acc["password"],
                "status": status_str,
                "verified": "YES"
            })

        await session.commit()

    # Print Formatted Verification Table in Terminal
    print("\n" + "="*80)
    print("      ALFACAREERS MULTI-TENANT ENTERPRISE SEED ACCOUNTS VERIFICATION")
    print("="*80)
    print(f"{'ROLE':<15} | {'EMAIL':<30} | {'PASSWORD':<15} | {'VERIFIED':<10}")
    print("-" * 80)
    for s in created_summary:
        print(f"{s['role']:<15} | {s['email']:<30} | {s['password']:<15} | {s['verified']:<10}")
    print("="*80)
    print("SUCCESS: 3 Pre-Verified Test Accounts Created & Ready for Portal Logins!\n")


if __name__ == "__main__":
    asyncio.run(seed_default_accounts())
