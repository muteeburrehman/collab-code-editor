from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from ..services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_user_from_refresh_token,
    revoke_refresh_token
)
from datetime import timedelta

router = APIRouter(tags=["authentication"])


@router.post("/token")
def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )

    # Create refresh token
    refresh_token = create_refresh_token(db, user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user_id": user.id,
        "username": user.username
    }


@router.post("/refresh")
def refresh_access_token(
        refresh_token: str = Body(..., embed=True),
        db: Session = Depends(get_db)
):
    """Endpoint to refresh an access token using a refresh token"""
    # Validate refresh token and get user
    user = get_user_from_refresh_token(db, refresh_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
        refresh_token: str = Body(..., embed=True),
        db: Session = Depends(get_db)
):
    """Endpoint to logout by revoking a refresh token"""
    revoked = revoke_refresh_token(db, refresh_token)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )

    return {"message": "Successfully logged out"}