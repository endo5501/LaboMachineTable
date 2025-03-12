import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import EquipmentManagementPage from './pages/EquipmentManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import EquipmentLayoutPage from './pages/EquipmentLayoutPage';
import ReservationStatusPage from './pages/ReservationStatusPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/equipment" element={
              <PrivateRoute>
                <EquipmentManagementPage />
              </PrivateRoute>
            } />
            <Route path="/users" element={
              <PrivateRoute>
                <UserManagementPage />
              </PrivateRoute>
            } />
            <Route path="/layout" element={
              <PrivateRoute>
                <EquipmentLayoutPage />
              </PrivateRoute>
            } />
            <Route path="/reservations" element={
              <PrivateRoute>
                <ReservationStatusPage />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/layout" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
