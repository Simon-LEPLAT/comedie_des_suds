import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AuthContext } from '../context/AuthContext';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Calendar = () => {
  const { user, api } = useContext(AuthContext);
  const calendarRef = useRef(null);
  
  // State for rooms, events, and filters
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // State for new event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    roomId: '',
    type: 'show',
    description: '',
    color: '#4CAF50'
  });
  
  // Fetch rooms and events on component mount
  // Fix useEffect dependencies
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchRooms(), fetchEvents()]);
    };
    loadData();
  }, []);  // We'll disable the exhaustive-deps warning for this case

  // Move these functions inside the component but outside useEffect
  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [api]);
  
  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchRooms();
    fetchEvents();
  }, [fetchRooms, fetchEvents]);

  // Handle event click
  const handleEventClick = (info) => {
    setCurrentEvent(info.event.extendedProps);
    setModalType('view');
    setShowModal(true);
  };
  
  // Handle date click
  const handleDateClick = (info) => {
    const startDate = new Date(info.dateStr);
    const endDate = new Date(info.dateStr);
    endDate.setHours(startDate.getHours() + 1);
    
    setNewEvent({
      ...newEvent,
      start: startDate.toISOString().slice(0, 16),
      end: endDate.toISOString().slice(0, 16)
    });
    
    setModalType('add');
    setShowModal(true);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setNewEvent({ ...newEvent, [name]: checked });
    } else {
      setNewEvent({ ...newEvent, [name]: value });
    }
  };
  
  // Submit new event
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/events', newEvent);
      
      // Refresh events
      fetchEvents();
      setShowModal(false);
      
      // Reset form
      setNewEvent({
        title: '',
        start: '',
        end: '',
        roomId: '',
        type: 'show',
        description: '',
        color: '#4CAF50'
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };
  
  // Delete event
  const handleDeleteEvent = async () => {
    if (!currentEvent) return;
    
    try {
      await api.delete(`/events/${currentEvent.id}`);
      fetchEvents();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  
  // Format events for FullCalendar
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: event
  }));
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-primary mb-6">Calendrier</h2>
      
      {/* Add button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setModalType('add');
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-accent"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un événement
        </button>
      </div>
      
      {/* Calendar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={formattedEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          }}
        />
      </div>
      
      {/* Modal for adding/viewing events */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-primary">
                {modalType === 'add' ? 'Ajouter un événement' : 'Détails de l\'événement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'add' ? (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                      <input
                        type="text"
                        name="title"
                        value={newEvent.title}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                      <select
                        name="roomId"
                        value={newEvent.roomId}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Sélectionner une salle</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                      <input
                        type="datetime-local"
                        name="start"
                        value={newEvent.start}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                      <input
                        type="datetime-local"
                        name="end"
                        value={newEvent.end}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="type"
                        value={newEvent.type}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="show">Spectacle</option>
                        <option value="permanence">Permanence</option>
                        <option value="ticketing">Billetterie</option>
                        <option value="technical">Régie</option>
                        <option value="rental">Location</option>
                        <option value="event">Événement</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={newEvent.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        rows="3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                      <input
                        type="color"
                        name="color"
                        value={newEvent.color}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded-md h-10"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-accent"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {/* View mode */}
                  <div className="space-y-4">
                    {currentEvent && (
                      <>
                        <div>
                          <h4 className="text-lg font-semibold">{currentEvent.title}</h4>
                          <p className="text-gray-600">{currentEvent.description}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">Date de début</p>
                          <p>{new Date(currentEvent.start).toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">Date de fin</p>
                          <p>{new Date(currentEvent.end).toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">Type</p>
                          <p>{currentEvent.type === 'show' ? 'Spectacle' : 
                              currentEvent.type === 'permanence' ? 'Permanence' : 
                              currentEvent.type === 'ticketing' ? 'Billetterie' : 
                              currentEvent.type === 'technical' ? 'Régie' : 
                              currentEvent.type === 'rental' ? 'Location' : 'Événement'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {user.role === 'administrateur' && (
                      <button
                        onClick={handleDeleteEvent}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Supprimer
                      </button>
                    )}
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this comment to disable the ESLint warning for this specific file
/* eslint-disable react-hooks/exhaustive-deps */

export default Calendar;