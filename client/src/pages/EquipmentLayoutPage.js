import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../utils/axiosConfig';
import ReservationWindow from '../components/ReservationWindow';
import translate from '../utils/translate';

function EquipmentLayoutPage() {
  const [equipment, setEquipment] = useState([]);
  const [layout, setLayout] = useState([]);
  const [textLabels, setTextLabels] = useState([]);
  const [layoutPages, setLayoutPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showReservationWindow, setShowReservationWindow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [draggedEquipment, setDraggedEquipment] = useState(null);
  const [draggedLabel, setDraggedLabel] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingEquipment, setResizingEquipment] = useState(null);
  const layoutContainerRef = useRef(null);
  const resizeFunctionsRef = useRef({});
  const resizeDataRef = useRef({ equipmentId: null, startData: null, currentSize: null });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (layoutPages.length > 0) {
      fetchData();
    }
  }, [currentPageId]);

  // Store function references
  useEffect(() => {
    resizeFunctionsRef.current.handleResizeMove = handleResizeMove;
    resizeFunctionsRef.current.handleResizeEnd = handleResizeEnd;
  });

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

      // Fetch equipment, layout pages, reservations, users in parallel
      const [equipmentResponse, layoutPagesResponse, reservationsResponse, usersResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/layout/pages'),
        axios.get('/api/reservations'),
        axios.get('/api/users'),
      ]);

      setLayoutPages(layoutPagesResponse.data);

      // Fetch layout and text labels for current page
      const [layoutResponse, textLabelsResponse] = await Promise.all([
        axios.get(`/api/layout?pageId=${currentPageId}`),
        axios.get(`/api/layout/labels?pageId=${currentPageId}`),
      ]);

      // Get current date and time
      const now = new Date();

      // Process equipment data to include current user information
      const equipmentData = equipmentResponse.data;
      const reservations = reservationsResponse.data;
      const users = usersResponse.data;

      // Create a map of user IDs to usernames for quick lookup
      const userMap = {};
      users.forEach((user) => {
        userMap[user.id] = user.username;
      });

      // Find current reservations for each equipment
      const equipmentWithUsers = equipmentData.map((equipment) => {
        const currentReservation = reservations.find((reservation) => {
          const startTime = new Date(reservation.start_time);
          const endTime = new Date(reservation.end_time);
          return reservation.equipment_id === equipment.id
                 && now >= startTime
                 && now <= endTime;
        });

        // Get the username if there's a current reservation
        const userId = currentReservation ? currentReservation.user_id : null;
        const username = userId ? userMap[userId] : null;

        return {
          ...equipment,
          current_user: username,
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

    // Calculate offset between mouse position and equipment top-left corner
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });

    // Create a custom drag image that looks like the equipment
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.pointerEvents = 'none';
    document.body.appendChild(dragImage);

    // Set the custom drag image with the calculated offset
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

    // Clean up the temporary element after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
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
      const existingLayout = layout.find((item) => item.equipment_id === equipmentId);

      if (existingLayout) {
        // Update existing layout
        const updatedLayout = {
          ...existingLayout,
          x_position: Math.max(0, x),
          y_position: Math.max(0, y),
        };

        await axios.put(`/api/layout/equipment/${equipmentId}`, { ...updatedLayout, page_id: currentPageId });
      } else {
        // Create new layout
        const newLayout = {
          equipment_id: equipmentId,
          x_position: Math.max(0, x),
          y_position: Math.max(0, y),
          width: 150,
          height: 100,
          page_id: currentPageId,
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
      const existingLayout = layout.find((item) => item.equipment_id === equipmentId);

      if (existingLayout) {
        // Update existing layout size
        const updatedLayout = {
          ...existingLayout,
          width: Math.max(50, width), // Minimum width of 50px
          height: Math.max(30, height), // Minimum height of 30px
        };

        await axios.put(`/api/layout/equipment/${equipmentId}`, { ...updatedLayout, page_id: currentPageId });

        // Update local state immediately for better UX
        setLayout((prevLayout) => prevLayout.map((item) => (item.equipment_id === equipmentId ? updatedLayout : item)));
      }
    } catch (err) {
      setError(translate('Failed to update equipment size. Please try again.'));
    }
  };

  const updateTextLabelPosition = async (labelId, x, y) => {
    try {
      await axios.put(`/api/layout/labels/${labelId}`, {
        x_position: Math.max(0, x),
        y_position: Math.max(0, y),
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

    // Calculate offset between mouse position and label top-left corner
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });

    // Create a custom drag image that looks like the text label
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.pointerEvents = 'none';
    document.body.appendChild(dragImage);

    // Set the custom drag image with the calculated offset
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

    // Clean up the temporary element after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
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
          content: textInputValue,
        });
      } else {
        // Create new label
        await axios.post('/api/layout/labels', {
          content: textInputValue,
          x_position: textInputPosition.x,
          y_position: textInputPosition.y,
          page_id: currentPageId,
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

  const handlePageChange = (pageId) => {
    setCurrentPageId(pageId);
    setEditMode(false); // Exit edit mode when changing pages
  };

  const handleNewPage = async () => {
    if (!newPageName.trim()) {
      setError(translate('Page name is required'));
      return;
    }

    try {
      const response = await axios.post('/api/layout/pages', {
        name: newPageName.trim(),
      });

      setLayoutPages((prev) => [...prev, response.data]);
      setCurrentPageId(response.data.id);
      setNewPageName('');
      setShowNewPageDialog(false);
      setError('');
    } catch (err) {
      setError(translate('Failed to create new page. Please try again.'));
    }
  };

  const handleDeletePage = async (pageId) => {
    if (pageId === 1) {
      setError(translate('Cannot delete the default page'));
      return;
    }

    if (!window.confirm(translate('Are you sure you want to delete this page? All layouts and labels on this page will be permanently deleted.'))) {
      return;
    }

    try {
      await axios.delete(`/api/layout/pages/${pageId}`);
      setLayoutPages((prev) => prev.filter((page) => page.id !== pageId));

      if (currentPageId === pageId) {
        setCurrentPageId(1); // Switch to default page
      }

      setError('');
    } catch (err) {
      setError(translate('Failed to delete page. Please try again.'));
    }
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
      await axios.delete(`/api/layout/equipment/${equipmentId}?pageId=${currentPageId}`);
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
    const currentEquipmentId = resizeDataRef.current.equipmentId;
    const currentStartData = resizeDataRef.current.startData;

    if (!currentEquipmentId || !currentStartData) {
      return;
    }

    const deltaX = e.clientX - currentStartData.startX;
    const deltaY = e.clientY - currentStartData.startY;

    const newWidth = Math.max(50, currentStartData.startWidth + deltaX);
    const newHeight = Math.max(30, currentStartData.startHeight + deltaY);

    // Store current size in ref
    resizeDataRef.current.currentSize = { width: newWidth, height: newHeight };

    // Update local state immediately for visual feedback
    setLayout((prevLayout) => prevLayout.map((item) => (item.equipment_id === currentEquipmentId
      ? { ...item, width: newWidth, height: newHeight }
      : item)));
  };

  const handleResizeEnd = () => {
    const currentEquipmentId = resizeDataRef.current.equipmentId;
    const { currentSize } = resizeDataRef.current;

    if (currentEquipmentId && currentSize) {
      updateEquipmentSize(currentEquipmentId, currentSize.width, currentSize.height);
    }

    // Clear refs and state
    resizeDataRef.current = { equipmentId: null, startData: null, currentSize: null };
    setResizingEquipment(null);

    // Remove event listeners
    document.removeEventListener('mousemove', resizeFunctionsRef.current.handleResizeMove);
    document.removeEventListener('mouseup', resizeFunctionsRef.current.handleResizeEnd);
  };

  const handleResizeStart = (e, equipmentId) => {
    e.stopPropagation();
    e.preventDefault();

    const equipmentLayout = layout.find((item) => item.equipment_id === equipmentId);
    if (!equipmentLayout) {
      return;
    }

    const startData = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: equipmentLayout.width,
      startHeight: equipmentLayout.height,
    };

    // Set both state and ref immediately
    setResizingEquipment(equipmentId);
    resizeDataRef.current = {
      equipmentId,
      startData,
      currentSize: { width: equipmentLayout.width, height: equipmentLayout.height },
    };

    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', resizeFunctionsRef.current.handleResizeMove);
    document.addEventListener('mouseup', resizeFunctionsRef.current.handleResizeEnd);
  };

  const getEquipmentPosition = (equipmentId) => {
    const equipmentLayout = layout.find((item) => item.equipment_id === equipmentId);

    if (equipmentLayout) {
      return {
        left: `${equipmentLayout.x_position}px`,
        top: `${equipmentLayout.y_position}px`,
        width: `${equipmentLayout.width}px`,
        height: `${equipmentLayout.height}px`,
      };
    }

    return null;
  };

  const getEquipmentDetails = (equipmentId) => {
    return equipment.find((item) => item.id === equipmentId);
  };

  // Get equipment that has a position in the layout
  const positionedEquipment = layout
    .map((layoutItem) => {
      const equipmentItem = getEquipmentDetails(layoutItem.equipment_id);
      return equipmentItem ? { ...equipmentItem, layout: layoutItem } : null;
    })
    .filter(Boolean);

  // Get equipment that doesn't have a position yet
  const unpositionedEquipment = equipment.filter(
    (item) => !layout.some((layoutItem) => layoutItem.equipment_id === item.id),
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
                marginRight: '10px',
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

        {/* Page Tabs */}
        <div className="page-tabs" style={{
          borderBottom: '1px solid #dee2e6',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 0',
        }}>
          {layoutPages.map((page) => (
            <div key={page.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <button
                onClick={() => handlePageChange(page.id)}
                style={{
                  padding: '8px 16px',
                  border: currentPageId === page.id ? '2px solid #007bff' : '1px solid #dee2e6',
                  backgroundColor: currentPageId === page.id ? '#007bff' : '#ffffff',
                  color: currentPageId === page.id ? '#ffffff' : '#495057',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginRight: page.id !== 1 ? '20px' : '5px',
                  position: 'relative',
                }}
              >
                {page.name}
              </button>
              {page.id !== 1 && (
                <button
                  onClick={() => handleDeletePage(page.id)}
                  title={translate('Delete Page')}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '0',
                    padding: '2px 6px',
                    border: '1px solid #dc3545',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '10px',
                    lineHeight: '1',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowNewPageDialog(true)}
            style={{
              padding: '8px 16px',
              border: '1px solid #28a745',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '10px',
            }}
          >
            +
            {' '}
            {translate('New Page')}
          </button>
        </div>

        {error && (
          <div className="alert" style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
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
                overflowY: 'auto',
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#495057' }}>
                  {translate('Equipment Palette')}
                </h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#6c757d' }}>
                  {translate('Drag items to the layout')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {unpositionedEquipment.map((item) => (
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
                        padding: '8px',
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
                backgroundColor: '#ffffff',
              }}
            >
              {/* Equipment items */}
              {positionedEquipment.map((item) => (
                <div
                  key={item.id}
                  className={`equipment-item ${item.in_use ? 'in-use' : ''}`}
                  style={{
                    position: 'absolute',
                    ...getEquipmentPosition(item.id),
                    cursor: editMode ? 'move' : 'pointer',
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
                        border: '1px solid #0056b3',
                      }}
                      draggable={false}
                      onMouseDown={(e) => handleResizeStart(e, item.id)}
                    />
                  </>
                  )}
                </div>
              ))}

              {/* Text labels */}
              {textLabels.map((label) => (
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
                    userSelect: 'none',
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
                  zIndex: 100,
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
          <div className="overlay" onClick={handleCloseReservation} />
          <ReservationWindow
            equipment={selectedEquipment}
            onClose={handleCloseReservation}
          />
        </>
      )}

      {/* New Page Dialog */}
      {showNewPageDialog && (
        <>
          <div className="overlay" onClick={() => setShowNewPageDialog(false)} />
          <div className="dialog" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            minWidth: '300px',
          }}>
            <h3 style={{ marginTop: 0 }}>{translate('Create New Page')}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="newPageName" style={{ display: 'block', marginBottom: '5px' }}>
                {translate('Page Name:')}
              </label>
              <input
                id="newPageName"
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewPage()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowNewPageDialog(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #6c757d',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {translate('Cancel')}
              </button>
              <button
                onClick={handleNewPage}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #28a745',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {translate('Create')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EquipmentLayoutPage;
