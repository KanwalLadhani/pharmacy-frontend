import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Receipt, Users,
  History, LogOut, Heart, Pill, Calendar, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile/drawer effect */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 45, backdropFilter: 'blur(2px)' }}
        />
      )}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Heart size={22} strokeWidth={1.5} />
            <Pill size={11} className="sidebar-pill" />
          </div>
          <span>Medi-Store</span>
          <button className="btn-close-sidebar" onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Role Badge */}
        <div className="sidebar-role-badge">
          <span className={`role-chip role-chip--${isAdmin ? 'admin' : 'pharmacist'}`}>
            {isAdmin ? '⚕ Admin' : '💊 Cashier'}
          </span>
          <span className="sidebar-username">{user?.username}</span>
        </div>

        {/* Navigation */}
        <nav className="nav-links">
          {isAdmin ? (
            <>
              <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <div className="nav-section-label">Inventory</div>
              <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <Package size={18} /> Inventory Management
              </NavLink>
              <div className="nav-section-label">Admin</div>
              <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <Users size={18} /> User Management
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/billing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <Receipt size={18} /> Point of Sale (Billing)
              </NavLink>
              <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <Package size={18} /> View Inventory
              </NavLink>
              <NavLink to="/sales-history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <History size={18} /> Sales History
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="top-header">
      <button className="hamburger-menu" onClick={onToggleSidebar} style={{ marginRight: 'auto', background: 'transparent', padding: '10px', border: 'none' }}>
        <Menu size={24} color="var(--primary)" />
      </button>
    </header>
  );
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={`main-layout-wrapper ${isSidebarOpen ? 'layout-pushed' : 'layout-full'}`}>
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="main-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
