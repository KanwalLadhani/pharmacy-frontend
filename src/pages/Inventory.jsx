import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, X, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const emptyForm = { brandName: '', manufacturer: '', generic: '', dosageForm: '', price: '', quantity: '' };

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch]       = useState('');
  const [isModalOpen, setModal]   = useState(false);
  const [formData, setFormData]   = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const { user } = useAuth();

  useEffect(() => { fetchMedicines(0); }, []);

  const fetchMedicines = async (page = 0, customQuery = null) => {
    setLoading(true); setError(null);
    try {
      const activeQuery = customQuery !== null ? customQuery : search;
      const res = activeQuery.trim()
          ? await inventoryService.search(activeQuery, page)
          : await inventoryService.getAll(page);
          
      setMedicines(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setCurrentPage(page);
    } catch {
      setError('Could not load medicines. Is the backend running?');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchMedicines(0, val);
  };

  const openAdd  = () => { setFormData(emptyForm); setEditingId(null); setModal(true); };
  const openEdit = (med) => {
    setFormData({
      brandName:    med.brandName    || '',
      manufacturer: med.manufacturer || '',
      generic:      med.generic      || '',
      dosageForm:   med.dosageForm   || '',
      price:        med.price        !== null ? med.price : '',
      quantity:     med.quantity     !== null ? med.quantity : '',
    });
    setEditingId(med.brandId);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      brandId: editingId,
      price: formData.price === '' ? 0 : Number(formData.price),
      quantity: formData.quantity === '' ? 0 : Number(formData.quantity)
    };
    try {
      const res = editingId ? await inventoryService.update(editingId, submissionData)
                            : await inventoryService.add(submissionData);
      setModal(false);
      fetchMedicines(currentPage);
      alert(`Success! Updated ${res.data.brandName}. New Quantity: ${res.data.quantity}`);
    } catch (err) {
      console.error("Save error:", err);
      const msg = err.response?.data?.message || 'Save failed. Make sure the system is running and the data is correct.';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try { await inventoryService.delete(id); fetchMedicines(currentPage); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const displayedValue = medicines.reduce((sum, m) => sum + (Number(m.price || 0) * (m.quantity || 0)), 0);

  const field = (key, label, type = 'text', opts = {}) => {
    const val = formData && formData[key] !== undefined && formData[key] !== null ? formData[key] : '';
    return (
      <div key={key}>
        <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '0.83rem', fontWeight: '500' }}>{label}</label>
        <input 
          className="input-field" 
          type={type} 
          value={val}
          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} 
          {...opts} 
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        {user?.role === 'ROLE_ADMIN' && (
          <button className="btn-primary" onClick={openAdd}><Plus size={18} /> Add Medicine</button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <TrendingUp size={20} color="#10b981" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Total Database Items: <strong style={{ color: 'var(--text-main)' }}>{totalElements.toLocaleString()}</strong> medicines
          &nbsp;·&nbsp; Total Value (This Page):&nbsp;
          <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
            PKR {displayedValue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </span>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '20px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input type="text" className="input-field" placeholder="Search by medicine name…"
            value={search} onChange={handleSearch} style={{ paddingLeft: '38px' }} />
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading inventory...</p>}
        {error   && <p style={{ color: '#ef4444' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Item Name</th>
                  <th style={{ textAlign: 'left' }}>Manufacturer</th>
                  <th style={{ textAlign: 'left' }}>Salt Formula</th>
                  <th style={{ textAlign: 'left' }}>Dosage Form</th>
                  <th style={{ textAlign: 'right' }}>Price (PKR)</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Stock Value</th>
                  {user?.role === 'ROLE_ADMIN' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No medicines found.</td></tr>
                ) : medicines.map(med => {
                  const unitPrice  = Number(med.price || 0);
                  const qty        = med.quantity || 0;
                  const stockValue = unitPrice * qty;
                  return (
                    <tr key={med.brandId}>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{med.brandName}</td>
                      <td>{med.manufacturer || '—'}</td>
                      <td>{med.generic || '—'}</td>
                      <td>{med.dosageForm || '—'}</td>
                      <td style={{ textAlign: 'right' }}><strong>{unitPrice.toFixed(2)}</strong></td>
                      <td style={{ textAlign: 'center' }}><span className={`badge ${qty < 10 ? 'badge-danger' : 'badge-success'}`}>{qty}</span></td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{stockValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                      {user?.role === 'ROLE_ADMIN' && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEdit(med)}><Edit2 size={15} /></button>
                            <button className="btn-danger"    style={{ padding: '6px 10px' }} onClick={() => handleDelete(med.brandId)}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Showing page {currentPage + 1} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" disabled={currentPage === 0} onClick={() => fetchMedicines(currentPage - 1)}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button className="btn-secondary" disabled={currentPage >= totalPages - 1} onClick={() => fetchMedicines(currentPage + 1)}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', color: '#1e293b', padding: '40px', width: '90%', maxWidth: '550px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '2px solid #3b82f6', position: 'relative', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }} onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {field('brandName', 'Item Name (Brand)', 'text', { required: true })}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {field('manufacturer', 'Manufacturer')}
                {field('generic', 'Salt Formula')}
              </div>
              {field('dosageForm', 'Dosage Form (e.g. Sachet, Tablet)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {field('price', 'Retail Price (PKR)', 'number', { required: true, step: '0.01', min: '0' })}
                {field('quantity', 'Available Stock', 'number', { required: true, min: '0' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setModal(false)} style={{ padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
