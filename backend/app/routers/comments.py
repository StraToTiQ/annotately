from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas

router = APIRouter(prefix="/api/v1/comments", tags=["Comments"])

@router.post("/{id}/reply", response_model=schemas.CommentResponse)
def reply_to_comment(
    id: int,
    comment_in: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    parent_comment = db.query(models.Comment).filter(models.Comment.id == id).first()
    if not parent_comment:
        raise HTTPException(status_code=404, detail="Parent comment not found")
        
    new_reply = models.Comment(
        annotation_id=parent_comment.annotation_id,
        user_id=current_user.id,
        content=comment_in.content,
        parent_id=id
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    return new_reply

@router.put("/{id}", response_model=schemas.CommentResponse)
def update_comment(
    id: int,
    comment_in: schemas.CommentUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")
    
    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)
    return comment

@router.delete("/{id}")
def delete_comment(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    annotation_id = comment.annotation_id
    
    db.delete(comment)
    db.commit()
    
    # If the comment is deleted, check if the annotation has any comments left
    remaining_comments = db.query(models.Comment).filter(models.Comment.annotation_id == annotation_id).count()
    if remaining_comments == 0:
        annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
        if annotation:
            db.delete(annotation)
            db.commit()
            
    return {"message": "Comment deleted successfully"}
