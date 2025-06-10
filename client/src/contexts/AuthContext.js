import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
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
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
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
      logout();
      setLoading(false);
    }
  };

  const login = useCallback(async (username, password) => {
    try {
      setError('');

      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(translate(err.response?.data?.message || 'Failed to login'));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    setCurrentUser(null);
  }, []);

  const value = useMemo(() => ({
    currentUser,
    login,
    logout,
    error,
    setError,
    isAuthenticated: !!currentUser,
  }), [currentUser, login, logout, error]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
