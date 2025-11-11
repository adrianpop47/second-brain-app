import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import MonthView from './MonthView';
import EventModal from './EventModal';
import EventQuickView from './EventQuickView';
import apiService from '../services/apiService';
import { deleteEventWithConfirmation } from '../utils/deleteUtils';

const ContextCalendar = ({
  context,
  focusedEventId = null,
  onClearFocus = () => {},
  onViewLinkedTodo = () => {}
}) => {
  // State management
  const [currentView, setCurrentView] = useState('month'); // month/week/day/year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quickViewEventId, setQuickViewEventId] = useState(null);

  // Fetch events when date or context changes
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id, currentDate, currentView]);

  useEffect(() => {
    if (!focusedEventId) return;
    const match = events.find((event) => event.id === focusedEventId);
    if (match) {
      setQuickViewEventId(match.id);
    }
  }, [focusedEventId, events]);

  useEffect(() => {
    if (!quickViewEventId) return;
    const exists = events.some((event) => event.id === quickViewEventId);
    if (!exists) {
      setQuickViewEventId(null);
      onClearFocus?.();
    }
  }, [events, quickViewEventId, onClearFocus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      const { fromDate, toDate } = getDateRangeForView();
      
      const response = await apiService.getContextEvents(
        context.id,
        fromDate,
        toDate
      );
      
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setLoading(false);
    }
  };

  const getDateRangeForView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    switch (currentView) {
      case 'month': {
        // Get full month range
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
          fromDate: firstDay.toISOString().split('T')[0],
          toDate: lastDay.toISOString().split('T')[0]
        };
      }
      case 'week': {
        // Get week range (Sunday to Saturday)
        const day = currentDate.getDay();
        const firstDay = new Date(year, month, date - day);
        const lastDay = new Date(year, month, date - day + 6);
        return {
          fromDate: firstDay.toISOString().split('T')[0],
          toDate: lastDay.toISOString().split('T')[0]
        };
      }
      case 'day': {
        // Just today
        const today = new Date(year, month, date);
        return {
          fromDate: today.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
      }
      case 'year': {
        // Full year
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        return {
          fromDate: firstDay.toISOString().split('T')[0],
          toDate: lastDay.toISOString().split('T')[0]
        };
      }
      default:
        return {
          fromDate: new Date(year, month, 1).toISOString().split('T')[0],
          toDate: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const day = currentDate.getDate();

    switch (currentView) {
      case 'month':
        return `${month} ${year}`;
      case 'week': {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
        
        if (startMonth === endMonth) {
          return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${year}`;
        } else {
          return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
        }
      }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'year':
        return `${year}`;
      default:
        return `${month} ${year}`;
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
    setQuickViewEventId(null);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    setQuickViewEventId(null);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (selectedEvent) {
        // Update existing event
        await apiService.updateEvent(selectedEvent.id, eventData);
        setQuickViewEventId(selectedEvent.id);
      } else {
        // Create new event
        await apiService.createEvent({
          ...eventData,
          contextId: context.id
        });
      }
      
      // Refresh events
      await fetchEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      // Find the event to check for linked todos
      const eventToDelete = events.find(e => e.id === eventId);
      
      if (!eventToDelete) {
        alert('Event not found');
        return;
      }

      // Use the utility function for deletion with confirmation
      const deleted = await deleteEventWithConfirmation(eventId, eventToDelete, apiService);
      
      if (deleted) {
        // Refresh events
        await fetchEvents();
        setShowEventModal(false);
        setSelectedEvent(null);
        if (quickViewEventId === eventId) {
          setQuickViewEventId(null);
          onClearFocus?.();
        }
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUnlinkEvent = async (event) => {
    if (!event.linkedTodoId) return;
    if (!window.confirm('Remove the linked todo from this event?')) return;
    try {
      await apiService.unlinkTodoFromEvent(event.linkedTodoId, event.id);
      await fetchEvents();
      setQuickViewEventId(event.id);
    } catch (err) {
      console.error('Error unlinking todo from event:', err);
      alert('Failed to unlink todo from event');
    }
  };

  const handleEventClick = (event) => {
    setQuickViewEventId(event.id);
  };

  const closeQuickView = () => {
    setQuickViewEventId(null);
    onClearFocus?.();
  };

  const currentQuickViewEvent = quickViewEventId
    ? events.find((event) => event.id === quickViewEventId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{context.name} › Calendar</h2>
          <p className="text-sm text-slate-500">Schedule and manage your events</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-200/50">
          {['month', 'week', 'day', 'year'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                currentView === view
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Previous"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          
          <button
            onClick={navigateToday}
            className="px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-all text-sm border border-slate-200/50"
          >
            Today
          </button>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Next"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Current Period Title */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">{getHeaderTitle()}</h3>
          <span className="ml-auto text-sm text-slate-500">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Calendar View Content */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50">
        {currentView === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            focusedEventId={currentQuickViewEvent?.id || focusedEventId}
            onEventClick={handleEventClick}
            onDayClick={() => {}}
          />
        )}

        {currentView === 'week' && (
          <div className="text-center py-12">
            <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">Week View</p>
            <p className="text-slate-500 text-sm">Coming next: 7-day schedule view</p>
          </div>
        )}

        {currentView === 'day' && (
          <div className="text-center py-12">
            <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">Day View</p>
            <p className="text-slate-500 text-sm">Coming next: Hour-by-hour day schedule</p>
          </div>
        )}

        {currentView === 'year' && (
          <div className="text-center py-12">
            <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">Year View</p>
            <p className="text-slate-500 text-sm">Coming next: 12-month overview</p>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        contextId={context.id}
        event={selectedEvent}
        show={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
      />

      {currentQuickViewEvent && (
        <EventQuickView
          event={currentQuickViewEvent}
          onClose={closeQuickView}
          onEdit={(event) => handleEditEvent(event)}
          onDelete={(event) => handleDeleteEvent(event.id)}
          onUnlink={(event) => handleUnlinkEvent(event)}
          onViewLinkedTodo={(event) => {
            if (event.linkedTodoId) {
              onViewLinkedTodo?.(context.id, event.linkedTodoId);
              closeQuickView();
            }
          }}
        />
      )}
    </div>
  );
};

export default ContextCalendar;
