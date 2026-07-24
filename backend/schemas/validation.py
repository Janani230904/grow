from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str

class TradeRequest(BaseModel):
    username: str
    stock_symbol: str
    quantity: int
    price_per_share: float