from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from config.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    wallet_balance = Column(Float, default=100000.00)  # Starts with ₹1 Lakh trial cash

class Holding(Base):
    __tablename__ = "holdings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_symbol = Column(String, index=True)
    quantity = Column(Integer, default=0)
    avg_buy_price = Column(Float, default=0.0)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_symbol = Column(String)
    transaction_type = Column(String)  # "BUY" or "SELL"
    quantity = Column(Integer)
    price_per_share = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)