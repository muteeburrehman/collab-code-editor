from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship

from ..db import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    expires = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    revoked = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationship to User model
    user = relationship("User", back_populates="refresh_tokens")