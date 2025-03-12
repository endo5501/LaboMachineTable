import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navigation() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">NcReserve</Link>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/layout" className={`nav-link ${isActive('/layout')}`}>
            Equipment Layout
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/reservations" className={`nav-link ${isActive('/reservations')}`}>
            Reservations
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/equipment" className={`nav-link ${isActive('/equipment')}`}>
            Equipment Management
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/users" className={`nav-link ${isActive('/users')}`}>
            User Management
          </Link>
        </li>
        <li className="nav-item" style={{ marginLeft: 'auto' }}>
          <span className="nav-link">
            {currentUser?.username}
          </span>
        </li>
        <li className="nav-item">
          <button 
            onClick={handleLogout} 
            className="nav-link" 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
