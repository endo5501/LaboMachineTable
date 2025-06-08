import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import translate from '../utils/translate';

function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/equipment');
      setEquipment(response.data);
      setError('');
    } catch (err) {
      setError(translate('Failed to load equipment. Please try again later.'));
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
        await axios.put(`/api/equipment/${editingId}`, formData);
      } else {
        await axios.post('/api/equipment', formData);
      }
      
      // Reset form and refresh equipment list
      setFormData({ name: '', type: '', description: '' });
      setEditingId(null);
      fetchEquipment();
    } catch (err) {
      setError(translate('Failed to save equipment. Please try again.'));
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      type: item.type || '',
      description: item.description || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(translate('Are you sure you want to delete this equipment?'))) {
      return;
    }
    
    try {
      await axios.delete(`/api/equipment/${id}`);
      fetchEquipment();
    } catch (err) {
      setError(translate('Failed to delete equipment. Please try again.'));
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', type: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{translate('Equipment Management')}</h2>
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
            <label htmlFor="name">{translate('Equipment Name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">{translate('Type')}</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">{translate('Description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit">
              {editingId ? translate('Update Equipment') : translate('Add Equipment')}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancel}
                style={{ backgroundColor: '#6c757d' }}
              >
                {translate('Cancel')}
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{translate('Equipment List')}</h3>
        </div>
        
        {loading ? (
          <p>{translate('Loading...')}</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{translate('Name')}</th>
                  <th>{translate('Type')}</th>
                  <th>{translate('Description')}</th>
                  <th>{translate('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      {translate('No data available')}
                    </td>
                  </tr>
                ) : (
                  equipment.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                      <td>{item.description}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            onClick={() => handleEdit(item)}
                            style={{ 
                              backgroundColor: '#28a745',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            {translate('Edit')}
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ 
                              backgroundColor: '#dc3545',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            {translate('Delete')}
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

export default EquipmentManagementPage;
