import { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('Explore');
  const [market, setMarket] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState({ id: 1, name: "Janani", balance: 100000 });
  const [portfolio, setPortfolio] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedStock, setSelectedStock] = useState('INFY');
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY');

  const API_BASE_URL = 'http://localhost:8000';

  // Live market dashboard metrics tracking
  useEffect(() => {
    const fetchMarketData = () => {
      fetch(`${API_BASE_URL}/api/market?q=${searchQuery}`)
        .then(res => res.json())
        .then(data => setMarket(data))
        .catch(err => console.error("Market grid lookup disrupted:", err));
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 3000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const refreshUserData = () => {
    fetch(`${API_BASE_URL}/users/1`).then(res => res.json()).then(data => setUser(data));
    fetch(`${API_BASE_URL}/trades/portfolio/1`).then(res => res.json()).then(data => setPortfolio(data));
    fetch(`${API_BASE_URL}/trades/orders/1`).then(res => res.json()).then(data => setOrderHistory(data));
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/trades/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          symbol: selectedStock,
          quantity: parseInt(quantity),
          trade_type: tradeType
        })
      });
      if (res.ok) {
        refreshUserData();
      } else {
        const err = await res.json();
        alert(err.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ backgroundColor: '#0b0b0d', color: '#fff', minHeight: '100vh', fontFamily: 'Segoe UI, Roboto, sans-serif', padding: '30px' }}>
      
      {/* Dynamic Header Module Search Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d25b', letterSpacing: '0.5px' }}>GROWW SANDBOX</div>
        <input 
          type="text" 
          placeholder="🔍 Search stocks (e.g. INFY, BSE, KALYANKJIL)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '400px', padding: '12px 20px', backgroundColor: '#131316', border: '1px solid #2b2b36', borderRadius: '25px', color: '#fff', fontSize: '14px', outline: 'none' }}
        />
      </div>

      {/* Index Summary Banner Panels */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #1e1e24', paddingBottom: '20px', marginBottom: '25px' }}>
        {['NIFTY 50', 'SENSEX'].map(index => {
          const item = market[index] || { price: 0, change: 0, pct: 0 };
          return (
            <div key={index} style={{ backgroundColor: '#131316', padding: '15px 25px', borderRadius: '12px', border: '1px solid #1e1e24', minWidth: '180px' }}>
              <div style={{ fontSize: '13px', color: '#7c7c8c', fontWeight: '600' }}>{index}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '6px 0' }}>₹{item.price ? item.price.toFixed(2) : '---'}</div>
              <div style={{ fontSize: '13px', color: '#00d25b' }}>+{item.change} (+{item.pct}%)</div>
            </div>
          );
        })}
      </div>

      {/* Primary Tab Navigation Grid Components */}
      <div style={{ display: 'flex', gap: '35px', borderBottom: '1px solid #1e1e24', marginBottom: '25px', fontSize: '16px', fontWeight: '600' }}>
        {['Explore', 'Holdings', 'Positions', 'Orders'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ paddingBottom: '12px', cursor: 'pointer', color: activeTab === tab ? '#00d25b' : '#7c7c8c', borderBottom: activeTab === tab ? '3px solid #00d25b' : '3px solid transparent' }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '35px' }}>
        
        {/* left workspace navigation controller cards */}
        <div>
          {activeTab === 'Explore' && (
            <div>
              <h3 style={{ color: '#7c7c8c', fontSize: '13px', marginBottom: '15px', letterSpacing: '0.5px' }}>STOCKS INSIDE MARKET FEED</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {Object.keys(market).filter(k => k !== 'NIFTY 50' && k !== 'SENSEX').map(sym => (
                  <div key={sym} onClick={() => setSelectedStock(sym)} style={{ backgroundColor: '#131316', padding: '20px', borderRadius: '12px', border: selectedStock === sym ? '2px solid #00d25b' : '1px solid #1e1e24', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                      <span>{sym}</span>
                      <span style={{ color: market[sym].pct >= 0 ? '#00d25b' : '#ff5a5a' }}>₹{market[sym].price}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7c7c8c', marginTop: '8px' }}>
                      <span>Equity Shares</span>
                      <span>{market[sym].pct >= 0 ? '+' : ''}{market[sym].pct}%</span>
                    </div>
                  </div>
                ))}
                {Object.keys(market).filter(k => k !== 'NIFTY 50' && k !== 'SENSEX').length === 0 && (
                  <p style={{ color: '#7c7c8c', gridColumn: '1/-1' }}>No matching stock symbols found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Holdings' && (
            <div style={{ backgroundColor: '#131316', padding: '25px', borderRadius: '12px', border: '1px solid #1e1e24' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Your Portfolio Assets</h3>
              {portfolio.length === 0 ? <p style={{ color: '#7c7c8c' }}>Your portfolio is currently empty.</p> : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#7c7c8c', borderBottom: '1px solid #2b2b36', fontSize: '13px' }}>
                      <th style={{ paddingBottom: '12px' }}>STOCK SYMBOL</th>
                      <th>QTY OWNED</th>
                      <th>AVG BUY PRICE</th>
                      <th style={{ textAlign: 'right' }}>CURRENT VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map(p => (
                      <tr key={p.symbol} style={{ borderBottom: '1px solid #1e1e24', fontSize: '15px' }}>
                        <td style={{ padding: '14px 0', fontWeight: '600' }}>{p.symbol}</td>
                        <td>{p.quantity}</td>
                        <td>₹{p.buy_price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: '#00d25b', fontWeight: '600' }}>
                          ₹{(p.quantity * (market[p.symbol]?.price || p.buy_price)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ACTIVE POSITIONS DISPLAY COMPONENT */}
          {activeTab === 'Positions' && (
            <div style={{ backgroundColor: '#131316', padding: '25px', borderRadius: '12px', border: '1px solid #1e1e24' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Intraday Day-Trading Positions</h3>
              {portfolio.length === 0 ? <p style={{ color: '#7c7c8c' }}>No active session positions open.</p> : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#7c7c8c', borderBottom: '1px solid #2b2b36', fontSize: '13px' }}>
                      <th style={{ paddingBottom: '12px' }}>SYMBOL</th>
                      <th>QTY</th>
                      <th>NET COST</th>
                      <th>LIVE VALUE</th>
                      <th style={{ textAlign: 'right' }}>FLOATING P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map(p => {
                      const currentPrice = market[p.symbol]?.price || p.buy_price;
                      const totalCost = p.quantity * p.buy_price;
                      const currentValue = p.quantity * currentPrice;
                      const pnl = currentValue - totalCost;
                      return (
                        <tr key={p.symbol} style={{ borderBottom: '1px solid #1e1e24', fontSize: '15px' }}>
                          <td style={{ padding: '14px 0', fontWeight: '600' }}>{p.symbol}</td>
                          <td>{p.quantity}</td>
                          <td>₹{totalCost.toFixed(2)}</td>
                          <td>₹{currentValue.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', color: pnl >= 0 ? '#00d25b' : '#ff5a5a', fontWeight: '600' }}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ACTIVE ORDER LOG HISTORY AUDIT TRAIL DISPLAY PANEL */}
          {activeTab === 'Orders' && (
            <div style={{ backgroundColor: '#131316', padding: '25px', borderRadius: '12px', border: '1px solid #1e1e24' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Trade Execution History Audit Logs</h3>
              {orderHistory.length === 0 ? <p style={{ color: '#7c7c8c' }}>No logs tracked in this operational environment.</p> : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#7c7c8c', borderBottom: '1px solid #2b2b36', fontSize: '13px' }}>
                      <th style={{ paddingBottom: '12px' }}>TIMESTAMP</th>
                      <th>STOCK</th>
                      <th>TYPE</th>
                      <th>QTY EXEC</th>
                      <th style={{ textAlign: 'right' }}>EXECUTION PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.map((o, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e1e24', fontSize: '14px' }}>
                        <td style={{ padding: '14px 0', color: '#7c7c8c' }}>{o.timestamp}</td>
                        <td style={{ fontWeight: '600' }}>{o.symbol}</td>
                        <td style={{ color: o.type === 'BUY' ? '#00d25b' : '#ff5a5a', fontWeight: 'bold' }}>{o.type}</td>
                        <td>{o.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{o.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Right Workspace Side Form Panel */}
        <div style={{ backgroundColor: '#131316', padding: '25px', borderRadius: '12px', border: '1px solid #1e1e24', height: 'fit-content' }}>
          <div style={{ display: 'flex', marginBottom: '25px', borderRadius: '8px', overflow: 'hidden' }}>
            <button type="button" onClick={() => setTradeType('BUY')} style={{ flex: 1, padding: '12px', backgroundColor: tradeType === 'BUY' ? '#00d25b' : '#1e1e24', color: tradeType === 'BUY' ? '#000' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>BUY</button>
            <button type="button" onClick={() => setTradeType('SELL')} style={{ flex: 1, padding: '12px', backgroundColor: tradeType === 'SELL' ? '#ff5a5a' : '#1e1e24', color: tradeType === 'SELL' ? '#fff' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>SELL</button>
          </div>

          <form onSubmit={handleOrder}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#7c7c8c', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>SYMBOL</label>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#00d25b' }}>{selectedStock}</div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#7c7c8c', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>QUANTITY</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '6px', backgroundColor: '#0b0b0d', border: '1px solid #2b2b36', color: '#fff', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '25px 0', fontSize: '14px' }}>
              <span style={{ color: '#7c7c8c' }}>Estimated Total:</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{((market[selectedStock]?.price || 0) * quantity).toFixed(2)}</span>
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '6px', color: tradeType === 'BUY' ? '#000' : '#fff', backgroundColor: tradeType === 'BUY' ? '#00d25b' : '#ff5a5a', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              Execute {tradeType} Order
            </button>
          </form>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#7c7c8c', textAlign: 'center', borderTop: '1px solid #1e1e24', paddingTop: '15px' }}>
            Available Wallet Cash: <span style={{ color: '#fff', fontWeight: '600' }}>₹{user.balance.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;