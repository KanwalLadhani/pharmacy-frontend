import React, { useEffect, useState } from 'react';
import { dashboardService, billingService } from '../services/api';
import { LayoutDashboard, Banknote, AlertTriangle, TrendingUp, Calendar, Filter, Trash2, RefreshCcw, Printer } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ background: `${color}22`, padding: '16px', borderRadius: '12px', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: '700' }}>{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ totalMedicines: 0, totalSales: 0, totalInventoryValue: 0, lowStockItems: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Clear Sales Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  
  // Helper to get local ISO date string with seconds (YYYY-MM-DDTHH:mm:ss)
  const getLocalNow = (date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date - tzOffset)).toISOString().slice(0, 16) + ':00';
  };

  // Custom Sales Reporting State
  const [salesReport, setSalesReport] = useState({ total: 0, loading: false });
  const [dateRange, setDateRange] = useState({ 
    start: getLocalNow(new Date(new Date().setHours(0,0,0,0))), 
    end: getLocalNow() 
  });
  const [rangeLabel, setRangeLabel] = useState('Today');

  useEffect(() => {
    fetchMainStats();
    fetchPeriodSales(dateRange.start, dateRange.end);
  }, []);

  const fetchMainStats = () => {
    dashboardService.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load dashboard. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  const fetchPeriodSales = (start, end) => {
    setSalesReport(p => ({ ...p, loading: true }));
    billingService.getSalesSummary(start, end)
      .then(({ data }) => setSalesReport({ total: data, loading: false }))
      .catch(err => {
        console.error("Sales report error", err);
        setSalesReport({ total: 0, loading: false });
      });
  };

  const setRange = (type) => {
    const now = new Date();
    let start, end = getLocalNow(now);
    let label = '';

    if (type === 'today') {
      start = getLocalNow(new Date(now.setHours(0,0,0,0)));
      label = 'Today';
    } else if (type === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      start = getLocalNow(weekAgo);
      label = 'Last 7 Days';
    } else if (type === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      start = getLocalNow(monthAgo);
      label = 'Last 30 Days';
    }
    
    setDateRange({ start, end });
    setRangeLabel(label);
    fetchPeriodSales(start, end);
  };

  const handleCustomRange = () => {
    setRangeLabel('Custom Range');
    fetchPeriodSales(dateRange.start, dateRange.end);
  };

  const handleClearSales = async () => {
    setIsClearing(true);
    try {
      await billingService.clearSales();
      setClearSuccess(true);
      fetchMainStats();
      setRange('today');
      setTimeout(() => {
        setIsClearModalOpen(false);
        setClearSuccess(false);
        setIsClearing(false);
      }, 2000);
    } catch (err) {
      alert("Failed to clear sales history.");
      setIsClearing(false);
    }
  };

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading dashboard…</div>;
  if (error)   return <div style={{ color: '#ef4444', padding: '40px' }}>{error}</div>;

  return (
    <div>
      <style>
        {`
          @media print {
            .sidebar, .page-header, .stat-grid, .low-stock-card, .btn-danger, .btn-primary, .btn-secondary, .filter-controls, .no-print { display: none !important; }
            body, .app-container, .main-content { background: white !important; padding: 0 !important; margin: 0 !important; }
            .print-report-area { width: 100% !important; border: none !important; box-shadow: none !important; color: black !important; padding: 20px !important; }
            .report-title { display: block !important; margin-bottom: 30px; font-size: 26px; font-weight: bold; text-align: center; }
          }
          .report-title { display: none; }
        `}
      </style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Dashboard</h1>
        <button className="btn-danger" onClick={() => setIsClearModalOpen(true)} style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
          <Trash2 size={14} /> Clear Sales History
        </button>
      </div>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard
          icon={<LayoutDashboard size={26} color="#6366f1" />}
          label="Total Medicines"
          value={Number(stats.totalMedicines).toLocaleString()}
          color="#6366f1"
        />
        <StatCard
          icon={<TrendingUp size={26} color="#10b981" />}
          label="Total Inventory Value"
          value={fmt(stats.totalInventoryValue)}
          color="#10b981"
        />
        <StatCard
          icon={<Banknote size={26} color="#f59e0b" />}
          label="All-Time Total Sales"
          value={fmt(stats.totalSales)}
          color="#f59e0b"
        />
        <StatCard
          icon={<AlertTriangle size={26} color="#ef4444" />}
          label="Low Stock Alerts"
          value={stats.lowStockItems?.length || 0}
          color="#ef4444"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Period Sales Reporting */}
        <div className="glass-card print-report-area" style={{ padding: '24px' }}>
          <div className="report-title">Medi-Store - Sales Performance Report</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="no-print">
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Calendar size={18} color="var(--primary)" /> Sales Report
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className={`btn-secondary ${rangeLabel === 'Today' ? 'active' : ''}`} onClick={() => setRange('today')} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Today</button>
              <button className={`btn-secondary ${rangeLabel === 'Last 7 Days' ? 'active' : ''}`} onClick={() => setRange('week')} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Week</button>
              <button className={`btn-secondary ${rangeLabel === 'Last 30 Days' ? 'active' : ''}`} onClick={() => setRange('month')} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Month</button>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
             <div className="invoice-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Sales ({rangeLabel})</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                    {salesReport.loading ? '...' : fmt(salesReport.total)}
                  </div>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }} className="filter-controls">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Date</label>
              <input type="datetime-local" className="input-field" 
                value={dateRange.start.slice(0, 16)} 
                onChange={e => setDateRange(p => ({ ...p, start: e.target.value + ':00' }))} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End Date</label>
              <input type="datetime-local" className="input-field" 
                value={dateRange.end.slice(0, 16)} 
                onChange={e => setDateRange(p => ({ ...p, end: e.target.value + ':00' }))} 
              />
            </div>
            <button className="btn-primary" onClick={handleCustomRange} style={{ padding: '10px' }} title="Apply Range">
              <Filter size={16} />
            </button>
            <button className="btn-secondary" onClick={() => window.print()} style={{ padding: '10px', background: '#f1f5f9' }} title="Print Report">
              <Printer size={16} />
            </button>
          </div>
        </div>

        {/* Low Stock Items List */}
        <div className="glass-card low-stock-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Low Stock Alerts
          </h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.lowStockItems?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 0' }}>Item Name</th>
                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockItems.map(item => (
                    <tr key={item.brandId} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '600' }}>{item.brandName}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center' }}>
                        <span className="badge badge-danger">{item.quantity} left</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                 <p>All items are sufficiently stocked. ✅</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Sales Confirmation Modal */}
      {isClearModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '450px', width: '90%', padding: '32px', textAlign: 'center' }}>
            {!clearSuccess ? (
              <>
                <div style={{ background: '#fef2f2', color: '#ef4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Trash2 size={32} />
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Clear Sales History?</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: '1.5' }}>
                  This action is <strong style={{ color: '#ef4444' }}>CRITICAL</strong> and cannot be undone. 
                  All sales records will be permanently deleted, but stock levels will be unaffected.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setIsClearModalOpen(false)} style={{ flex: 1 }} disabled={isClearing}>
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleClearSales} style={{ flex: 1 }} disabled={isClearing}>
                    {isClearing ? 'Clearing...' : 'Yes, Delete All'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <div style={{ background: '#f0fdf4', color: '#22c55e', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <RefreshCcw size={32} />
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>History Cleared!</h2>
                <p style={{ color: 'var(--text-muted)' }}>Dashboard metrics have been reset.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
