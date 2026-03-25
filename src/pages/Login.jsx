import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Shield, Pill } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.username, form.password);
      // Redirect based on role
      if (user.role === 'ROLE_ADMIN') {
        navigate('/', { replace: true });
      } else {
        navigate('/billing', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid username or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel — Branding */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Heart size={40} strokeWidth={1.5} />
              <Pill size={20} className="pill-badge" />
            </div>
          </div>
          <h1 className="login-brand-title">Medi-Store</h1>
          <p className="login-brand-tagline">Pharmacy Management System</p>
          <div className="login-feature-list">
            <div className="login-feature-item">
              <Shield size={16} />
              <span>Role-Based Access Control</span>
            </div>
            <div className="login-feature-item">
              <Pill size={16} />
              <span>Complete Inventory Management</span>
            </div>
            <div className="login-feature-item">
              <Heart size={16} />
              <span>Trusted by Healthcare Professionals</span>
            </div>
          </div>
        </div>
        <div className="login-brand-orb login-brand-orb-1" />
        <div className="login-brand-orb login-brand-orb-2" />
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Medi-Store account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="input-field"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary login-submit-btn"
              disabled={loading || !form.username || !form.password}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
