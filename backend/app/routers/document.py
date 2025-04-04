from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..db import get_db
from ..models.document import Document
from ..schemas.document import DocumentResponse, DocumentCreate, DocumentUpdate, DocumentShare
from ..services.auth import get_current_user
from ..models.user import User

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
    # Get both owned documents and shared documents
    owned_documents = db.query(Document).filter(Document.owner_id == current_user.id).all()

    # Get documents shared with the user
    shared_documents = db.query(Document).filter(
        Document.shared_with.any(id=current_user.id)
    ).all()

    # Combine both lists
    all_documents = owned_documents + shared_documents

    return all_documents[skip:skip + limit]


@router.get("/{document_id}", response_model=DocumentResponse)
def read_document(
        document_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if the user is the owner or the document is shared with them
    if document.owner_id != current_user.id and current_user.id not in [user.id for user in document.shared_with]:
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

    # Allow both owners and collaborators to update the document
    if db_document.owner_id != current_user.id and current_user.id not in [user.id for user in db_document.shared_with]:
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

    # Only owners can delete documents
    if db_document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    db.delete(db_document)
    db.commit()
    return None


# New endpoint for sharing documents
@router.post("/{document_id}/share", response_model=DocumentResponse)
def share_document(
        document_id: int,
        share_data: DocumentShare,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    # Get the document
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Only the owner can share the document
    if document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to share this document")

    # Get the user to share with
    user_to_share_with = db.query(User).filter(User.username == share_data.username).first()
    if user_to_share_with is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Add the user to the shared_with relationship if not already there
    if user_to_share_with not in document.shared_with:
        document.shared_with.append(user_to_share_with)
        db.commit()
        db.refresh(document)

    return document