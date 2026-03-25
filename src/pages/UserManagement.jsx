import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';
import { Users, UserPlus, Trash2, Shield, Pill } from 'lucide-react';

const ROLES = ['ROLE_ADMIN', 'ROLE_PHARMACIST'];

const emptyForm = { username: '', password: '', role: 'ROLE_PHARMACIST' };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    userService.getAll()
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setFormError('Username and password are required.');
      return;
    }
    setSaving(true);
    try {
      await userService.create(form);
      setForm(emptyForm);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await userService.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      alert('Failed to delete user.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={26} color="var(--primary)" /> User Management
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '24px' }}>
        {/* Add User Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="var(--primary)" /> Add New User
          </h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {formError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem' }}>
                ⚠️ {formError}
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Username</label>
              <input
                name="username"
                className="input-field"
                placeholder="e.g. john.doe"
                value={form.username}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password</label>
              <input
                name="password"
                type="password"
                className="input-field"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</label>
              <select name="role" className="input-field" value={form.role} onChange={handleChange} disabled={saving}>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace('ROLE_', '')}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '4px' }}>
              <UserPlus size={16} />
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading users…</div>
          ) : error ? (
            <div style={{ padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge-danger' : 'badge-success'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {u.role === 'ROLE_ADMIN' ? <Shield size={11} /> : <Pill size={11} />}
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleDelete(u.id, u.username)}
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
