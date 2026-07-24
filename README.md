# GrowwLive: Full-Stack Live NSE Stock Simulator Engine

GrowwLive is a full-stack, zero-risk paper trading web application built to simulate real-time stock trading using live market data from the Indian Stock Market (NSE).

## 🚀 Features
- **Live NSE Data Stream:** Integrates real-time stock market pricing tickers via the `yfinance` API engine.
- **Automated Data Polling:** Frontend asynchronously polls the backend API every 10 seconds for updated asset valuations without blocking UI execution.
- **Portfolio & Order Management:** Assigns virtual trial balances to execute real-time Buy and Sell market orders.
- **Transactional Audit Ledger:** Maintains a detailed, time-stamped history of all trade operations (`BUY` and `SELL`).
- **Relational Integrity:** Implements SQLAlchemy ORM over SQLite with server-side validations to calculate average buy prices dynamically and prevent user account overdrafts.

---

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy ORM, SQLite, Pydantic, `yfinance`
- **Frontend:** React.js (Vite), Tailwind CSS

---

## 📂 Directory Structure

```text
groww-demo-sandbox/
├── README.md
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── index.css
