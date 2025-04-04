from pydantic import BaseModel
from typing import Optional

class DocumentBase(BaseModel):
    title: str
    language: str = "python"

class DocumentCreate(DocumentBase):
    content: str = ""

class DocumentUpdate(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None
    language: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    content: str
    owner_id: int

    class Config:
        from_attributes = True