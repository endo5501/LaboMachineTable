import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { format, parse, isWithinInterval } from 'date-fns';
import ReservationWindow from '../components/ReservationWindow';
import translate from '../utils/translate';

function ReservationStatusPage() {
  const [equipment, setEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showReservationWindow, setShowReservationWindow] = useState(false);
  const [userMap, setUserMap] = useState({});

  // Generate time slots from 0:00 to 23:30 in 30-minute intervals
  const timeSlots = [];
  const startTime = parse('00:00', 'HH:mm', new Date());
  const endTime = parse('23:30', 'HH:mm', new Date());
  
  let currentTime = startTime;
  while (currentTime <= endTime) {
    timeSlots.push({
      time: format(currentTime, 'HH:mm'),
      label: format(currentTime, 'HH:mm')
    });
    currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
  }

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment, reservations, and users data in parallel
      const [equipmentResponse, reservationsResponse, usersResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/reservations'),
        axios.get('/api/users')
      ]);
      
      // Create a map of user IDs to usernames for quick lookup
      const userMap = {};
      usersResponse.data.forEach(user => {
        userMap[user.id] = user.username;
      });
      
      // Add the userMap to component state for later use
      setUserMap(userMap);
      
      setEquipment(equipmentResponse.data);
      setReservations(reservationsResponse.data);
      setError('');
    } catch (err) {
      setError(translate('Failed to load reservation data. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const handleEquipmentClick = (equipmentItem) => {
    setSelectedEquipment(equipmentItem);
    setShowReservationWindow(true);
  };

  const handleCloseReservation = () => {
    setShowReservationWindow(false);
    setSelectedEquipment(null);
    // Refresh data after reservation
    fetchData();
  };

  const isSlotReserved = (equipmentId, slot) => {
    const slotTime = parse(slot.time, 'HH:mm', selectedDate);
    
    return reservations.some(reservation => {
      if (reservation.equipment_id !== equipmentId) return false;
      
      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);
      
      // Check if the reservation is on the selected date
      const reservationDate = new Date(startTime);
      const selectedDateObj = new Date(selectedDate);
      
      if (
        reservationDate.getFullYear() !== selectedDateObj.getFullYear() ||
        reservationDate.getMonth() !== selectedDateObj.getMonth() ||
        reservationDate.getDate() !== selectedDateObj.getDate()
      ) {
        return false;
      }
      
      return isWithinInterval(slotTime, { start: startTime, end: endTime });
    });
  };

  const getReservationUser = (equipmentId, slot) => {
    const slotTime = parse(slot.time, 'HH:mm', selectedDate);
    
    const reservation = reservations.find(reservation => {
      if (reservation.equipment_id !== equipmentId) return false;
      
      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);
      
      // Check if the reservation is on the selected date
      const reservationDate = new Date(startTime);
      const selectedDateObj = new Date(selectedDate);
      
      if (
        reservationDate.getFullYear() !== selectedDateObj.getFullYear() ||
        reservationDate.getMonth() !== selectedDateObj.getMonth() ||
        reservationDate.getDate() !== selectedDateObj.getDate()
      ) {
        return false;
      }
      
      return isWithinInterval(slotTime, { start: startTime, end: endTime });
    });
    
    return reservation ? reservation.user_id : null;
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{translate('Reservation Status')}</h2>
          <div>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            <button onClick={fetchData}>{translate('Refresh')}</button>
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
          <p>{translate('Loading...')}</p>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                    {translate('Time')}
                  </th>
                  {equipment.map(item => (
                    <th key={item.id}>{item.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 || equipment.length === 0 ? (
                  <tr>
                    <td colSpan={equipment.length + 1} style={{ textAlign: 'center' }}>
                      {translate('No data available')}
                    </td>
                  </tr>
                ) : (
                  timeSlots.map(slot => (
                    <tr key={slot.time}>
                      <td 
                        style={{ 
                          position: 'sticky', 
                          left: 0, 
                          backgroundColor: '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {slot.label}
                      </td>
                      {equipment.map(item => {
                        const reserved = isSlotReserved(item.id, slot);
                        const userId = getReservationUser(item.id, slot);
                        const username = userId ? userMap[userId] : null;
                        
                        return (
                          <td 
                            key={`${slot.time}-${item.id}`}
                            style={{ 
                              backgroundColor: reserved ? '#f8d7da' : '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              padding: '8px 4px',
                              fontSize: reserved ? '0.8rem' : '1rem'
                            }}
                            onClick={() => handleEquipmentClick(item)}
                          >
                            {reserved && username ? username : (reserved ? '✓' : '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          <p>
            {translate('Click on equipment name or time slot to make a reservation.')}
          </p>
        </div>
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

export default ReservationStatusPage;
