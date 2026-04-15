
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas

router = APIRouter(prefix="/api/v1/annotations", tags=["Annotations"])

@router.get("", response_model=list[schemas.AnnotationResponse])
def get_annotations(url: str, db: Session = Depends(database.get_db)):
    annotations = db.query(models.Annotation).filter(models.Annotation.url == url).all()
    return annotations

@router.post("", response_model=schemas.AnnotationResponse)
def create_annotation(
    annotation: schemas.AnnotationCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Create the annotation
    db_annotation = models.Annotation(
        url=annotation.url,
        text_selector=annotation.text_selector,
        selected_text=annotation.selected_text,
        user_id=current_user.id
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    
    # Create the initial comment associated with this annotation
    db_comment = models.Comment(
        annotation_id=db_annotation.id,
        user_id=current_user.id,
        content=annotation.initial_comment
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_annotation) # Refresh to fetch relationships if needed
    
    return db_annotation

@router.post("/{id}/comments", response_model=schemas.CommentResponse)
def add_comment_to_annotation(
    id: int,
    comment_in: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    annotation = db.query(models.Annotation).filter(models.Annotation.id == id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
        
    new_comment = models.Comment(
        annotation_id=id,
        user_id=current_user.id,
        content=comment_in.content,
        parent_id=None
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
