from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db  # Relative import
from ..models.user import User  # Relative import
from ..schemas.user import UserResponse, UserCreate  # Relative import
from ..services.auth import hash_password  # Relative import

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db:Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, hashed_password=hashed_pw)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user