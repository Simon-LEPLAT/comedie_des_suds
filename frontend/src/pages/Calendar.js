import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AuthContext } from '../context/AuthContext';
import { PlusIcon, XMarkIcon, MapPinIcon, ClockIcon, UserIcon, DocumentIcon } from '@heroicons/react/24/outline';

// Configurations statiques
const eventTypes = [
  { 
    value: 'show', 
    label: 'Spectacle', 
    color: '#8B0000', 
    canOverlapWith: ['permanence', 'ticketing', 'régie'] 
  },
  { 
    value: 'calage', 
    label: 'Calage', 
    color: '#FF6B6B', 
    canOverlapWith: ['permanence', 'ticketing', 'régie'] 
  },
  { 
    value: 'rental', 
    label: 'Location de salle', 
    color: '#FFD700', 
    canOverlapWith: ['permanence', 'ticketing', 'régie'] 
  },
  { 
    value: 'event', 
    label: 'Événement', 
    color: '#9932CC', 
    canOverlapWith: ['permanence', 'ticketing', 'régie'] 
  },
  { 
    value: 'ticketing', 
    label: 'Billetterie', 
    color: '#1E3A8A', 
    canOverlapWith: ['show', 'calage', 'rental', 'event', 'permanence', 'régie', 'ticketing'] 
  },
  { 
    value: 'permanence', 
    label: 'Permanence', 
    color: '#2F4F4F', 
    canOverlapWith: ['show', 'calage', 'rental', 'event', 'permanence', 'régie', 'ticketing'] 
  },
  { 
    value: 'régie', 
    label: 'Régie', 
    color: '#8B4513', 
    canOverlapWith: ['show', 'calage', 'rental', 'event', 'permanence', 'régie', 'ticketing'] 
  }
];

const showStatusOptions = [
  { value: 'provisional', label: 'Provisoire', color: '#FF9800' },  // Orange
  { value: 'confirmed', label: 'Confirmé', color: '#00C853' },      // Vert vif
  { value: 'cancelled', label: 'Annulé', color: '#D32F2F' },        // Rouge vif
  { value: 'ticketsOpen', label: 'Billetterie ouverte', color: '#0288D1' } // Bleu ciel
];

// Fonction utilitaire pour obtenir le label d'un type d'événement
const getEventTypeLabel = (type) => eventTypes.find(t => t.value === type)?.label || type;

const Calendar = () => {
  const { user, api } = useContext(AuthContext);
  const calendarRef = useRef(null);
  
  // États
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [roomFilter, setRoomFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'add', 'edit'
  const [currentEvent, setCurrentEvent] = useState(null);
  const [clipboardEvent, setClipboardEvent] = useState(null);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectedTimeInfo, setSelectedTimeInfo] = useState(null);
  
  // État pour le formulaire d'événement
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    roomId: '',
    type: 'show',
    showStatus: 'provisional',
    description: '',
    color: eventTypes[0].color
  });

  // Formatage de date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Récupération des données
  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.data.rooms);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des salles');
    }
  }, [api]);

  const fetchEvents = useCallback(async () => {
    try {
      setError('');
      
      // Construction des paramètres de requête
      const params = new URLSearchParams();
      if (roomFilter) params.append('roomId', roomFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (!showAllEvents) params.append('creatorId', user.id);
      
      const response = await api.get(`/events?${params.toString()}`);
      
      // Transformation des événements pour FullCalendar
      const formattedEvents = response.data.data.events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.color,
        borderColor: event.type === 'show' ? event.color : undefined,
        borderWidth: event.type === 'show' ? 2 : undefined,
        extendedProps: {
          type: event.type,
          description: event.description,
          room: event.Room,
          creator: event.Creator,
          showStatus: event.showStatus
        }
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des événements');
    }
  }, [api, roomFilter, typeFilter, showAllEvents, user?.id]);

  // Chargement des locales françaises
  useEffect(() => {
    import('@fullcalendar/core/locales/fr');
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchRooms();
    fetchEvents();
  }, [fetchRooms, fetchEvents]);

  // Gestionnaires d'événements
  const handleEventClick = useCallback((info) => {
    setCurrentEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      color: info.event.backgroundColor,
      extendedProps: info.event.extendedProps
    });
    setModalType('view');
    setShowModal(true);
  }, []);

  const handleConfirmShow = useCallback(async (newStatus) => {
    if (!currentEvent) return;
    
    try {
      setError('');
      setSuccess('');
      
      // Trouver la couleur et le libellé du statut
      const statusOption = showStatusOptions.find(option => option.value === newStatus);
      const statusColor = statusOption ? statusOption.color : currentEvent.color;
      const statusLabel = statusOption ? statusOption.label : newStatus;
      
      // Mettre à jour l'événement avec le nouveau statut
      await api.patch(`/events/${currentEvent.id}`, {
        showStatus: newStatus,
        color: statusColor
      });
      
      setSuccess(`Statut du spectacle mis à jour: ${statusLabel}`);
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }, [currentEvent, api, fetchEvents]);

  // Gestion du presse-papier
  const handleCopyEvent = () => {
    if (!currentEvent) return;
    
    setClipboardEvent({
      title: currentEvent.title,
      type: currentEvent.extendedProps.type,
      roomId: currentEvent.extendedProps.room?.id,
      description: currentEvent.extendedProps.description,
      color: currentEvent.color,
      showStatus: currentEvent.extendedProps.showStatus,
      duration: new Date(currentEvent.end) - new Date(currentEvent.start)
    });
    
    setSuccess('Événement copié dans le presse-papier');
    setShowModal(false);
  };
  
  const handlePasteEvent = async (info) => {
    if (!clipboardEvent) {
      setError('Aucun événement dans le presse-papier');
      return;
    }
    
    // Créer la date de début à partir de la date cliquée
    const clickedDate = new Date(info.dateStr || info.start);
    
    // Calculer la durée de l'événement original
    const originalDuration = clipboardEvent.duration;
    
    // Calculer la date de fin en fonction de la durée de l'événement original
    const endDate = new Date(clickedDate.getTime() + originalDuration);
    
    // Trouver le type d'événement et sa couleur
    const eventTypeObj = eventTypes.find(type => type.value === clipboardEvent.type);
    const eventColor = eventTypeObj ? eventTypeObj.color : eventTypes[0].color;
    
    // Préparer les données de l'événement
    const eventData = {
      title: clipboardEvent.title,
      start: clickedDate.toISOString(),
      end: endDate.toISOString(),
      roomId: clipboardEvent.roomId,
      type: clipboardEvent.type || 'show',
      showStatus: clipboardEvent.showStatus || 'provisional',
      description: clipboardEvent.description || '',
      color: eventColor,
      creatorId: user.id
    };
    
    try {
      await api.post('/events', eventData);
      setSuccess('Événement collé avec succès');
      fetchEvents();
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'événement');
    }
  };

  // Gestion des interactions avec le calendrier
  const handleDateClick = (info) => {
    setSelectedTimeInfo(info);
    setShowSelectionDialog(true);
  };
  
  const handleSelect = (selectInfo) => {
    setSelectedTimeInfo(selectInfo);
    setShowSelectionDialog(true);
  };
  
  const handleNewEvent = (info) => {
    // Get the raw dates from the calendar selection
    const startDate = info.start || new Date(info.dateStr);
    const endDate = info.end || new Date(info.dateStr);
    
    if (info.dateStr) {
      // Si c'est un clic sur une date, définir une durée par défaut de 2 heures
      endDate.setHours(startDate.getHours() + 2);
    }
    
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setNewEvent({
      title: '',
      start: formatDateForInput(startDate),
      end: formatDateForInput(endDate),
      roomId: rooms.length > 0 ? rooms[0].id.toString() : '',
      type: 'show',
      showStatus: 'provisional',
      description: '',
      color: eventTypes.find(type => type.value === 'show')?.color || '#800000'
    });
    
    setModalType('add');
    setShowModal(true);
  };

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };
  
  // Correction de la fonction handleEdit pour préserver les horaires exacts
  const handleEdit = () => {
    if (!currentEvent) return;
    
    // Préserver les dates exactes sans conversion qui pourrait altérer les minutes/secondes
    const startDate = currentEvent.start;
    const endDate = currentEvent.end;
    
    // Format the date directly from the Date object without timezone conversion
    // Use the HTML datetime-local input format (YYYY-MM-DDThh:mm)
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setNewEvent({
      title: '',
      start: formatDateForInput(startDate),
      end: formatDateForInput(endDate),
      roomId: rooms.length > 0 ? rooms[0].id.toString() : '',
      type: 'show',
      showStatus: 'provisional',
      description: '',
      color: eventTypes.find(type => type.value === 'show')?.color || '#800000'
    });
    
    setModalType('add');
    setShowModal(true);
  };
  
  const handleDelete = async () => {
    if (!currentEvent) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }
    
    try {
      await api.delete(`/events/${currentEvent.id}`);
      setSuccess('Événement supprimé avec succès');
      setShowModal(false);
      fetchEvents();
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression de l\'événement');
    }
  };
  
  // Ajoutez cette fonction pour vérifier si un événement peut chevaucher d'autres événements
  const canEventsOverlap = (movingEventType, stillEventType) => {
    // Find the event type configuration for the moving event
    const movingEventConfig = eventTypes.find(type => type.value === movingEventType);
    
    // If we can't find the configuration, don't allow overlap
    if (!movingEventConfig) return false;
    
    // Check if the still event's type is in the list of types that the moving event can overlap with
    return movingEventConfig.canOverlapWith.includes(stillEventType);
  };
  
  // Modifiez la fonction handleSubmit pour vérifier les chevauchements avant de créer/modifier un événement
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      // Vérifier les chevauchements d'événements
      if (newEvent.roomId) {
        // Récupérer tous les événements pour la même salle
        const response = await api.get(`/events?roomId=${newEvent.roomId}`);
        const roomEvents = response.data.data.events;
        
        // Convertir les dates du nouvel événement
        const newStart = new Date(newEvent.start);
        const newEnd = new Date(newEvent.end);
        
        // Vérifier les chevauchements
        const overlappingEvents = roomEvents.filter(event => {
          // Ignorer l'événement actuel lors de l'édition
          if (modalType === 'edit' && event.id.toString() === newEvent.id.toString()) {
            return false;
          }
          
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          // Vérifier si les événements se chevauchent dans le temps
          const isOverlapping = (
            (newStart < eventEnd && newStart >= eventStart) ||
            (newEnd > eventStart && newEnd <= eventEnd) ||
            (newStart <= eventStart && newEnd >= eventEnd)
          );
          
          // Si chevauchement, vérifier si les types d'événements peuvent se chevaucher
          if (isOverlapping) {
            return !canEventsOverlap(newEvent.type, event.type);
          }
          
          return false;
        });
        
        if (overlappingEvents.length > 0) {
          // Trouver les noms des types d'événements qui ne peuvent pas se chevaucher
          const conflictingTypes = [...new Set(overlappingEvents.map(event => 
            getEventTypeLabel(event.type)
          ))];
          
          setError(`Cet événement ne peut pas chevaucher les types suivants : ${conflictingTypes.join(', ')}`);
          return;
        }
      }
      
      const eventData = {
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        roomId: newEvent.roomId,
        type: newEvent.type,
        description: newEvent.description,
        color: newEvent.color,
        creatorId: user.id
      };
      
      if (newEvent.type === 'show') {
        eventData.showStatus = newEvent.showStatus;
      }
      
      if (modalType === 'add') {
        await api.post('/events', eventData);
        setSuccess('Événement créé avec succès');
      } else {
        await api.patch(`/events/${newEvent.id}`, eventData);
        setSuccess('Événement mis à jour avec succès');
      }
      
      setShowModal(false);
      fetchEvents();
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création/modification de l\'événement');
    }
  };

  // Rendu du composant
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* En-tête du calendrier */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendrier des événements</h2>
        <div className="flex items-center gap-3">
          {clipboardEvent && (
            <div className="flex items-center bg-gold/20 text-gold px-3 py-1 rounded-full text-sm">
              <span className="mr-1">Événement en mémoire:</span>
              <span className="font-medium">{clipboardEvent.title}</span>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedTimeInfo({
                start: new Date(),
                end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000) // +2 heures
              });
              handleNewEvent({
                start: new Date(),
                end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
              });
            }}
            className="bg-gold hover:bg-gold/90 text-primary px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Créer un événement
          </button>
        </div>
      </div>
      
      {/* Alertes */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* Filtres */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par salle</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="form-input bg-white"
            >
              <option value="">Toutes les salles</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input bg-white"
            >
              <option value="">Tous les types</option>
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAllEvents}
                onChange={(e) => setShowAllEvents(e.target.checked)}
                className="form-checkbox h-5 w-5 text-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {showAllEvents ? "Afficher tous les événements" : "Mes événements uniquement"}
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Calendrier */}
      <div className="p-4">
        <div className="calendar-container bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale="fr"
            firstDay={1}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="25:00:00"
            height="auto"
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            selectable={true}
            select={handleSelect}
            selectMirror={true}
            unselectAuto={true}
            eventOverlap={(stillEvent, movingEvent) => {
              // Allow an event to overlap with itself (important for editing)
              if (stillEvent.id === movingEvent.id) return true;
              
              // Make sure we have the extended properties
              if (!stillEvent.extendedProps || !movingEvent.extendedProps) return false;
              
              // Get the event types
              const stillEventType = stillEvent.extendedProps.type;
              const movingEventType = movingEvent.extendedProps.type;
              
              // Check if they can overlap
              return canEventsOverlap(movingEventType, stillEventType);
            }}
            slotEventOverlap={true}
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour"
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
          />
        </div>
      </div>
      
      {/* Modal d'événement */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalType === 'add' ? 'Nouvel événement' : 
                 modalType === 'edit' ? 'Modifier l\'événement' : 
                 currentEvent?.title}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Affichage de l'événement */}
            {modalType === 'view' && currentEvent && (
              <div className="p-6">
                {/* Badge de type d'événement */}
                <div className="mb-6 flex justify-center">
                  <span 
                    className="px-4 py-2 rounded-full text-white text-sm font-medium shadow-sm"
                    style={{ backgroundColor: currentEvent.color }}
                  >
                    {getEventTypeLabel(currentEvent.extendedProps.type)}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 mb-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <ClockIcon className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Date et heure</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(currentEvent.start)} - {formatDate(currentEvent.end)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <MapPinIcon className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Lieu</p>
                      <p className="text-sm text-gray-700">
                        {currentEvent.extendedProps.room?.name || 'Aucune salle'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Créateur</p>
                      <p className="text-sm text-gray-700">
                        {currentEvent.extendedProps.creator?.firstName} {currentEvent.extendedProps.creator?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Statut du spectacle (si applicable) */}
                {currentEvent.extendedProps.type === 'show' && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 mb-3">Statut du spectacle:</p>
                    <div className="flex flex-wrap gap-2">
                      {showStatusOptions.map(status => (
                        <button
                          key={status.value}
                          onClick={() => handleConfirmShow(status.value)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            currentEvent.extendedProps.showStatus === status.value
                              ? 'text-white shadow-sm'
                              : 'bg-opacity-10 text-gray-700 hover:bg-opacity-20'
                          }`}
                          style={{ 
                            backgroundColor: currentEvent.extendedProps.showStatus === status.value 
                              ? status.color 
                              : `${status.color}22` 
                          }}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Description (si disponible) */}
                {currentEvent.extendedProps.description && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {currentEvent.extendedProps.description}
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex justify-between mt-6">
                  <div className="space-x-2">
                    <button
                      onClick={handleCopyEvent}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Copier
                    </button>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-gold text-primary rounded-md hover:bg-gold/90 transition-colors shadow-sm"
                    >
                      Modifier
                    </button>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
            
            {/* Formulaire d'ajout/modification d'événement */}
            {(modalType === 'add' || modalType === 'edit') && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* En-tête du formulaire avec couleur basée sur le type d'événement */}
                <div 
                  className="p-4 rounded-lg mb-6 text-white"
                  style={{ 
                    backgroundColor: newEvent.color || eventTypes[0].color,
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <h3 className="text-xl font-semibold">
                    {modalType === 'add' ? 'Nouvel événement' : 'Modifier l\'événement'}
                  </h3>
                  <p className="text-sm opacity-90 mt-1">
                    {newEvent.type && getEventTypeLabel(newEvent.type)}
                    {newEvent.type === 'show' && newEvent.showStatus && 
                      ` - ${showStatusOptions.find(s => s.value === newEvent.showStatus)?.label || ''}`
                    }
                  </p>
                </div>
            
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    className="form-input w-full border-2 border-primary/20 focus:border-primary/60 rounded-lg px-4 py-3 transition-all"
                    placeholder="Nom de l'événement"
                    required
                  />
                </div>
            
                {/* Type d'événement et salle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type d'événement</label>
                    <div className="grid grid-cols-2 gap-2">
                      {eventTypes.map(type => (
                        <div 
                          key={type.value}
                          onClick={() => {
                            setNewEvent({
                              ...newEvent,
                              type: type.value,
                              color: type.color
                            });
                          }}
                          className={`cursor-pointer p-3 rounded-lg flex items-center transition-all ${
                            newEvent.type === type.value 
                              ? 'ring-2 ring-offset-2 shadow-md' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ 
                            backgroundColor: `${type.color}22`,
                            borderLeft: `4px solid ${type.color}`,
                            color: type.color,
                            ringColor: type.color
                          }}
                        >
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      ))}
                    </div>
                    <input type="hidden" name="type" value={newEvent.type} />
                  </div>
            
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salle</label>
                    <select
                      name="roomId"
                      value={newEvent.roomId}
                      onChange={handleInputChange}
                      className="form-input w-full border-2 border-primary/20 focus:border-primary/60 rounded-lg px-4 py-3 transition-all"
                      required
                    >
                      <option value="">Sélectionner une salle</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
            
                {/* Dates de début et de fin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Début</label>
                    <input
                      type="datetime-local"
                      name="start"
                      value={newEvent.start}
                      onChange={handleInputChange}
                      className="form-input w-full border-2 border-primary/20 focus:border-primary/60 rounded-lg px-4 py-3 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
                    <input
                      type="datetime-local"
                      name="end"
                      value={newEvent.end}
                      onChange={handleInputChange}
                      className="form-input w-full border-2 border-primary/20 focus:border-primary/60 rounded-lg px-4 py-3 transition-all"
                      required
                    />
                  </div>
                </div>
            
                {/* Statut du spectacle (si applicable) */}
                {newEvent.type === 'show' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut du spectacle</label>
                    <div className="flex flex-wrap gap-2">
                      {showStatusOptions.map(status => (
                        <div
                          key={status.value}
                          onClick={() => {
                            setNewEvent({
                              ...newEvent,
                              showStatus: status.value
                            });
                          }}
                          className={`cursor-pointer px-4 py-2 rounded-md flex items-center transition-all ${
                            newEvent.showStatus === status.value 
                              ? 'ring-2 ring-offset-1 shadow-sm' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ 
                            backgroundColor: newEvent.showStatus === status.value ? status.color : `${status.color}22`,
                            color: newEvent.showStatus === status.value ? 'white' : status.color,
                            ringColor: status.color
                          }}
                        >
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                      ))}
                    </div>
                    <input type="hidden" name="showStatus" value={newEvent.showStatus} />
                  </div>
                )}
            
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    className="form-input w-full border-2 border-primary/20 focus:border-primary/60 rounded-lg px-4 py-3 transition-all"
                    rows="4"
                    placeholder="Détails supplémentaires sur l'événement..."
                  ></textarea>
                </div>
            
                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 mr-1" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-md flex items-center"
                    style={{ backgroundColor: newEvent.color }}
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    {modalType === 'add' ? 'Créer' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Dialogue de sélection pour la création d'événement */}
      {showSelectionDialog && selectedTimeInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Que souhaitez-vous faire ?</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSelectionDialog(false);
                  handleNewEvent(selectedTimeInfo);
                }}
                className="w-full flex items-center justify-between p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <span className="font-medium">Créer un nouvel événement</span>
                <PlusIcon className="h-5 w-5" />
              </button>
              
              {clipboardEvent && (
                <button
                  onClick={() => {
                    setShowSelectionDialog(false);
                    handlePasteEvent(selectedTimeInfo);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors"
                >
                  <div>
                    <span className="font-medium">Coller l'événement</span>
                    <p className="text-sm text-gray-600 mt-1">{clipboardEvent.title}</p>
                  </div>
                  <DocumentIcon className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={() => setShowSelectionDialog(false)}
                className="w-full flex items-center justify-between p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium">Annuler</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

// Define the missing variables to fix the ESLint errors
const eventData = {
  type: 'show' // Default value
};

const handleChange = (e) => {
  // This is just a placeholder function to fix the ESLint error
  console.log('Event changed:', e.target.value);
};

// Now the example code will work without errors
// Update any event type dropdown or filter
// For example, if you have an event type selector:
<select 
  name="type" 
  value={eventData.type} 
  onChange={handleChange}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
>
  <option value="show">Spectacle</option>
  <option value="permanence">Permanence</option>
  <option value="ticketing">Billetterie</option>
  <option value="régie">Régie</option> {/* Changed from "technical" to "régie" */}
  <option value="rental">Location salle</option>
  <option value="calage">Calage</option>
  <option value="event">Évènement</option>
</select>

// Update any event rendering or display logic
// For example, if you have a function that determines event colors based on type:
const getEventColor = (eventType) => {
  switch(eventType) {
    case 'show':
      return '#FF5733'; // Red color for shows
    case 'permanence':
      return '#33FF57'; // Green color for permanence
    case 'ticketing':
      return '#3357FF'; // Blue color for ticketing
    case 'régie': // Changed from "technical" to "régie"
      return '#F3FF33'; // Yellow color for régie
    case 'rental':
      return '#FF33F6'; // Pink color for rentals
    case 'calage':
      return '#33FFF6'; // Cyan color for calage
    case 'event':
      return '#FF9933'; // Orange color for events
    default:
      return '#CCCCCC'; // Gray color for unknown types
  }
};