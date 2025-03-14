import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../utils/axiosConfig';
import translate from '../utils/translate';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching current user:', err);
      logout();
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError('');
      console.log('Attempting to login with:', { username, password });
      console.log('Login URL:', '/api/auth/login');
      
      // Add a direct fetch to the server to see if it works
      try {
        const directResponse = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        console.log('Direct fetch response:', directResponse);
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        
        // If direct fetch works, use it
        const { token, user } = directData;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        return user;
      } catch (directErr) {
        console.error('Direct fetch error:', directErr);
        // Fall back to axios if direct fetch fails
      }
      
      const response = await axios.post('/api/auth/login', { username, password });
      console.log('Axios response:', response);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Login error:', err);
      setError(translate(err.response?.data?.message || 'Failed to login'));
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    error,
    setError,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
