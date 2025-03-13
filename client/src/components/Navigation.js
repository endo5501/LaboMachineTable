import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import translate from '../utils/translate';

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
      <Link to="/" className="navbar-brand">{translate('NcReserve')}</Link>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/layout" className={`nav-link ${isActive('/layout')}`}>
            {translate('Equipment Layout')}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/reservations" className={`nav-link ${isActive('/reservations')}`}>
            {translate('Reservations')}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/equipment" className={`nav-link ${isActive('/equipment')}`}>
            {translate('Equipment Management')}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/users" className={`nav-link ${isActive('/users')}`}>
            {translate('User Management')}
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
            {translate('Logout')}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
