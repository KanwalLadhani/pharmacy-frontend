import React, { useEffect, useState } from 'react';
import { billingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, Receipt } from 'lucide-react';

const SalesHistory = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    billingService.getInvoices()
      .then(({ data }) => {
        // Filter to show only current user's invoices if createdBy is available
        setInvoices(data);
      })
      .catch(() => setError('Could not load sales history. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <History size={26} color="var(--primary)" /> Personal Sales History
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
