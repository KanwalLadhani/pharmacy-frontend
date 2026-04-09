import React, { useEffect, useState } from 'react';
import { billingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, Receipt } from 'lucide-react';

const SalesHistory = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setLoading(true);
    billingService.getInvoices(page, 15)
      .then(({ data }) => {
        setInvoices(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      })
      .catch((err) => {
        console.error("Sales History Error:", err);
        setError('Sales history data is currently unavailable. Please ensure the backend service is running and properly connected.');
      })
      .finally(() => setLoading(false));
  }, [page]);

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading sales history…</div>;
  if (error) return <div style={{ color: '#ef4444', padding: '40px' }}>{error}</div>;

  const totalSales = invoices.reduce((acc, inv) => inv.returned ? acc : acc + (inv.totalAmount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={26} color="var(--primary)" /> Sales History
        </h1>
        <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Revenue</span>
          <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>{fmt(totalSales)}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Receipt size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No sales recorded yet.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date / Time</th>
                <th>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                {user?.role === 'ROLE_ADMIN' && <th style={{ textAlign: 'right' }}>Net Profit</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {inv.date ? formatDate(inv.date) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {(() => {
                        const effectiveItems = inv.items?.filter(item => 
                          (item.quantity - (item.returnedQuantity || 0)) > 0
                        ).length || 0;
                        const hasReturns = inv.items?.some(item => (item.returnedQuantity || 0) > 0);
                        const isFullyReturned = inv.returned || (inv.items?.length > 0 && effectiveItems === 0);

                        return (
                          <>
                            <span className={`badge ${effectiveItems > 0 ? 'badge-success' : 'badge-secondary'}`}>
                              {effectiveItems} items
                            </span>
                            {isFullyReturned ? (
                              <span className="badge badge-danger">RETURNED</span>
                            ) : hasReturns ? (
                              <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>PARTIAL RETURN</span>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(inv.totalAmount)}</td>
                  {user?.role === 'ROLE_ADMIN' && (
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                      {inv.returned ? '—' : fmt(inv.totalProfit)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', marginTop: '24px' }}>
          <button 
            className="btn-secondary" 
            disabled={page === 0} 
            onClick={() => setPage(prev => prev - 1)}
            style={{ padding: '8px 20px' }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button 
            className="btn-secondary" 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(prev => prev + 1)}
            style={{ padding: '8px 20px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
