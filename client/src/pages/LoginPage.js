import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import translate from '../utils/translate';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to '/'
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError(translate('Username and password are required'));
      return;
    }
    
    try {
      setLoading(true);
      await login(username, password);
      navigate(from, { replace: true });
    } catch (error) {
      setLoading(false);
      // Error is already set in the AuthContext
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{translate('Login to LaboMachineTable')}</h2>
      
      {error && (
        <div className="alert" style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{translate('Username')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">{translate('Password')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button" 
          disabled={loading}
        >
          {loading ? translate('Logging in...') : translate('Login')}
        </button>
      </form>
      
      <p className="mt-3 text-center">
        {translate('New users will be automatically registered upon first login.')}
      </p>
    </div>
  );
}

export default LoginPage;
