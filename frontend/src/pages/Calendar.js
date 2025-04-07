import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  XMarkIcon, ClockIcon, MapPinIcon, UserIcon, PlusIcon, 
  ClipboardIcon, ArrowPathIcon, TrashIcon, PencilIcon 
} from '@heroicons/react/24/outline';

// Configuration des types d'événements avec leurs règles de chevauchement
const eventTypes = [
  { 
    value: 'show', 
    label: 'Spectacle', 
    color: '#800000', 
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

// Nouvelles couleurs pour les statuts de spectacles
const showStatusOptions = [
  { value: 'provisional', label: 'Provisoire', color: '#FF9800' },  // Orange plus doux
  { value: 'confirmed', label: 'Confirmé', color: '#4CAF50' },      // Vert plus visible
  { value: 'cancelled', label: 'Annulé', color: '#F44336' },        // Rouge plus clair
  { value: 'ticketsOpen', label: 'Billetterie ouverte', color: '#2196F3' } // Bleu plus vif
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
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // État pour le formulaire d'événement
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    roomId: '',
    type: 'show',
    coRealizationPercentage: '',
    showStatus: 'provisional',
    description: '',
    color: eventTypes[0].color,
    assignedUsers: []
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

  // Fonction utilitaire pour formater les dates pour les inputs
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
          showStatus: event.showStatus,
          coRealizationPercentage: event.coRealizationPercentage,
          users: event.Users || [] // Ajout des utilisateurs assignés
        }
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des événements');
    }
  }, [api, roomFilter, typeFilter, showAllEvents, user?.id]);

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  }, [api]);

  // Chargement des locales françaises
  useEffect(() => {
    import('@fullcalendar/core/locales/fr');
  }, []);

  // Chargement initial des données
  useEffect(() => {
    fetchRooms();
    fetchEvents();
    fetchUsers();
  }, [fetchRooms, fetchEvents, fetchUsers]);

  // Fonction pour filtrer les utilisateurs en fonction du type d'événement
  useEffect(() => {
    if (users.length > 0 && newEvent.type) {
      let filtered = [];
      
      switch(newEvent.type) {
        case 'show':
          filtered = users.filter(user => user.role === 'artiste');
          break;
        case 'régie':
          filtered = users.filter(user => user.role === 'régie');
          break;
        case 'ticketing':
          filtered = users.filter(user => user.role === 'billetterie');
          break;
        case 'permanence':
        case 'event':
          filtered = users.filter(user => user.role === 'permanence');
          break;
        default:
          filtered = [];
      }
      
      setFilteredUsers(filtered);
    }
  }, [users, newEvent.type]);

  // Fonction pour gérer la sélection des utilisateurs
  const handleUserSelection = (userId) => {
    setNewEvent(prev => {
      const isSelected = prev.assignedUsers.includes(userId);
      
      if (isSelected) {
        // Retirer l'utilisateur s'il est déjà sélectionné
        return {
          ...prev,
          assignedUsers: prev.assignedUsers.filter(id => id !== userId)
        };
      } else {
        // Ajouter l'utilisateur s'il n'est pas déjà sélectionné
        return {
          ...prev,
          assignedUsers: [...prev.assignedUsers, userId]
        };
      }
    });
  };

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
      duration: new Date(currentEvent.end) - new Date(currentEvent.start),
      assignedUsers: currentEvent.extendedProps.users?.map(user => user.id) || []
    });
    
    setSuccess('Événement copié dans le presse-papier');
    setShowModal(false);
  };

  const checkShowLimit = async (roomId, date) => {
    try {
      // Format the date to YYYY-MM-DD for the API query
      const formattedDate = date.toISOString().split('T')[0];
      
      // Get all events for this room on this day
      const response = await api.get(`/events?roomId=${roomId}&date=${formattedDate}`);
      const roomEvents = response.data.data.events;
      
      // Count shows on this day
      const showCount = roomEvents.filter(event => {
        const eventDate = new Date(event.start);
        return event.type === 'show' && 
               eventDate.toISOString().split('T')[0] === formattedDate;
      }).length;
      
      return showCount >= 5;
    } catch (error) {
      console.error('Error checking show limit:', error);
      return false; // In case of error, allow the operation to proceed
    }
  };
  
  const handlePasteEvent = async (info) => {
    if (!clipboardEvent) {
      setError('Aucun événement dans le presse-papier');
      return;
    }
    
    // Créer la date de début à partir de la date cliquée
    const clickedDate = new Date(info.dateStr || info.start);
    
    // Calculer la date de fin en fonction de la durée de l'événement original
    const endDate = new Date(clickedDate.getTime() + clipboardEvent.duration);
    
    // Trouver le type d'événement et sa couleur
    const eventTypeObj = eventTypes.find(type => type.value === clipboardEvent.type);
    const eventColor = eventTypeObj ? eventTypeObj.color : eventTypes[0].color;
    
    // Check show limit if this is a show
    if (clipboardEvent.type === 'show') {
      const hasReachedLimit = await checkShowLimit(clipboardEvent.roomId, clickedDate);
      if (hasReachedLimit) {
        setError('Impossible d\'ajouter plus de 5 spectacles par jour dans cette salle');
        setTimeout(() => setError(''), 5000);
        return;
      }
    }
    
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
      assignedUsers: clipboardEvent.assignedUsers || []
    };
    
    try {
      await api.post('/events', eventData);
      setSuccess('Événement collé avec succès');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'événement');
      setTimeout(() => setError(''), 5000);
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
    const { name, value, type } = e.target;
    
    // Convertir les valeurs numériques
    if (type === 'number') {
      setNewEvent(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Fonction pour éditer un événement existant
  const handleEdit = () => {
    if (!currentEvent) return;
    
    setNewEvent({
      id: currentEvent.id,
      title: currentEvent.title,
      start: formatDateForInput(currentEvent.start),
      end: formatDateForInput(currentEvent.end),
      roomId: currentEvent.extendedProps.room?.id || (rooms.length > 0 ? rooms[0].id.toString() : ''),
      type: currentEvent.extendedProps.type || 'show',
      showStatus: currentEvent.extendedProps.showStatus || 'provisional',
      description: currentEvent.extendedProps.description || '',
      coRealizationPercentage: currentEvent.extendedProps.coRealizationPercentage || '',
      color: currentEvent.color,
      assignedUsers: currentEvent.extendedProps.users?.map(user => user.id) || []
    });
    
    setModalType('edit');
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression de l\'événement');
    }
  };
  
  // Fonction améliorée pour vérifier si un événement peut chevaucher d'autres événements
  const canEventsOverlap = (movingEventType, stillEventType) => {
    // Trouver la configuration du type d'événement en mouvement
    const movingEventConfig = eventTypes.find(type => type.value === movingEventType);
    
    // Si on ne trouve pas la configuration, ne pas autoriser le chevauchement
    if (!movingEventConfig) return false;
    
    // Vérifier si le type d'événement immobile est dans la liste des types avec lesquels
    // l'événement en mouvement peut se chevaucher
    return movingEventConfig.canOverlapWith.includes(stillEventType);
  };
  
  // Fonction de soumission du formulaire améliorée
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      // Check show limit if this is a show and we're adding a new event
      if (newEvent.type === 'show' && modalType === 'add') {
        const hasReachedLimit = await checkShowLimit(newEvent.roomId, new Date(newEvent.start));
        if (hasReachedLimit) {
          setError('Impossible d\'ajouter plus de 5 spectacles par jour dans cette salle');
          return;
        }
      }
      
      
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
            // Vérifier si les types peuvent se chevaucher
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
      
      // Préparer les données de l'événement
      const eventData = {
        title: newEvent.title,
        start: new Date(newEvent.start).toISOString(),
        end: new Date(newEvent.end).toISOString(),
        roomId: newEvent.roomId,
        type: newEvent.type,
        description: newEvent.description,
        creatorId: user.id,
        coRealizationPercentage: newEvent.coRealizationPercentage,
        assignedUsers: newEvent.assignedUsers // Ajout des utilisateurs assignés
      };
      
      
      // Ajouter le statut du spectacle si c'est un spectacle
      if (newEvent.type === 'show') {
        const statusOption = showStatusOptions.find(option => option.value === newEvent.showStatus);
        eventData.showStatus = newEvent.showStatus;
        eventData.color = statusOption ? statusOption.color : eventTypes.find(t => t.value === 'show').color;
      } else {
        // Utiliser la couleur du type d'événement
        const typeOption = eventTypes.find(t => t.value === newEvent.type);
        eventData.color = typeOption ? typeOption.color : '#800000';
      }
      
      // Créer ou mettre à jour l'événement
      if (modalType === 'add') {
        await api.post('/events', eventData);
        setSuccess('Événement créé avec succès');
      } else {
        await api.patch(`/events/${newEvent.id}`, eventData);
        setSuccess('Événement mis à jour avec succès');
      }
      
      setShowModal(false);
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création/modification de l\'événement');
      // Keep the error message visible longer
      setTimeout(() => setError(''), 5000);
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
            onClick={() => handleNewEvent({
              start: new Date(),
              end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
            })}
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
                    {currentEvent.extendedProps.type === 'show' && currentEvent.extendedProps.showStatus && (
                      <span className="ml-2">
                        ({showStatusOptions.find(s => s.value === currentEvent.extendedProps.showStatus)?.label || currentEvent.extendedProps.showStatus})
                      </span>
                    )}
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
                      <p className="text-xs text-gray-5-000 uppercase font-semibold">Créateur</p>
                      <p className="text-sm text-gray-700">
                        {currentEvent.extendedProps.creator?.firstName} {currentEvent.extendedProps.creator?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {currentEvent.extendedProps.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{currentEvent.extendedProps.description}</p>
                  </div>
                )}
                
                {/* Actions pour les spectacles */}
                {currentEvent.extendedProps.type === 'show' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Statut du spectacle</h4>
                    <div className="flex flex-wrap gap-2">
                      {showStatusOptions.map(status => (
                        <button
                          key={status.value}
                          onClick={() => handleConfirmShow(status.value)}
                          className="px-3 py-1 rounded-md text-white text-xs font-medium shadow-sm transition-colors"
                          style={{ backgroundColor: status.color }}
                          disabled={currentEvent.extendedProps.showStatus === status.value}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex justify-between mt-6">
                  <div>
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
                    >
                      <TrashIcon className="h-5 w-5 mr-1" />
                      Supprimer
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyEvent}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
                    >
                      <ClipboardIcon className="h-5 w-5 mr-1" />
                      Copier
                    </button>
                    <button
                      onClick={handleEdit}
                      className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
                    >
                      <PencilIcon className="h-5 w-5 mr-1" />
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Formulaire d'ajout/modification d'événement */}
            {(modalType === 'add' || modalType === 'edit') && (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Titre de l'événement*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newEvent.title}
                      onChange={handleInputChange}
                      required
                      className="form-input w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                      placeholder="Titre de l'événement"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Date et heure de début*
                      </label>
                      <input
                        type="datetime-local"
                        name="start"
                        value={newEvent.start}
                        onChange={handleInputChange}
                        required
                        className="form-input w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Date et heure de fin*
                      </label>
                      <input
                        type="datetime-local"
                        name="end"
                        value={newEvent.end}
                        onChange={handleInputChange}
                        required
                        className="form-input w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Type d'événement*
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {eventTypes.map(type => (
                          <div 
                            key={type.value}
                            onClick={() => setNewEvent(prev => ({ ...prev, type: type.value }))}
                            className={`cursor-pointer p-3 rounded-lg border-2 transition-all flex items-center ${
                              newEvent.type === type.value 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-primary/30'
                            }`}
                          >
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: type.color }}
                            ></div>
                            <span className={`text-sm ${newEvent.type === type.value ? 'font-medium' : ''}`}>
                              {type.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Salle*
                      </label>
                      <div className="relative">
                        <select
                          name="roomId"
                          value={newEvent.roomId}
                          onChange={handleInputChange}
                          required
                          className="form-select w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all appearance-none pl-4 pr-10 py-2"
                        >
                          <option value="">Sélectionner une salle</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {newEvent.type === 'show' && (
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="text-primary font-medium mb-3">Options du spectacle</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary mb-1">
                            Statut du spectacle
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {showStatusOptions.map(status => (
                              <div 
                                key={status.value}
                                onClick={() => setNewEvent(prev => ({ ...prev, showStatus: status.value }))}
                                className={`cursor-pointer p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                                  newEvent.showStatus === status.value 
                                    ? 'border-primary shadow-md' 
                                    : 'border-gray-200 hover:border-primary/30'
                                }`}
                                style={{ backgroundColor: newEvent.showStatus === status.value ? `${status.color}20` : '' }}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full mb-1" 
                                  style={{ backgroundColor: status.color }}
                                ></div>
                                <span className={`text-sm text-center ${newEvent.showStatus === status.value ? 'font-medium' : ''}`}>
                                  {status.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-primary mb-1">
                            Co-réalisation (%)
                          </label>
                          <input
                            type="number"
                            name="coRealizationPercentage"
                            value={newEvent.coRealizationPercentage || ''}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="form-input w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                            placeholder="Pourcentage de co-réalisation"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newEvent.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="form-textarea w-full rounded-md border-gold focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                      placeholder="Description de l'événement"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md shadow-sm transition-colors"
                  >
                    {modalType === 'add' ? 'Créer' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Dialogue de sélection après clic sur date/heure */}
      {showSelectionDialog && selectedTimeInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Que souhaitez-vous faire ?
              </h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSelectionDialog(false);
                    handleNewEvent(selectedTimeInfo);
                  }}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-md shadow-sm transition-colors flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Créer un nouvel événement
                </button>
                
                {clipboardEvent && (
                  <button
                    onClick={() => {
                      setShowSelectionDialog(false);
                      handlePasteEvent(selectedTimeInfo);
                    }}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center"
                  >
                    <ClipboardIcon className="h-5 w-5 mr-2" />
                    Coller l'événement ({clipboardEvent.title})
                  </button>
                )}
                
                <button
                  onClick={() => setShowSelectionDialog(false)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
