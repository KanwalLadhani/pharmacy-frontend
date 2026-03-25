import React, { useState, useEffect } from 'react';
import { inventoryService, billingService } from '../services/api';
import { Plus, Trash2, ShoppingCart, Search, Printer, CheckCircle, Info, AlertTriangle, X, FileSearch } from 'lucide-react';

const Billing = () => {
  const [medicines, setMedicines]      = useState([]);
  const [cart, setCart]                = useState([]);
  const [selectedMed, setSelectedMed]  = useState(null);
  const [alternates, setAlternates]    = useState([]);
  const [searchQuery, setSearchQuery]  = useState('');
  const [quantity, setQuantity]        = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAlternates, setLoadingAlternates] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  
  // Invoice Search state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [invoiceSearchError, setInvoiceSearchError] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

  // Debounced search for medicines
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1 && (!selectedMed || selectedMed.brandName !== searchQuery)) {
        setLoadingSearch(true);
        inventoryService.search(searchQuery)
          .then(res => {
              const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
              setMedicines(list.slice(0, 50));
          })
          .finally(() => setLoadingSearch(false));
      } else if (searchQuery.trim().length <= 1) {
        setMedicines([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMed]);

  const selectMedicine = async (med) => {
    setSelectedMed(med);
    setSearchQuery(med.brandName);
    setMedicines([]);
    setQuantity(1);
    
    // Fetch alternates based on salt formula
    setLoadingAlternates(true);
    try {
      const res = await inventoryService.getAlternates(med.brandId);
      setAlternates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch alternates", err);
      setAlternates([]);
    } finally {
      setLoadingAlternates(false);
    }
  };

  const addToCart = (med = selectedMed, qty = quantity) => {
    if (!med || qty < 1) return;
    const q = parseInt(qty);

    if (q > (med.quantity ?? 0)) {
      alert(`Only ${med.quantity ?? 0} units available for "${med.brandName}"`);
      return;
    }

    const unitPrice = Number(med.price || 0);

    setCart(prev => {
      const exists = prev.find(i => i.medicineId === med.brandId);
      return exists
        ? prev.map(i => i.medicineId === med.brandId
            ? { ...i, quantity: i.quantity + q }
            : i)
        : [...prev, {
            medicineId:   med.brandId,
            brandName:    med.brandName,
            generic:      med.generic      || '',
            manufacturer: med.manufacturer  || '',
            unitPrice,
            quantity:     q,
          }];
    });

    if (med === selectedMed) {
      setSelectedMed(null);
      setSearchQuery('');
      setQuantity(1);
      setAlternates([]);
    }
    setCheckoutSuccess(false);
  };

  const removeFromCart = (id) => setCart(p => p.filter(i => i.medicineId !== id));

  const totalAmount = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const checkout = async () => {
    if (!cart.length) return;
    try {
      const res = await billingService.createInvoice({
        items: cart.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
      });
      setCheckoutSuccess(true);
      setGeneratedInvoice(res.data);
      // Add to recent invoices
      setRecentInvoices(prev => {
        const newInvoice = { invoiceNumber: res.data.invoiceNumber, totalAmount: res.data.totalAmount };
        const updated = [newInvoice, ...prev.filter(inv => inv.invoiceNumber !== newInvoice.invoiceNumber)];
        return updated.slice(0, 5); // Keep only the 5 most recent
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed. Try again.');
    }
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutSuccess(false);
    setGeneratedInvoice(null);
    setSearchQuery('');
    setAlternates([]);
  };

  const handleSearchInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!invoiceSearchQuery.trim()) return;
    setIsSearchingInvoice(true);
    setInvoiceSearchError('');
    setSearchedInvoice(null);
    try {
      const res = await billingService.getInvoiceByNumber(invoiceSearchQuery);
      setSearchedInvoice(res.data);
    } catch (err) {
      setInvoiceSearchError('Invoice not found. Please check the ID.');
    } finally {
      setIsSearchingInvoice(false);
    }
  };

  const handleReturn = async () => {
    if (!searchedInvoice) return;
    setIsSearchingInvoice(true);
    try {
      await billingService.returnInvoice(searchedInvoice.invoiceNumber);
      alert('Return processed successfully! Inventory has been updated.');
      setShowSearchModal(false);
      setShowReturnConfirm(false);
      setSearchedInvoice(null);
      setInvoiceSearchQuery('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return.');
    } finally {
      setIsSearchingInvoice(false);
    }
  };

  return (
    <div>
      <style>
        {`
          @media print {
            .sidebar, .page-header, .medicine-picker, .no-print, .alternates-section { display: none !important; }
            body, .app-container, .main-content { background: white !important; padding: 0 !important; margin: 0 !important; }
            .print-area { width: 100% !important; border: none !important; box-shadow: none !important; color: black !important; padding: 0 !important; }
            .print-border { border-color: #ddd !important; }
            .invoice-title { display: block !important; margin-bottom: 20px; font-size: 24px; font-weight: bold; text-align: center; }
          }
          .invoice-title { display: none; }
          .suggestion-card {
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
          }
          .suggestion-card:hover { border-color: var(--primary); background: #f1f5f9; }
        `}
      </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Billing & Checkout</h1>
        <button className="btn-secondary" onClick={() => setShowSearchModal(true)}>
          <FileSearch size={18} /> Returns & Search
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 2fr) minmax(280px, 1.2fr)', gap: '24px' }}>

        <div className="glass-card medicine-picker" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--primary)' }}>Select Medicine</h2>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>Search Medicine Name</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Type medicine name..." 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (selectedMed) {
                      setSelectedMed(null);
                      setAlternates([]);
                    }
                  }}
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              {searchQuery.trim().length > 1 && !selectedMed && (
                <div className="glass-card" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, maxHeight: '240px', overflowY: 'auto' }}>
                  {loadingSearch ? (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching...</div>
                  ) : medicines.length > 0 ? (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {medicines.map(med => (
                        <li 
                          key={med.brandId} 
                          style={{ 
                            padding: '10px 14px', borderBottom: '1px solid var(--border-color)', 
                            cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => selectMedicine(med)}
                        >
                          <div style={{ fontWeight: '600', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{med.brandName}</span>
                            <span className={`badge ${med.quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                              {med.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                            <span>PKR {Number(med.price || 0).toFixed(2)}</span>
                            <span>Salt: {med.generic || 'N/A'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No medicines found.</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ width: '90px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>Qty</label>
              <input type="number" min="1" className="input-field" value={quantity}
                onChange={e => setQuantity(e.target.value)} disabled={!selectedMed} />
            </div>
            <div style={{ paddingTop: '24px' }}>
              <button className="btn-primary" onClick={() => addToCart()} style={{ whiteSpace: 'nowrap' }} disabled={!selectedMed || selectedMed.quantity <= 0}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {selectedMed && (
            <div className="animate-fade-in" style={{ marginTop: '20px' }}>
              <div style={{ padding: '16px', background: selectedMed.quantity <= 0 ? '#fff1f2' : '#f0f9ff', border: `1px solid ${selectedMed.quantity <= 0 ? '#fecaca' : '#bae6fd'}`, borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: selectedMed.quantity <= 0 ? '#991b1b' : '#075985' }}>{selectedMed.brandName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Generic: <strong>{selectedMed.generic || 'N/A'}</strong></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--success)' }}>PKR {Number(selectedMed.price || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: selectedMed.quantity <= 0 ? '#ef4444' : 'var(--text-muted)' }}>
                      Available: <strong>{selectedMed.quantity} units</strong>
                    </div>
                  </div>
                </div>

                {selectedMed.quantity <= 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', color: '#dc2626', fontSize: '0.87rem', fontWeight: '500' }}>
                    <AlertTriangle size={16} /> This medicine is currently out of stock.
                  </div>
                )}
              </div>

              <div className="alternates-section" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Info size={16} /> 
                  {selectedMed.quantity <= 0 ? 'Suggested Alternates (Same Salt Formula)' : 'Other brands with same formula'}
                </h3>
                
                {loadingAlternates ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading matches...</div>
                ) : alternates.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {alternates.map(alt => (
                      <div key={alt.brandId} className="suggestion-card">
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{alt.brandName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {alt.manufacturer || 'Unknown'} · {alt.quantity} in stock</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--success)' }}>PKR {Number(alt.price || 0).toFixed(2)}</span>
                          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => addToCart(alt, quantity)}>
                            <Plus size={14} /> Add {quantity > 1 ? `(${quantity})` : ''}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.87rem', border: '1px dashed var(--border-color)' }}>
                    No other matches found for this salt formula.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card print-area" style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignSelf: 'start',
          position: 'sticky',
          top: '24px'
        }}>
          <div className="invoice-title">Medi-Store - Official Invoice</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} color="var(--primary)" /> 
              {checkoutSuccess ? `Final Invoice ${generatedInvoice?.invoiceNumber ? '#' + generatedInvoice.invoiceNumber : ''}` : 'Current Invoice'}
            </h2>
            {checkoutSuccess && <span className="badge badge-success no-print"><CheckCircle size={14} style={{ marginRight: '4px' }} /> Paid</span>}
          </div>

          <div style={{ flex: 1, minHeight: '200px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }} className="no-print">
                <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '12px' }} />
                <p>Invoice is empty</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                 <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }} className="print-border">
                       <th style={{ paddingBottom: '8px', fontWeight: '500' }}>Item</th>
                       <th style={{ paddingBottom: '8px', fontWeight: '500', textAlign: 'right' }}>Qty</th>
                       <th style={{ paddingBottom: '8px', fontWeight: '500', textAlign: 'right' }}>Price</th>
                       <th style={{ paddingBottom: '8px', fontWeight: '500', textAlign: 'right' }}>Total</th>
                       {!checkoutSuccess && <th className="no-print"></th>}
                    </tr>
                 </thead>
                 <tbody>
                    {cart.map(item => (
                       <tr key={item.medicineId} style={{ borderBottom: '1px dashed var(--border-color)' }} className="print-border">
                          <td style={{ padding: '12px 0' }}>
                             <div style={{ fontWeight: '600' }}>{item.brandName}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.generic}</div>
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700' }}>
                             {(item.unitPrice * item.quantity).toFixed(2)}
                          </td>
                          {!checkoutSuccess && (
                             <td style={{ padding: '12px 0', textAlign: 'right' }} className="no-print">
                                <button className="btn-danger" style={{ padding: '4px', borderRadius: '4px' }} onClick={() => removeFromCart(item.medicineId)}>
                                  <Trash2 size={14} />
                                </button>
                             </td>
                          )}
                       </tr>
                    ))}
                 </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid var(--text-main)' }} className="print-border">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>PKR {totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#10b981', fontWeight: '600' }}>
                <span>Default Discount (10%)</span>
                <span>- PKR {(totalAmount * 0.1).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                <span style={{ fontWeight: '700' }}>Grand Total</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1' }}>
                  PKR {(totalAmount * 0.9).toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Items count: {cart.length}</div>
            </div>
            
            {!checkoutSuccess ? (
              <button
                className="btn-primary no-print"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                onClick={checkout}
                disabled={cart.length === 0}
              >
                Complete Checkout
              </button>
            ) : (
              <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
                 <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => window.print()}>
                    <Printer size={16} /> Print Receipt
                 </button>
                 <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={clearCart}>
                    New Invoice
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Search & Returns Modal */}
      {showSearchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '32px', position: 'relative', background: 'white', color: 'var(--text-main)' }}>
            <button onClick={() => { setShowSearchModal(false); setInvoiceSearchQuery(''); setSearchedInvoice(null); setInvoiceSearchError(''); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileSearch size={22} color="var(--primary)" /> Returns & Search</h2>
            
            <form onSubmit={handleSearchInvoice} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter Invoice Number (e.g. INV-2026...)" 
                value={invoiceSearchQuery} 
                onChange={(e) => setInvoiceSearchQuery(e.target.value)} 
                style={{ flex: 1, fontSize: '1.1rem', padding: '12px' }} 
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={isSearchingInvoice} style={{ padding: '0 24px' }}>{isSearchingInvoice ? '...' : 'Search'}</button>
            </form>

            {!searchedInvoice && !isSearchingInvoice && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Invoices</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentInvoices.length > 0 ? recentInvoices.map(inv => (
                    <button 
                      key={inv.invoiceNumber}
                      onClick={async () => { 
                        setInvoiceSearchQuery(inv.invoiceNumber); 
                        setIsSearchingInvoice(true);
                        setInvoiceSearchError('');
                        try {
                          const res = await billingService.getInvoiceByNumber(inv.invoiceNumber);
                          setSearchedInvoice(res.data);
                        } catch (err) {
                          setInvoiceSearchError('Invoice not found. Please check the ID.');
                        } finally {
                          setIsSearchingInvoice(false);
                        }
                      }}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {inv.invoiceNumber.split('-').pop()} (PKR {inv.totalAmount.toFixed(0)})
                    </button>
                  )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No recent invoices found.</span>}
                </div>
              </div>
            )}

            {invoiceSearchError && (
              <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem', padding: '10px', background: '#fef2f2', borderRadius: '8px' }}>
                {invoiceSearchError}
              </div>
            )}

            {searchedInvoice && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>#{searchedInvoice.invoiceNumber}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(searchedInvoice.date).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Subtotal: PKR {((searchedInvoice.totalAmount || 0) / 0.9).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
                      Discount (10%): - PKR {((searchedInvoice.totalAmount || 0) / 0.9 * 0.1).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: searchedInvoice.returned ? '#ef4444' : 'var(--success)', marginTop: '4px' }}>
                      PKR {searchedInvoice.totalAmount.toFixed(2)}
                    </div>
                    <span className={`badge badge-${searchedInvoice.returned ? 'danger' : 'success'}`}>
                      {searchedInvoice.returned ? 'RETURNED / REFUNDED' : 'PAID'}
                    </span>
                  </div>
                </div>

                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ paddingBottom: '6px' }}>Item</th>
                        <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Qty</th>
                        <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedInvoice.items?.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.medicine?.brandName || 'Unknown Item'}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>{(item.price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!searchedInvoice.returned && !showReturnConfirm && (
                  <button 
                    className="btn-danger" 
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', gap: '8px' }}
                    onClick={() => setShowReturnConfirm(true)}
                  >
                    <Trash2 size={16} /> Process Full Return & Refund
                  </button>
                )}

                {showReturnConfirm && (
                  <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '12px', border: '1px solid #fda4af', textAlign: 'center' }}>
                    <div style={{ color: '#be123c', fontWeight: '700', marginBottom: '12px', fontSize: '0.9rem' }}>Are you sure? This action will restock items and refund PKR {searchedInvoice.totalAmount.toFixed(2)}.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-danger" style={{ flex: 1, padding: '10px' }} onClick={handleReturn} disabled={isSearchingInvoice}>Yes, Confirm Return</button>
                      <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => setShowReturnConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
