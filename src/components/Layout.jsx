import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Receipt, Users, FileText,
  History, LogOut, Heart, Pill, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Heart size={22} strokeWidth={1.5} />
          <Pill size={11} className="sidebar-pill" />
        </div>
        <span>Medi-Store</span>
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
            <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <div className="nav-section-label">Inventory</div>
            <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Package size={18} /> Inventory Management
            </NavLink>
            <div className="nav-section-label">Admin</div>
            <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Users size={18} /> User Management
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/billing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Receipt size={18} /> Point of Sale (Billing)
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Package size={18} /> View Inventory
            </NavLink>
            <NavLink to="/shift-closing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Calendar size={18} /> Shift Closing Report
            </NavLink>
            <NavLink to="/sales-history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <History size={18} /> Personal Sales History
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
  );
};

const Layout = () => (
  <div className="app-container">
    <Sidebar />
    <main className="main-content animate-fade-in">
      <Outlet />
    </main>
  </div>
);

export default Layout;
