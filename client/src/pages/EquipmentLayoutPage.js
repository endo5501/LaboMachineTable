import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../utils/axiosConfig';
import ReservationWindow from '../components/ReservationWindow';
import translate from '../utils/translate';

function EquipmentLayoutPage() {
  const [equipment, setEquipment] = useState([]);
  const [layout, setLayout] = useState([]);
  const [textLabels, setTextLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showReservationWindow, setShowReservationWindow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedEquipment, setDraggedEquipment] = useState(null);
  const [draggedLabel, setDraggedLabel] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingEquipment, setResizingEquipment] = useState(null);
  const [resizeStartData, setResizeStartData] = useState(null);
  const layoutContainerRef = useRef(null);
  const resizeFunctionsRef = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (resizeFunctionsRef.current.handleResizeMove) {
        document.removeEventListener('mousemove', resizeFunctionsRef.current.handleResizeMove);
      }
      if (resizeFunctionsRef.current.handleResizeEnd) {
        document.removeEventListener('mouseup', resizeFunctionsRef.current.handleResizeEnd);
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment, layout, reservation, user data, and text labels in parallel
      const [equipmentResponse, layoutResponse, reservationsResponse, usersResponse, textLabelsResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/layout'),
        axios.get('/api/reservations'),
        axios.get('/api/users'),
        axios.get('/api/layout/labels')
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
      setTextLabels(textLabelsResponse.data);
      setError('');
    } catch (err) {
      setError(translate('Failed to load equipment layout. Please try again later.'));
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
    
    // Find the equipment's current position
    const equipmentLayout = layout.find(item => item.equipment_id === equipmentId);
    if (equipmentLayout) {
      // Calculate offset between mouse position and equipment top-left corner
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });
    }
    
    // Set transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e) => {
    if (!editMode || (!draggedEquipment && !draggedLabel)) return;
    
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!editMode) return;
    
    e.preventDefault();
    
    // Get drop position relative to layout container
    const container = layoutContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Apply the offset to get the correct position
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    if (draggedEquipment) {
      // Update layout for the dragged equipment
      updateEquipmentPosition(draggedEquipment, x, y);
      setDraggedEquipment(null);
    } else if (draggedLabel) {
      // Update position for the dragged text label
      updateTextLabelPosition(draggedLabel, x, y);
      setDraggedLabel(null);
    }
    
    // Reset drag offset
    setDragOffset({ x: 0, y: 0 });
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
      setError(translate('Failed to update equipment position. Please try again.'));
    }
  };

  const updateEquipmentSize = async (equipmentId, width, height) => {
    try {
      // Find existing layout for this equipment
      const existingLayout = layout.find(item => item.equipment_id === equipmentId);
      
      if (existingLayout) {
        // Update existing layout size
        const updatedLayout = {
          ...existingLayout,
          width: Math.max(50, width), // Minimum width of 50px
          height: Math.max(30, height) // Minimum height of 30px
        };
        
        await axios.put(`/api/layout/equipment/${equipmentId}`, updatedLayout);
        
        // Update local state immediately for better UX
        setLayout(prevLayout => 
          prevLayout.map(item => 
            item.equipment_id === equipmentId ? updatedLayout : item
          )
        );
      }
    } catch (err) {
      setError(translate('Failed to update equipment size. Please try again.'));
    }
  };

  const updateTextLabelPosition = async (labelId, x, y) => {
    try {
      await axios.put(`/api/layout/labels/${labelId}`, {
        x_position: Math.max(0, x),
        y_position: Math.max(0, y)
      });
      
      // Refresh data
      fetchData();
    } catch (err) {
      setError(translate('Failed to update text label position. Please try again.'));
    }
  };

  const handleTextLabelDragStart = (e, labelId) => {
    if (!editMode) return;
    
    setDraggedLabel(labelId);
    
    // Find the label's current position
    const label = textLabels.find(item => item.id === labelId);
    if (label) {
      // Calculate offset between mouse position and label top-left corner
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });
    }
    
    // Set transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleLayoutDoubleClick = (e) => {
    if (!editMode) return;
    
    // Prevent double click from being triggered on equipment or text labels
    if (e.target !== layoutContainerRef.current) return;
    
    // Get click position relative to layout container
    const rect = layoutContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Show text input at this position
    setTextInputPosition({ x, y });
    setTextInputValue('');
    setEditingLabelId(null);
    setShowTextInput(true);
  };

  const handleTextLabelClick = (e, label) => {
    if (!editMode) return;
    
    e.stopPropagation();
    
    // Show text input at this position
    setTextInputPosition({ x: label.x_position, y: label.y_position });
    setTextInputValue(label.content);
    setEditingLabelId(label.id);
    setShowTextInput(true);
  };

  const handleTextInputSubmit = async (e) => {
    e.preventDefault();
    
    if (!textInputValue.trim()) {
      setShowTextInput(false);
      return;
    }
    
    try {
      if (editingLabelId) {
        // Update existing label
        await axios.put(`/api/layout/labels/${editingLabelId}`, {
          content: textInputValue
        });
      } else {
        // Create new label
        await axios.post('/api/layout/labels', {
          content: textInputValue,
          x_position: textInputPosition.x,
          y_position: textInputPosition.y
        });
      }
      
      // Reset state and refresh data
      setShowTextInput(false);
      setTextInputValue('');
      setEditingLabelId(null);
      fetchData();
    } catch (err) {
      setError(translate('Failed to save text label. Please try again.'));
    }
  };

  const handleTextInputCancel = () => {
    setShowTextInput(false);
    setTextInputValue('');
    setEditingLabelId(null);
  };

  const deleteTextLabel = async (labelId) => {
    try {
      await axios.delete(`/api/layout/labels/${labelId}`);
      fetchData();
    } catch (err) {
      setError(translate('Failed to delete text label. Please try again.'));
    }
  };

  const removeEquipmentFromLayout = async (equipmentId) => {
    try {
      await axios.delete(`/api/layout/equipment/${equipmentId}`);
      fetchData();
    } catch (err) {
      setError(translate('Failed to remove equipment from layout. Please try again.'));
    }
  };

  const saveLayout = async () => {
    try {
      await axios.post('/api/layout', layout);
      setEditMode(false);
      fetchData();
    } catch (err) {
      setError(translate('Failed to save layout. Please try again.'));
    }
  };

  const handleResizeMove = (e) => {
    if (!resizingEquipment || !resizeStartData) return;
    
    console.log('Resize move:', e.clientX, e.clientY); // Debug log
    
    const deltaX = e.clientX - resizeStartData.startX;
    const deltaY = e.clientY - resizeStartData.startY;
    
    const newWidth = resizeStartData.startWidth + deltaX;
    const newHeight = resizeStartData.startHeight + deltaY;
    
    console.log('New size:', newWidth, newHeight); // Debug log
    
    // Update local state immediately for visual feedback
    setLayout(prevLayout => 
      prevLayout.map(item => 
        item.equipment_id === resizingEquipment 
          ? { ...item, width: Math.max(50, newWidth), height: Math.max(30, newHeight) }
          : item
      )
    );
  };

  const handleResizeEnd = () => {
    console.log('Resize end'); // Debug log
    
    if (resizingEquipment && resizeStartData) {
      const equipmentLayout = layout.find(item => item.equipment_id === resizingEquipment);
      if (equipmentLayout) {
        updateEquipmentSize(resizingEquipment, equipmentLayout.width, equipmentLayout.height);
      }
    }
    
    setResizingEquipment(null);
    setResizeStartData(null);
    
    // Remove event listeners
    document.removeEventListener('mousemove', resizeFunctionsRef.current.handleResizeMove);
    document.removeEventListener('mouseup', resizeFunctionsRef.current.handleResizeEnd);
  };

  // Store function references
  resizeFunctionsRef.current.handleResizeMove = handleResizeMove;
  resizeFunctionsRef.current.handleResizeEnd = handleResizeEnd;

  const handleResizeStart = (e, equipmentId) => {
    console.log('Resize start for equipment:', equipmentId); // Debug log
    e.stopPropagation();
    e.preventDefault();
    
    const equipmentLayout = layout.find(item => item.equipment_id === equipmentId);
    if (!equipmentLayout) {
      console.log('Equipment layout not found'); // Debug log
      return;
    }
    
    console.log('Equipment layout:', equipmentLayout); // Debug log
    
    setResizingEquipment(equipmentId);
    setResizeStartData({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: equipmentLayout.width,
      startHeight: equipmentLayout.height
    });
    
    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', resizeFunctionsRef.current.handleResizeMove);
    document.addEventListener('mouseup', resizeFunctionsRef.current.handleResizeEnd);
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
              <>
                <button 
                  onClick={saveLayout}
                  style={{ backgroundColor: '#28a745', marginRight: '10px' }}
                >
                  {translate('Save Layout')}
                </button>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>
                  {translate('Double-click to add text')}
                </span>
              </>
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
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Sidebar for unpositioned equipment */}
            {editMode && unpositionedEquipment.length > 0 && (
              <div className="equipment-sidebar" style={{
                width: '250px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                height: 'fit-content',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#495057' }}>
                  {translate('Equipment Palette')}
                </h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#6c757d' }}>
                  {translate('Drag items to the layout')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {unpositionedEquipment.map(item => (
                    <div
                      key={item.id}
                      className="equipment-item"
                      style={{ 
                        width: '100%', 
                        height: '60px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        fontSize: '14px',
                        textAlign: 'center',
                        padding: '8px'
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                    >
                      <div className="equipment-name">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main layout area */}
            <div 
              ref={layoutContainerRef}
              className="layout-container"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDoubleClick={handleLayoutDoubleClick}
              style={{ 
                position: 'relative', 
                minHeight: '600px',
                flex: 1,
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
            {/* Equipment items */}
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
                draggable={editMode && !resizingEquipment}
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <div className="equipment-name">{item.name}</div>
                {item.current_user && (
                  <div className="user-name">{item.current_user}</div>
                )}
                {editMode && (
                  <>
                    <div className="equipment-controls" style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEquipmentFromLayout(item.id);
                        }}
                        style={{ fontSize: '12px', padding: '2px 4px', backgroundColor: '#dc3545', color: 'white' }}
                      >
                        {translate('Remove Equipment')}
                      </button>
                    </div>
                    {/* Resize handle */}
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#007bff',
                        cursor: 'se-resize',
                        borderRadius: '0 0 4px 0',
                        border: '1px solid #0056b3'
                      }}
                      draggable={false}
                      onMouseDown={(e) => handleResizeStart(e, item.id)}
                    />
                  </>
                )}
              </div>
            ))}
            
            {/* Text labels */}
            {textLabels.map(label => (
              <div
                key={label.id}
                className="text-label"
                style={{
                  position: 'absolute',
                  left: `${label.x_position}px`,
                  top: `${label.y_position}px`,
                  fontSize: `${label.font_size}px`,
                  cursor: editMode ? 'move' : 'default',
                  backgroundColor: editMode ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
                  padding: editMode ? '4px' : '0',
                  borderRadius: '4px',
                  userSelect: 'none'
                }}
                onClick={(e) => handleTextLabelClick(e, label)}
                draggable={editMode}
                onDragStart={(e) => handleTextLabelDragStart(e, label.id)}
              >
                {label.content}
                {editMode && (
                  <div className="text-label-controls" style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextLabelClick(e, label);
                      }}
                      style={{ fontSize: '12px', padding: '2px 4px' }}
                    >
                      {translate('Edit Text')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTextLabel(label.id);
                      }}
                      style={{ fontSize: '12px', padding: '2px 4px', backgroundColor: '#dc3545', color: 'white' }}
                    >
                      {translate('Delete Text')}
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Text input dialog */}
            {showTextInput && (
              <div
                className="text-input-dialog"
                style={{
                  position: 'absolute',
                  left: `${textInputPosition.x}px`,
                  top: `${textInputPosition.y}px`,
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  zIndex: 100
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleTextInputSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="textInput" style={{ display: 'block', marginBottom: '5px' }}>
                      {translate('Enter text:')}
                    </label>
                    <input
                      id="textInput"
                      type="text"
                      value={textInputValue}
                      onChange={(e) => setTextInputValue(e.target.value)}
                      autoFocus
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <button
                      type="button"
                      onClick={handleTextInputCancel}
                      style={{ padding: '5px 10px' }}
                    >
                      {translate('Cancel')}
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white' }}
                    >
                      {translate('Save')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            </div>
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
