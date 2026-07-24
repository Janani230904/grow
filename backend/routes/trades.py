from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from models.database_models import User, Holding, Transaction
from schemas.validation import TradeRequest

router = APIRouter(prefix="/api/trade", tags=["Trades"])

@router.post("/buy")
def buy_stock(trade: TradeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == trade.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    total_cost = trade.quantity * trade.price_per_share
    
    # Check if user has enough trial money
    if user.wallet_balance < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient trial balance.")
        
    user.wallet_balance -= total_cost
    
    holding = db.query(Holding).filter(
        Holding.user_id == user.id, 
        Holding.stock_symbol == trade.stock_symbol
    ).first()
    
    if holding:
        # Update running average buy cost mathematically
        total_shares = holding.quantity + trade.quantity
        new_avg_price = ((holding.quantity * holding.avg_buy_price) + total_cost) / total_shares
        holding.quantity = total_shares
        holding.avg_buy_price = new_avg_price
    else:
        # Add new stock holding
        holding = Holding(
            user_id=user.id, 
            stock_symbol=trade.stock_symbol, 
            quantity=trade.quantity, 
            avg_buy_price=trade.price_per_share
        )
        db.add(holding)
        
    # Log transaction ledger entry
    transaction_log = Transaction(
        user_id=user.id,
        stock_symbol=trade.stock_symbol,
        transaction_type="BUY",
        quantity=trade.quantity,
        price_per_share=trade.price_per_share
    )
    db.add(transaction_log)
    db.commit()
    return {"status": "Success", "message": f"Successfully purchased {trade.quantity} shares!"}