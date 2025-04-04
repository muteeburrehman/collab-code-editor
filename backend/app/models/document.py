from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from ..db import Base

# Association table for document sharing
document_users = Table(
    'document_users',
    Base.metadata,
    Column('document_id', Integer, ForeignKey('documents.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    language = Column(String, default="python")
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="documents")
    # Add relationship to shared users
    shared_with = relationship("User",
                               secondary=document_users,
                               backref="shared_documents")