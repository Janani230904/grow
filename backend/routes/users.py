from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from models.database_models import User, Holding
from schemas.validation import UserCreate

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/register")
def register_user(user_input: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_input.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(username=user_input.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully!", "user": new_user}

@router.get("/portfolio/{username}")
def get_portfolio(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()
    return {
        "username": user.username,
        "wallet_balance": user.wallet_balance,
        "holdings": holdings
    }