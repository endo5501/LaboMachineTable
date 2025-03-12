import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parse, isWithinInterval } from 'date-fns';
import ReservationWindow from '../components/ReservationWindow';

function ReservationStatusPage() {
  const [equipment, setEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showReservationWindow, setShowReservationWindow] = useState(false);

  // Generate time slots from 8:00 to 22:00 in 30-minute intervals
  const timeSlots = [];
  const startTime = parse('08:00', 'HH:mm', new Date());
  const endTime = parse('22:00', 'HH:mm', new Date());
  
  let currentTime = startTime;
  while (currentTime <= endTime) {
    timeSlots.push({
      time: format(currentTime, 'HH:mm'),
      label: format(currentTime, 'h:mm a')
    });
    currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
  }

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment and reservations data in parallel
      const [equipmentResponse, reservationsResponse] = await Promise.all([
        axios.get('/api/equipment'),
        axios.get('/api/reservations')
      ]);
      
      setEquipment(equipmentResponse.data);
      setReservations(reservationsResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load reservation data. Please try again later.');
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
          <h2 className="card-title">Reservation Status</h2>
          <div>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            <button onClick={fetchData}>Refresh</button>
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
          <p>Loading reservation data...</p>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                    Equipment
                  </th>
                  {timeSlots.map(slot => (
                    <th key={slot.time}>{slot.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan={timeSlots.length + 1} style={{ textAlign: 'center' }}>
                      No equipment found.
                    </td>
                  </tr>
                ) : (
                  equipment.map(item => (
                    <tr key={item.id}>
                      <td 
                        style={{ 
                          position: 'sticky', 
                          left: 0, 
                          backgroundColor: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEquipmentClick(item)}
                      >
                        {item.name}
                      </td>
                      {timeSlots.map(slot => {
                        const reserved = isSlotReserved(item.id, slot);
                        const userId = getReservationUser(item.id, slot);
                        
                        return (
                          <td 
                            key={`${item.id}-${slot.time}`}
                            style={{ 
                              backgroundColor: reserved ? '#f8d7da' : '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              padding: '8px 4px'
                            }}
                            onClick={() => handleEquipmentClick(item)}
                          >
                            {reserved ? '✓' : ''}
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
            Click on equipment name or time slot to make a reservation.
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
