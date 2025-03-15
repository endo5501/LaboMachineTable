import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { format, parse, addMinutes, isWithinInterval } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import translate from '../utils/translate';

function ReservationWindow({ equipment, onClose }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [existingReservations, setExistingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Generate time slots from 0:00 to 23:30 in 30-minute intervals
    const slots = [];
    const startTime = parse('00:00', 'HH:mm', new Date());
    const endTime = parse('23:30', 'HH:mm', new Date());
    
    let currentTime = startTime;
    while (currentTime <= endTime) {
      slots.push({
        time: format(currentTime, 'HH:mm'),
        label: format(currentTime, 'HH:mm')
      });
      currentTime = addMinutes(currentTime, 30);
    }
    
    setTimeSlots(slots);
    fetchReservations();
  }, [equipment.id]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reservations/equipment/${equipment.id}`);
      setExistingReservations(response.data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load existing reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSlotReserved = (slot) => {
    const slotTime = parse(slot.time, 'HH:mm', new Date());
    
    return existingReservations.some(reservation => {
      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);
      
      return isWithinInterval(slotTime, { start: startTime, end: endTime });
    });
  };

  const isSlotSelected = (slot) => {
    return selectedSlots.includes(slot.time);
  };

  const handleSlotClick = (slot) => {
    if (isSlotReserved(slot)) return; // Can't select already reserved slots
    
    setSelectedSlots(prevSelected => {
      if (prevSelected.includes(slot.time)) {
        // Deselect the slot
        return prevSelected.filter(time => time !== slot.time);
      } else {
        // Select the slot
        return [...prevSelected, slot.time];
      }
    });
  };

  const handleSave = async () => {
    if (selectedSlots.length === 0) {
      setError(translate('Please select at least one time slot.'));
      return;
    }
    
    try {
      setSaving(true);
      
      // Sort selected slots
      const sortedSlots = [...selectedSlots].sort();
      
      // Create reservation data
      // For simplicity, we're creating a reservation for today with the selected time slots
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      
      // Parse the first and last selected time slots
      const firstSlot = parse(sortedSlots[0], 'HH:mm', new Date());
      const lastSlot = parse(sortedSlots[sortedSlots.length - 1], 'HH:mm', new Date());
      // Add 30 minutes to the last slot to get the end time
      const endTime = addMinutes(lastSlot, 30);
      
      // Create start and end datetime objects
      const startDateTime = new Date(year, month, day, firstSlot.getHours(), firstSlot.getMinutes());
      const endDateTime = new Date(year, month, day, endTime.getHours(), endTime.getMinutes());
      
      // Create the reservation
      await axios.post('/api/reservations', {
        equipment_id: equipment.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
      });
      
      // Close the reservation window
      onClose();
    } catch (err) {
      console.error('Error saving reservation:', err);
      setError(translate('Failed to save reservation. Please try again.'));
      setSaving(false);
    }
  };

  return (
    <div className="reservation-window">
      <div className="reservation-window-header">
        <h3 className="reservation-window-title">
          {translate('Reserve')} {equipment.name}
        </h3>
        <button className="close-button" onClick={onClose}>×</button>
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
        <p>{translate('Loading...')}</p>
      ) : (
        <>
          <div className="time-slots">
            {timeSlots.map(slot => (
              <div 
                key={slot.time}
                className={`time-slot ${isSlotReserved(slot) ? 'unavailable' : ''} ${isSlotSelected(slot) ? 'selected' : ''}`}
                onClick={() => handleSlotClick(slot)}
              >
                <span className="time-label">{slot.label}</span>
                {isSlotReserved(slot) && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#721c24' }}>
                    {translate('Reserved')}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="reservation-actions">
            <button 
              className="cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              {translate('Cancel')}
            </button>
            <button 
              onClick={handleSave}
              disabled={selectedSlots.length === 0 || saving}
            >
              {saving ? translate('Saving...') : translate('Confirm Reservation')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ReservationWindow;
