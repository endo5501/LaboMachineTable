import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReservationWindow from '../components/ReservationWindow';
import translate from '../utils/translate';

function EquipmentLayoutPage() {
  const [equipment, setEquipment] = useState([]);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showReservationWindow, setShowReservationWindow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedEquipment, setDraggedEquipment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment, layout, reservation, and user data in parallel
      const [equipmentResponse, layoutResponse, reservationsResponse, usersResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/layout'),
        axios.get('/api/reservations'),
        axios.get('/api/users')
      ]);
      
      // Get current date and time
      const now = new Date();
      
      // Process equipment data to include current user information
      const equipmentData = equipmentResponse.data;
      const reservations = reservationsResponse.data;
      const users = usersResponse.data;
      
      // Create a map of user IDs to usernames for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user.username;
      });
      
      // Find current reservations for each equipment
      const equipmentWithUsers = equipmentData.map(equipment => {
        const currentReservation = reservations.find(reservation => {
          const startTime = new Date(reservation.start_time);
          const endTime = new Date(reservation.end_time);
          return reservation.equipment_id === equipment.id && 
                 now >= startTime && 
                 now <= endTime;
        });
        
        // Get the username if there's a current reservation
        const userId = currentReservation ? currentReservation.user_id : null;
        const username = userId ? userMap[userId] : null;
        
        return {
          ...equipment,
          current_user: username
        };
      });
      
      setEquipment(equipmentWithUsers);
      setLayout(layoutResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load equipment layout. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentClick = (equipmentItem) => {
    if (editMode) return; // Don't open reservation window in edit mode
    
    setSelectedEquipment(equipmentItem);
    setShowReservationWindow(true);
  };

  const handleCloseReservation = () => {
    setShowReservationWindow(false);
    setSelectedEquipment(null);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleDragStart = (e, equipmentId) => {
    if (!editMode) return;
    
    setDraggedEquipment(equipmentId);
    // Set transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e) => {
    if (!editMode || !draggedEquipment) return;
    
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!editMode || !draggedEquipment) return;
    
    e.preventDefault();
    
    // Get drop position relative to layout container
    const container = document.querySelector('.layout-container');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update layout for the dragged equipment
    updateEquipmentPosition(draggedEquipment, x, y);
    setDraggedEquipment(null);
  };

  const updateEquipmentPosition = async (equipmentId, x, y) => {
    try {
      // Find existing layout for this equipment
      const existingLayout = layout.find(item => item.equipment_id === equipmentId);
      
      if (existingLayout) {
        // Update existing layout
        const updatedLayout = {
          ...existingLayout,
          x_position: Math.max(0, x),
          y_position: Math.max(0, y)
        };
        
        await axios.put(`/api/layout/equipment/${equipmentId}`, updatedLayout);
      } else {
        // Create new layout
        const newLayout = {
          equipment_id: equipmentId,
          x_position: Math.max(0, x),
          y_position: Math.max(0, y),
          width: 150,
          height: 100
        };
        
        await axios.post('/api/layout', [newLayout]);
      }
      
      // Refresh layout data
      fetchData();
    } catch (err) {
      console.error('Error updating equipment position:', err);
      setError('Failed to update equipment position. Please try again.');
    }
  };

  const saveLayout = async () => {
    try {
      await axios.post('/api/layout', layout);
      setEditMode(false);
      fetchData();
    } catch (err) {
      console.error('Error saving layout:', err);
      setError('Failed to save layout. Please try again.');
    }
  };

  const getEquipmentPosition = (equipmentId) => {
    const equipmentLayout = layout.find(item => item.equipment_id === equipmentId);
    
    if (equipmentLayout) {
      return {
        left: `${equipmentLayout.x_position}px`,
        top: `${equipmentLayout.y_position}px`,
        width: `${equipmentLayout.width}px`,
        height: `${equipmentLayout.height}px`
      };
    }
    
    return null;
  };

  const getEquipmentDetails = (equipmentId) => {
    return equipment.find(item => item.id === equipmentId);
  };

  // Get equipment that has a position in the layout
  const positionedEquipment = layout
    .map(layoutItem => {
      const equipmentItem = getEquipmentDetails(layoutItem.equipment_id);
      return equipmentItem ? { ...equipmentItem, layout: layoutItem } : null;
    })
    .filter(Boolean);

  // Get equipment that doesn't have a position yet
  const unpositionedEquipment = equipment.filter(
    item => !layout.some(layoutItem => layoutItem.equipment_id === item.id)
  );

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{translate('Equipment Layout')}</h2>
          <div>
            <button 
              onClick={toggleEditMode}
              style={{ 
                backgroundColor: editMode ? '#6c757d' : '#007bff',
                marginRight: '10px'
              }}
            >
              {editMode ? translate('Cancel') : translate('Edit Layout')}
            </button>
            
            {editMode && (
              <button 
                onClick={saveLayout}
                style={{ backgroundColor: '#28a745' }}
              >
                {translate('Save Layout')}
              </button>
            )}
          </div>
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
        
        {loading ? (
          <p>Loading equipment layout...</p>
        ) : (
          <div 
            className="layout-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ position: 'relative', minHeight: '600px' }}
          >
            {positionedEquipment.map(item => (
              <div
                key={item.id}
                className={`equipment-item ${item.in_use ? 'in-use' : ''}`}
                style={{
                  position: 'absolute',
                  ...getEquipmentPosition(item.id),
                  cursor: editMode ? 'move' : 'pointer'
                }}
                onClick={() => handleEquipmentClick(item)}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <div className="equipment-name">{item.name}</div>
                {item.current_user && (
                  <div className="user-name">{translate('In use by:')} {item.current_user}</div>
                )}
              </div>
            ))}
            
            {editMode && unpositionedEquipment.length > 0 && (
              <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                  <h4>Unpositioned Equipment</h4>
                  <p>Drag these items to position them on the layout</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
                  {unpositionedEquipment.map(item => (
                    <div
                      key={item.id}
                      className="equipment-item"
                      style={{ width: '150px', height: '100px' }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                    >
                      <div className="equipment-name">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showReservationWindow && selectedEquipment && (
        <>
          <div className="overlay" onClick={handleCloseReservation}></div>
          <ReservationWindow 
            equipment={selectedEquipment}
            onClose={handleCloseReservation}
          />
        </>
      )}
    </div>
  );
}

export default EquipmentLayoutPage;
