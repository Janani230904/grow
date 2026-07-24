from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import random
from datetime import datetime

app = FastAPI(title="Groww Clone Engine Pro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "groww_live.db"

LIVE_MARKET = {
    "NIFTY 50": {"price": 24448.45, "change": 18.10, "pct": 0.07},
    "SENSEX": {"price": 78365.38, "change": 80.31, "pct": 0.10},
    "INFY": {"price": 1850.20, "change": 63.15, "pct": 3.53},
    "BSE": {"price": 3633.10, "change": -169.60, "pct": -4.46},
    "KALYANKJIL": {"price": 358.80, "change": -22.45, "pct": -5.89},
    "KPITTECH": {"price": 1420.00, "change": 18.80, "pct": 1.34},
    "RITES": {"price": 241.73, "change": 25.58, "pct": 11.83},
    "TARC": {"price": 132.39, "change": 7.86, "pct": 6.31}
}

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.on_event("startup")
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        balance REAL NOT NULL
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio (
        user_id INTEGER,
        symbol TEXT,
        quantity INTEGER NOT NULL,
        buy_price REAL NOT NULL,
        PRIMARY KEY (user_id, symbol)
    )""")

    # NEW: Table for tracking complete audit history logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        symbol TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )""")
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (id, name, balance) VALUES (1, 'Janani', 100000.0)")
        conn.commit()
    conn.close()

class TradeRequest(BaseModel):
    user_id: int
    symbol: str
    quantity: int
    trade_type: str

@app.get("/api/market")
def get_live_market(q: str = Query(None)):
    # Fluctuates market stock ticks
    for ticker in LIVE_MARKET:
        move = random.uniform(-0.5, 0.5)
        LIVE_MARKET[ticker]["price"] = round(LIVE_MARKET[ticker]["price"] + move, 2)
    
    # Implements query filtering logic for real-time search engine checks
    if q:
        filtered_market = {k: v for k, v in LIVE_MARKET.items() if q.upper() in k.upper()}
        return filtered_market
    return LIVE_MARKET

@app.get("/users/{user_id}")
def get_user(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, name, balance FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    return {"id": user["id"], "name": user["name"], "balance": user["balance"]}

@app.get("/trades/portfolio/{user_id}")
def get_portfolio(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT symbol, quantity, buy_price FROM portfolio WHERE user_id = ? AND quantity > 0", (user_id,))
    rows = cursor.fetchall()
    return [{"symbol": r["symbol"], "quantity": r["quantity"], "buy_price": r["buy_price"]} for r in rows]

# NEW: Fetches entire tracking list for the Orders execution panel
@app.get("/trades/orders/{user_id}")
def get_orders(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT symbol, quantity, price, type, timestamp FROM orders WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = cursor.fetchall()
    return [{"symbol": r["symbol"], "quantity": r["quantity"], "price": r["price"], "type": r["type"], "timestamp": r["timestamp"]} for r in rows]

@app.post("/trades/execute")
def execute_trade(trade: TradeRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    if trade.symbol not in LIVE_MARKET:
        raise HTTPException(status_code=400, detail="Stock symbol not supported")
        
    current_price = LIVE_MARKET[trade.symbol]["price"]
    total_cost = trade.quantity * current_price

    cursor.execute("SELECT balance FROM users WHERE id = ?", (trade.user_id,))
    user = cursor.fetchone()
    current_balance = user["balance"]

    if trade.trade_type.upper() == "BUY":
        if current_balance < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient wallet funds")
        cursor.execute("UPDATE users SET balance = balance - ? WHERE id = ?", (total_cost, trade.user_id))
        cursor.execute("SELECT quantity, buy_price FROM portfolio WHERE user_id = ? AND symbol = ?", (trade.user_id, trade.symbol))
        holding = cursor.fetchone()
        if holding:
            new_qty = holding["quantity"] + trade.quantity
            new_avg = ((holding["quantity"] * holding["buy_price"]) + total_cost) / new_qty
            cursor.execute("UPDATE portfolio SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?", (new_qty, new_avg, trade.user_id, trade.symbol))
        else:
            cursor.execute("INSERT INTO portfolio (user_id, symbol, quantity, buy_price) VALUES (?, ?, ?, ?)", (trade.user_id, trade.symbol, trade.quantity, current_price))
            
    elif trade.trade_type.upper() == "SELL":
        cursor.execute("SELECT quantity FROM portfolio WHERE user_id = ? AND symbol = ?", (trade.user_id, trade.symbol))
        holding = cursor.fetchone()
        if not holding or holding["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock assets")
        cursor.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (total_cost, trade.user_id))
        if holding["quantity"] == trade.quantity:
            cursor.execute("DELETE FROM portfolio WHERE user_id = ? AND symbol = ?", (trade.user_id, trade.symbol))
        else:
            cursor.execute("UPDATE portfolio SET quantity = quantity - ? WHERE user_id = ? AND symbol = ?", (trade.quantity, trade.user_id, trade.symbol))

    # Append structural row into the tracking audit engine database table
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("INSERT INTO orders (user_id, symbol, quantity, price, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                   (trade.user_id, trade.symbol, trade.quantity, current_price, trade.trade_type.upper(), timestamp_str))
            
    db.commit()
    return {"status": "success"}