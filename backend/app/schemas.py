from datetime import datetime

from pydantic import BaseModel, EmailStr


# Users
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

# Comments
class CommentCreate(BaseModel):
    content: str
    parent_id: int | None = None

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    annotation_id: int
    user_id: int
    content: str
    parent_id: int | None = None
    created_at: datetime
    # We can include user dict directly if needed, or rely on just user_id for simplicity (but user info is nicer for UI)
    user: UserResponse

    class Config:
        from_attributes = True

# Annotations
class AnnotationCreate(BaseModel):
    url: str
    text_selector: str
    selected_text: str
    initial_comment: str

class AnnotationResponse(BaseModel):
    id: int
    user_id: int
    url: str
    text_selector: str
    selected_text: str
    created_at: datetime
    comments: list[CommentResponse] = []
    user: UserResponse

    class Config:
        from_attributes = True
