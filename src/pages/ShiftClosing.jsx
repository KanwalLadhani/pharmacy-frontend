import React, { useEffect, useState } from 'react';
import { billingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, CreditCard, Banknote, Printer } from 'lucide-react';

const ShiftClosing = () => {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState({ total: 0, loading: true });
  const [dateStr, setDateStr] = useState('');

  const getLocalNow = (date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date - tzOffset)).toISOString().slice(0, 16) + ':00';
  };

  useEffect(() => {
    const now = new Date();
    setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    // Start of today to end of today
    const start = getLocalNow(new Date(now.setHours(0,0,0,0)));
    const end = getLocalNow(new Date(now.setHours(23,59,59,999)));

    // Fetch the summary
    billingService.getSalesSummary(start, end)
      .then(({ data }) => setSalesData({ total: data || 0, loading: false }))
      .catch((err) => {
        console.error("Failed to load shift sales", err);
        setSalesData({ total: 0, loading: false });
      });
  }, []);

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <style>
        {`
          @media print {
            .sidebar, .page-header, .no-print { display: none !important; }
            body, .app-container, .main-content { background: white !important; padding: 0 !important; margin: 0 !important; }
            .print-area { width: 100% !important; border: none !important; box-shadow: none !important; color: black !important; padding: 0 !important; }
          }
        `}
      </style>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Shift Closing</h1>
        <button className="btn-secondary no-print" onClick={() => window.print()}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }} className="print-area">
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '8px' }}>Medi-Store</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Cashier Shift Report</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <Calendar size={14} /> {dateStr}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Cashier: <strong>{user?.username}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--border-glass)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
                <Banknote size={24} color="#10b981" /> Cash Collected
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                {salesData.loading ? '...' : fmt(salesData.total)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                <CreditCard size={24} /> Digital Payments
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                {salesData.loading ? '...' : fmt(0)}
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>
                <Banknote size={28} /> Total Shift Sales
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)' }}>
                {salesData.loading ? '...' : fmt(salesData.total)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Generated on: {new Date().toLocaleString()}</span>
            <span style={{ fontStyle: 'italic' }}>System approximates 100% Cash</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftClosing;
