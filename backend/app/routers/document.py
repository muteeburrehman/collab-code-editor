from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..db import get_db
from ..models.document import Document
from ..schemas.document import DocumentResponse, DocumentCreate, DocumentUpdate
from ..services.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/", response_model=DocumentResponse)
def create_document(
        document: DocumentCreate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    db_document = Document(
        title=document.title,
        content=document.content,
        language=document.language,
        owner_id=current_user.id
    )

    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    return db_document


@router.get("/", response_model=List[DocumentResponse])
def read_documents(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    documents = db.query(Document).filter(Document.owner_id == current_user.id).offset(skip).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def read_document(
        document_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # In a collaborative environment, you might want to check permissions
    # rather than strict ownership
    if document.owner_id != current_user.id:
        # For collaboration, you might implement document sharing instead of 403
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    return document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
        document_id: int,
        document_update: DocumentUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if db_document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this document")

    # Update only fields that were provided
    update_data = document_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_document, key, value)

    db.commit()
    db.refresh(db_document)
    return db_document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
        document_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if db_document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    db.delete(db_document)
    db.commit()
    return None