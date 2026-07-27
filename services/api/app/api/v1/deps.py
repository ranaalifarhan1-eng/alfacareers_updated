from fastapi import Depends, HTTPException, status
from app.db.models import User, UserRole
from app.api.v1.endpoints.auth import get_current_user


async def require_candidate(current_user: User = Depends(get_current_user)) -> User:
    """Ensure authenticated user is a Candidate or Admin."""
    if current_user.role not in [UserRole.CANDIDATE, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Access restricted to Candidate accounts."
        )
    return current_user


async def require_employer(current_user: User = Depends(get_current_user)) -> User:
    """Ensure authenticated user is an Employer or Admin."""
    if current_user.role not in [UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Access restricted to Employer accounts."
        )
    return current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure authenticated user is a Super Admin or Platform Admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Access restricted to Platform Super Admin."
        )
    return current_user
