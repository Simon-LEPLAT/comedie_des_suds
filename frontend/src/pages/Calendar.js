import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  ClipboardIcon,
  CheckIcon,
  UserGroupIcon,
  DocumentIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const Calendar = () => {
  const { user, api } = useContext(AuthContext);
  const calendarRef = useRef(null);
  
  // États pour les données
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // États pour les filtres
  const [roomFilter, setRoomFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAllEvents, setShowAllEvents] = useState(true);

    // États pour les PDF
    const [showPdfSection, setShowPdfSection] = useState(false);
    const [eventPdfs, setEventPdfs] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [currentEvent, setCurrentEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    roomId: '',
    type: 'show',
    showStatus: 'provisional',
    description: '',
    coRealizationPercentage: '',
    color: '',
    assignedUsers: [],
    ticketingLocation: 'online', // Add this new field
    hasDecor: false,
    decorDetails: ''
  });
  // États pour la sélection d'événement
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectedTimeInfo, setSelectedTimeInfo] = useState(null);
  
  // États pour les messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // État pour le presse-papier
  const [clipboardEvent, setClipboardEvent] = useState(null);
  
  // Options pour les types d'événements
  const eventTypes = [
    { value: 'show', label: 'Spectacle', color: '#800000', canOverlapWith: ['permanence', 'ticketing', 'régie'] },
    { value: 'permanence', label: 'Permanence', color: '#4B0082', canOverlapWith: ['show', 'ticketing', 'régie', 'rental', 'calage', 'event'] },
    { value: 'ticketing', label: 'Billetterie', color: '#008000', canOverlapWith: ['show', 'permanence', 'régie', 'rental', 'calage', 'event'] },
    { value: 'régie', label: 'Régie', color: '#0000FF', canOverlapWith: ['show', 'permanence', 'ticketing', 'rental', 'calage', 'event'] },
    { value: 'rental', label: 'Location salle', color: '#FF8C00', canOverlapWith: ['permanence', 'ticketing', 'régie'] },
    { value: 'calage', label: 'Calage', color: '#800080', canOverlapWith: ['permanence', 'ticketing', 'régie'] },
    { value: 'event', label: 'Événement', color: '#FF1493', canOverlapWith: ['permanence', 'ticketing', 'régie'] }
  ];
  
  // Options pour les statuts de spectacle
  const showStatusOptions = [
    { value: 'confirmed', label: 'Confirmé', color: '#008000' },
    { value: 'provisional', label: 'Provisoire', color: '#FFA500' },
    { value: 'ticketsOpen', label: 'Billetterie ouverte', color: '#0000FF' }
  ];
  
  // Fonction pour récupérer les événements
  const fetchEvents = useCallback(async () => {
    try {
      let url = '/events';
      const params = [];
      
      if (roomFilter) params.push(`roomId=${roomFilter}`);
      if (typeFilter) params.push(`type=${typeFilter}`);
      if (!showAllEvents) params.push(`creatorId=${user.id}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      const fetchedEvents = response.data.data.events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.color,
        extendedProps: {
          type: event.type,
          description: event.description,
          room: event.Room,
          creator: event.Creator,
          users: event.Users,
          showStatus: event.showStatus,
          coRealizationPercentage: event.coRealizationPercentage,
          ticketingLocation: event.ticketingLocation,
          hasDecor: event.hasDecor,
          decorDetails: event.decorDetails,
        }
      }));
      
      setEvents(fetchedEvents);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la récupération des événements');
    }
  }, [api, roomFilter, typeFilter, showAllEvents, user.id]);
  
  // Fonction pour récupérer les salles
  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.data.rooms);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la récupération des salles');
    }
  }, [api]);
  
  // Fonction pour récupérer les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la récupération des utilisateurs');
    }
  }, [api]);

  const fetchEventPdfs = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/pdfs`);
      setEventPdfs(response.data.data.pdfs || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la récupération des PDF');
    }
  };
  
  // Effet pour charger les données initiales
  useEffect(() => {
    fetchRooms();
    fetchUsers();
    fetchEvents();
  }, [fetchRooms, fetchUsers, fetchEvents]);
  
  // Effet pour filtrer les utilisateurs en fonction du type d'événement
  useEffect(() => {
    if (!users.length) return;
    
    let filtered = [...users];
    
    // Filtrer les utilisateurs en fonction du type d'événement
    switch (newEvent.type) {
      case 'show':
        filtered = users.filter(user => ['artiste', 'administrateur'].includes(user.role));
        break;
      case 'ticketing':
        filtered = users.filter(user => ['billeterie', 'employé', 'administrateur'].includes(user.role));
        break;
      case 'régie':
        filtered = users.filter(user => ['regie', 'administrateur'].includes(user.role));
        break;
      case 'permanence':
        filtered = users.filter(user => ['permanence', 'administrateur'].includes(user.role));
        break;
      case 'event':
      case 'calage':
      case 'rental':
        filtered = []; // No users can be assigned to these types
        break;
      default:
        filtered = users;
    }
    
    setFilteredUsers(filtered);
  }, [users, newEvent.type]);
  
  // Helper function to check if a room already has 5 shows on a given day
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
  
  // Fonction pour formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Fonction pour formater la date pour les inputs
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  
  // Fonction pour obtenir le libellé d'un type d'événement
  const getEventTypeLabel = (type) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType ? eventType.label : type;
  };
  
  // Fonction pour créer un nouvel événement
  const handleNewEvent = (info) => {
    const startDate = info.start || info.date || new Date();
    let endDate = info.end || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    // Si la sélection est sur une journée entière, ajuster l'heure de fin
    if (info.allDay) {
      endDate = new Date(startDate);
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
      coRealizationPercentage: '',
      color: eventTypes.find(t => t.value === 'show').color,
      assignedUsers: []
    });
    
    setModalType('add');
    setShowModal(true);
  };
  
  // Fonction pour gérer le clic sur un événement
  const handleEventClick = useCallback((info) => {
    const event = info.event;
    setCurrentEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.backgroundColor,
      extendedProps: event.extendedProps
    });
    setModalType('view');
    setShowModal(true);
    setShowPdfSection(false); // Reset PDF section when opening event
  }, []);

  // Fonction pour gérer la sélection d'utilisateurs
  const handleUserSelection = (userId) => {
    setNewEvent(prev => {
      const assignedUsers = [...prev.assignedUsers];
      
      if (assignedUsers.includes(userId)) {
        // Retirer l'utilisateur s'il est déjà sélectionné
        return {
          ...prev,
          assignedUsers: assignedUsers.filter(id => id !== userId)
        };
      } else {
        // Ajouter l'utilisateur s'il n'est pas déjà sélectionné
        return {
          ...prev,
          assignedUsers: [...assignedUsers, userId]
        };
      }
    });
  };
  
  // Fonction pour afficher la section de sélection d'utilisateurs
  const renderUserSelectionSection = () => {
    if (modalType === 'view') return null;

    // Define event types that don't allow user assignment
    const disabledEventTypes = ['event', 'calage', 'rental'];
    
    // If current event type doesn't allow user assignment, show message
    if (disabledEventTypes.includes(newEvent.type)) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 italic flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
            L'assignation d'utilisateurs n'est pas disponible pour ce type d'événement
          </p>
        </div>
      );
    }
    
    // Filter out administrators from the available users
    const availableUsers = filteredUsers.filter(user => user.role !== 'administrateur');
    
    return (
      <div className="mt-4">
        <label className="block text-sm font-medium text-primary mb-2 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-primary" />
          Utilisateurs assignés
        </label>
        
        {availableUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
            {availableUsers.map(user => (
              <div 
                key={user.id}
                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                  newEvent.assignedUsers.includes(user.id) 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleUserSelection(user.id)}
              >
                <input
                  type="checkbox"
                  checked={newEvent.assignedUsers.includes(user.id)}
                  onChange={() => {}} // Handled by the div onClick
                  className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic p-2 border rounded-md">
            Aucun utilisateur disponible pour ce type d'événement
          </div>
        )}
      </div>
    );
  };

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

    const handlePdfUpload = async () => {
      if (!pdfFile) {
        setError('Veuillez sélectionner un fichier PDF');
        return;
      }
      
      const eventId = currentEvent?.id || newEvent.id;
      if (!eventId) return;
      
      try {
        setUploadingPdf(true);
        setError('');
        
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        
        await api.post(`/events/${eventId}/pdfs`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Refresh PDF list
        await fetchEventPdfs(eventId);
        setPdfFile(null);
        setSuccess('PDF ajouté avec succès');
        
        // Reset file input
        const fileInput = document.getElementById('pdf-upload');
        if (fileInput) fileInput.value = '';
      } catch (error) {
        setError(error.response?.data?.message || 'Erreur lors de l\'upload du PDF');
      } finally {
        setUploadingPdf(false);
      }
    };
    
    // Fonction pour gérer le changement de fichier PDF
const handleDeletePdf = async (pdfId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce PDF ?')) {
    return;
  }
  
  const eventId = currentEvent?.id || newEvent.id;
  if (!eventId) return;
  
  try {
    await api.delete(`/events/${eventId}/pdfs/${pdfId}`);
    
    // Refresh PDF list
    await fetchEventPdfs(eventId);
    setSuccess('PDF supprimé avec succès');
  } catch (error) {
    setError(error.response?.data?.message || 'Erreur lors de la suppression du PDF');
  }
};

// Function to handle PDF file change
const handlePdfFileChange = (e) => {
  const file = e.target.files[0];
  if (file && file.type !== 'application/pdf') {
    setError('Seuls les fichiers PDF sont autorisés');
    e.target.value = '';
    return;
  }
  
  if (file && file.size > 10 * 1024 * 1024) {
    setError('La taille du fichier ne doit pas dépasser 10 Mo');
    e.target.value = '';
    return;
  }
  
  setPdfFile(file);
  setError('');
};

// Function to toggle PDF section
const togglePdfSection = async () => {
  const newState = !showPdfSection;
  setShowPdfSection(newState);
  
  if (newState && currentEvent?.id) {
    await fetchEventPdfs(currentEvent.id);
  }
};
    
    // Préparer les données de l'événement
    const eventData = {
      title: newEvent.title,
      start: new Date(newEvent.start).toISOString(),
      end: new Date(newEvent.end).toISOString(),
      roomId: newEvent.roomId,
      type: newEvent.type,
      description: newEvent.description,
      creatorId: user.id,
      assignedUsers: newEvent.assignedUsers,
      // Include all form fields
      ticketingLocation: newEvent.ticketingLocation || '',
      hasDecor: newEvent.hasDecor || false,
      decorDetails: newEvent.decorDetails || '',
      // Include show-specific fields if applicable
      ...(newEvent.type === 'show' && {
        showStatus: newEvent.showStatus,
        coRealizationPercentage: newEvent.coRealizationPercentage
      })
    };

    console.log('Final updated event:', eventData);
    
    if (modalType === 'add') {
      await api.post('/events', eventData);
      setSuccess('Événement créé avec succès');
    } else if (modalType === 'edit') {
      await api.patch(`/events/${newEvent.id}`, eventData);
      setSuccess('Événement mis à jour avec succès');
    }

    setShowModal(false);
    fetchEvents();
    
    try {
      await api.post('/events', eventData);
      setSuccess('Événement collé avec succès');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'événement');
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
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
  
  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si le type d'événement change, mettre à jour la couleur
    if (name === 'type') {
      const eventType = eventTypes.find(type => type.value === value);
      setNewEvent(prev => ({
        ...prev,
        [name]: value,
        color: eventType ? eventType.color : prev.color,
        // Réinitialiser le statut du spectacle si le type n'est pas 'show'
        showStatus: value === 'show' ? prev.showStatus : undefined
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
        showStatus: newEvent.showStatus,
        description: newEvent.description,
        creatorId: user.id,
        coRealizationPercentage: newEvent.coRealizationPercentage,
        assignedUsers: newEvent.assignedUsers, // Ajout des utilisateurs assignés
        ticketingLocation: '',
        hasDecor: false,
        decorDetails: '',

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
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour'
            }}
            firstDay={1}
            slotMinTime="08:00:00"
            slotMaxTime="25:00:00"
            allDaySlot={false}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            nowIndicator={true}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            select={handleSelect}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
          />
        </div>
      </div>



      
      {/* Modal pour la création/édition/visualisation d'événements */}
  {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Modal header - Design amélioré */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-semibold flex items-center">
            {modalType === 'view' ? (
              <span className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: currentEvent?.color }}></div>
               
                Détails de l'événement
              </span>
            ) : modalType === 'add' ? (
              <span className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Ajouter un événement
              </span>
            ) : (
              <span className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2" />
                Modifier l'événement
              </span>
            )}
          </h3>
          <button 
            onClick={() => setShowModal(false)}
            className="text-white hover:text-gray-200 bg-primary/30 hover:bg-primary/50 rounded-full p-1 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Modal content - Design amélioré */}
        <div className="p-6">
          {modalType === 'view' ? (
            // View mode - Design amélioré
            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary border-b pb-2">{currentEvent?.title}</h2>

               {/* Information sur le créateur - Design amélioré et plus discret */}
               {currentEvent?.extendedProps?.creator && (
                <div className="mb-4">
                  <div className="inline-flex items-center text-xs text-gray-500 italic">
                    <UserIcon className="h-3 w-3 mr-1 text-primary/70" />
                    Créé par <span className="font-medium ml-1 text-primary/80">{currentEvent.extendedProps.creator.firstName} {currentEvent.extendedProps.creator.lastName}</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                  <ClockIcon className="h-6 w-6 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Début</p>
                    <p className="font-medium">{formatDate(currentEvent?.start)}</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                  <ClockIcon className="h-6 w-6 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fin</p>
                    <p className="font-medium">{formatDate(currentEvent?.end)}</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                  <MapPinIcon className="h-6 w-6 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Salle</p>
                    <p className="font-medium">{currentEvent?.extendedProps?.room?.name || 'Non spécifiée'}</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                  <div className="h-6 w-6 rounded-full mr-3 mt-0.5 flex-shrink-0" style={{ backgroundColor: currentEvent?.color }}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="font-medium">{getEventTypeLabel(currentEvent?.extendedProps?.type)}</p>
                    {currentEvent?.extendedProps?.type === 'show' && (
                      <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                           style={{ 
                             backgroundColor: `${showStatusOptions.find(s => s.value === currentEvent?.extendedProps?.showStatus)?.color}20`,
                             color: showStatusOptions.find(s => s.value === currentEvent?.extendedProps?.showStatus)?.color
                           }}>
                        {showStatusOptions.find(s => s.value === currentEvent?.extendedProps?.showStatus)?.label || 'Non défini'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {currentEvent?.extendedProps?.description && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <ClipboardIcon className="h-5 w-5 mr-2 text-primary" />
                    Description
                  </h4>
                  <p className="text-gray-600 whitespace-pre-line">{currentEvent?.extendedProps?.description}</p>
                </div>
              )}
              
              {/* Display assigned users - Design amélioré */}
              {currentEvent?.extendedProps?.users && currentEvent.extendedProps.users.length > 0 && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-primary" />
                    Utilisateurs assignés
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentEvent.extendedProps.users.map(user => (
                      <div key={user.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-sm flex items-center shadow-sm hover:shadow transition-shadow">
                        <UserIcon className="h-4 w-4 mr-1.5 text-primary" />
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                        <span className="ml-1.5 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <div>
                  <button
                    onClick={handleEdit}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md mr-2 flex items-center shadow-sm transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Modifier
                  </button>
                </div>
                
                <div className="flex">
                  <button
                    onClick={handleCopyEvent}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mr-2 flex items-center shadow-sm transition-colors"
                  >
                    <ClipboardIcon className="h-4 w-4 mr-1.5" />
                    Copier
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Supprimer
                  </button>
                </div>
              </div>

              
              
              {/* Show status buttons for shows - Design amélioré */}
              {currentEvent?.extendedProps?.type === 'show' && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <div className="h-4 w-4 rounded-full mr-2 bg-primary"></div>
                    Changer le statut du spectacle
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {showStatusOptions.map(status => (
                      <button
                        key={status.value}
                        onClick={() => handleConfirmShow(status.value)}
                        className={`px-4 py-2 rounded-md text-white text-sm flex items-center shadow-sm hover:shadow transition-shadow ${
                          currentEvent?.extendedProps?.showStatus === status.value 
                            ? 'ring-2 ring-offset-2 ring-white' 
                            : 'hover:opacity-90'
                        }`}
                        style={{ backgroundColor: status.color }}
                        disabled={currentEvent?.extendedProps?.showStatus === status.value}
                      >
                        {currentEvent?.extendedProps?.showStatus === status.value && (
                          <CheckIcon className="h-4 w-4 mr-1.5" />
                        )}
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Add/Edit mode - Design amélioré
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <div className="h-3 w-3 bg-primary rounded-full mr-2"></div>
                    Titre
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                    placeholder="Titre de l'événement"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <ClockIcon className="h-4 w-4 text-primary mr-2" />
                    Début
                  </label>
                  <input
                    type="datetime-local"
                    name="start"
                    value={newEvent.start}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <ClockIcon className="h-4 w-4 text-primary mr-2" />
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    name="end"
                    value={newEvent.end}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-primary mr-2" />
                    Salle
                  </label>
                  <select
                    name="roomId"
                    value={newEvent.roomId}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  >
                    <option value="">Sélectionner une salle</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: eventTypes.find(t => t.value === newEvent.type)?.color }}></div>
                    Type d'événement
                  </label>
                  <select
                    name="type"
                    value={newEvent.type}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                {newEvent.type === 'show' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: showStatusOptions.find(s => s.value === newEvent.showStatus)?.color }}></div>
                        Statut du spectacle
                      </label>
                      <select
                        name="showStatus"
                        value={newEvent.showStatus}
                        onChange={handleInputChange}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                      >
                        {showStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                     {/* Add ticketing location field when status is ticketsOpen */}
                     {newEvent.showStatus === 'ticketsOpen' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <div className="h-4 w-4 rounded-full mr-2 bg-green-500"></div>
                          Lieu de vente des billets
                        </label>
                        <input
                          type="text"
                          name="ticketingLocation"
                          value={newEvent.ticketingLocation}
                          onChange={handleInputChange}
                          className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                          placeholder="Ex: Site web, Fnac, etc."
                        />
                      </div>
                     )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2 bg-gold"></div>
                        Pourcentage de co-réalisation (%)
                      </label>
                      <input
                        type="number"
                        name="coRealizationPercentage"
                        value={newEvent.coRealizationPercentage}
                        onChange={handleInputChange}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                        min="0"
                        max="100"
                        placeholder="Ex: 50"
                      />
                    </div>
                  </>
                )}
                
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2 bg-primary"></div>
                        Décors
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="hasDecor"
                              value="true"
                              checked={newEvent.hasDecor === true}
                              onChange={(e) => setNewEvent(prev => ({
                                ...prev,
                                hasDecor: e.target.value === "true",
                                decorDetails: e.target.value === "false" ? "" : prev.decorDetails
                              }))}
                              className="form-radio text-primary"
                            />
                            <span className="ml-2">Oui</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="hasDecor"
                              value="false"
                              checked={newEvent.hasDecor === false}
                              onChange={(e) => setNewEvent(prev => ({
                                ...prev,
                                hasDecor: e.target.value === "true",
                                decorDetails: e.target.value === "false" ? "" : prev.decorDetails
                              }))}
                              className="form-radio text-primary"
                            />
                            <span className="ml-2">Non</span>
                          </label>
                        </div>
                        
                        {newEvent.hasDecor && (
                          <textarea
                            name="decorDetails"
                            value={newEvent.decorDetails}
                            onChange={handleInputChange}
                            placeholder="Description des décors..."
                            className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                            rows="3"
                          />
                        )}
                      </div>
                    </div>
                

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <ClipboardIcon className="h-4 w-4 text-primary mr-2" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    rows="3"
                    placeholder="Description de l'événement..."
                  ></textarea>
                </div>
                
                {/* User selection section - Design amélioré */}
                <div className="md:col-span-2">
                  {renderUserSelectionSection()}
                </div>
              </div>
              
              <div className="flex justify-end mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-3 transition-colors"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md shadow-sm transition-colors flex items-center"
                >
                  {modalType === 'add' ? (
                    <>
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Créer
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1.5" />
                      Mettre à jour
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )}
      
      {/* Dialog for selecting action when clicking on calendar */}
      {showSelectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Que souhaitez-vous faire ?</h3>
              <button 
                onClick={() => setShowSelectionDialog(false)}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSelectionDialog(false);
                  handleNewEvent(selectedTimeInfo);
                }}
                className="bg-primary text-white px-4 py-3 rounded-md flex items-center justify-center"
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
                  className="bg-blue-600 text-white px-4 py-3 rounded-md flex items-center justify-center"
                >
                  <ClipboardIcon className="h-5 w-5 mr-2" />
                  Coller l'événement "{clipboardEvent.title}"
                </button>
              )}
              
              <button
                onClick={() => setShowSelectionDialog(false)}
                className="bg-gray-300 text-gray-800 px-4 py-3 rounded-md"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;