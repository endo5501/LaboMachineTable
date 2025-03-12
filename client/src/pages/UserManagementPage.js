import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  });
  const [editingId, setEditingId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // If editing, only send password if it's been changed
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`/api/users/${editingId}`, updateData);
      } else {
        await axios.post('/api/users', formData);
      }
      
      // Reset form and refresh users list
      setFormData({ username: '', password: '', name: '', email: '' });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '', // Don't populate password for security
      name: user.name || '',
      email: user.email || ''
    });
    setEditingId(user.id);
  };

  const handleDelete = async (id) => {
    // Prevent deleting yourself
    if (id === currentUser.id) {
      setError("You cannot delete your own account.");
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ username: '', password: '', name: '', email: '' });
    setEditingId(null);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Management</h2>
        </div>
        
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={editingId !== null} // Can't change username when editing
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password {editingId && '(Leave blank to keep current password)'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingId} // Only required for new users
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit">
              {editingId ? 'Update User' : 'Add User'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancel}
                style={{ backgroundColor: '#6c757d' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">User List</h3>
        </div>
        
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      No users found. Add some users above.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            onClick={() => handleEdit(user)}
                            style={{ 
                              backgroundColor: '#28a745',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            style={{ 
                              backgroundColor: '#dc3545',
                              padding: '0.25rem 0.5rem'
                            }}
                            disabled={user.id === currentUser?.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagementPage;
