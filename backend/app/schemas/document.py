from pydantic import BaseModel
from typing import Optional, List


class DocumentBase(BaseModel):
    title: str
    language: str = "python"
    content: str = ""


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None


class UserBase(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class DocumentResponse(DocumentBase):
    id: int
    owner_id: int
    shared_with: List[UserBase] = []

    class Config:
        from_attributes = True


class DocumentShare(BaseModel):
    username: str