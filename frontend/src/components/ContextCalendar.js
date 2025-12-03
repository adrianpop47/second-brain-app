import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, List as ListIcon, CalendarDays, CalendarClock, CalendarRange, CalendarCheck } from 'lucide-react';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import YearView from './YearView';
import EventModal from './EventModal';
import EventQuickView from './EventQuickView';
import apiService from '../services/apiService';
import { deleteEventWithConfirmation } from '../utils/deleteUtils';
import { showAppAlert } from '../utils/alertService';
import { confirmAction } from '../utils/confirmService';

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', Icon: CalendarDays },
  { value: 'week', label: 'Week', Icon: CalendarClock },
  { value: 'month', label: 'Month', Icon: CalendarRange },
  { value: 'year', label: 'Year', Icon: CalendarCheck }
];

const DISPLAY_MODES = [
  { value: 'timeline', label: 'Timeline', Icon: Clock },
  { value: 'list', label: 'List', Icon: ListIcon }
];

const ContextCalendar = ({
  context,
  focusedEventId = null,
  onClearFocus = () => {},
  onViewLinkedTodo = () => {}
}) => {
  // State management
  const [currentView, setCurrentView] = useState('day'); // month/week/day/year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quickViewEventId, setQuickViewEventId] = useState(null);
  const [dayDisplayMode, setDayDisplayMode] = useState('timeline');
  const [weekDisplayMode, setWeekDisplayMode] = useState('timeline');
  const [dayModeMenuOpen, setDayModeMenuOpen] = useState(false);
  const [weekModeMenuOpen, setWeekModeMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const dayModeRef = useRef(null);
  const weekModeRef = useRef(null);
  const viewMenuRef = useRef(null);

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

  useEffect(() => {
    setDayModeMenuOpen(false);
    setWeekModeMenuOpen(false);
    setViewMenuOpen(false);
  }, [currentView]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dayModeRef.current && !dayModeRef.current.contains(event.target)) {
        setDayModeMenuOpen(false);
      }
      if (weekModeRef.current && !weekModeRef.current.contains(event.target)) {
        setWeekModeMenuOpen(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) {
        setViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          fromDate: formatLocalDate(firstDay),
          toDate: formatLocalDate(lastDay)
        };
      }
      case 'week': {
        // Get week range (Sunday to Saturday)
        const day = currentDate.getDay();
        const firstDay = new Date(year, month, date - day);
        const lastDay = new Date(year, month, date - day + 6);
        return {
          fromDate: formatLocalDate(firstDay),
          toDate: formatLocalDate(lastDay)
        };
      }
      case 'day': {
        // Just today
        const today = new Date(year, month, date);
        return {
          fromDate: formatLocalDate(today),
          toDate: formatLocalDate(today)
        };
      }
      case 'year': {
        // Full year
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        return {
          fromDate: formatLocalDate(firstDay),
          toDate: formatLocalDate(lastDay)
        };
      }
      default:
        return {
          fromDate: formatLocalDate(new Date(year, month, 1)),
          toDate: formatLocalDate(new Date(year, month + 1, 0))
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
  const handleSelectDay = (date) => {
    if (!date) return;
    setCurrentDate(new Date(date));
    setCurrentView('day');
  };

  const handleSelectMonth = (date) => {
    if (!date) return;
    setCurrentDate(new Date(date));
    setCurrentView('month');
  };

  const getHeaderTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleDateString('en-US', { month: 'long' });

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
      showAppAlert('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      // Find the event to check for linked todos
      const eventToDelete = events.find(e => e.id === eventId);
      
      if (!eventToDelete) {
        showAppAlert('Event not found');
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
      showAppAlert('Failed to delete event: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUnlinkEvent = async (event) => {
    if (!event.linkedTodoId) return;
    const confirmed = await confirmAction({
      title: 'Unlink todo?',
      message: 'This will unlink the todo from the event.',
      confirmLabel: 'Unlink',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.unlinkTodoFromEvent(event.linkedTodoId, event.id);
      await fetchEvents();
      setQuickViewEventId(event.id);
    } catch (err) {
      console.error('Error unlinking todo from event:', err);
      showAppAlert('Failed to unlink todo from event');
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
    <div className="space-y-4 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="my-4 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualize this field’s events, deadlines, and linked todos to stay ahead.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors bg-indigo-500 hover:bg-indigo-600"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>
        <div className="mt-4 h-px bg-slate-100" />
      </div>

      {/* Calendar View Content */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-slate-600" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">{getHeaderTitle()}</h3>
                <p className="text-xs text-slate-500">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                <div className="relative" ref={viewMenuRef}>
                  {(() => {
                    const activeView = VIEW_OPTIONS.find((option) => option.value === currentView);
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewMenuOpen((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700"
                          aria-label="Select calendar view"
                        >
                          {activeView?.Icon ? (
                            <activeView.Icon size={16} className="text-slate-600" aria-hidden="true" />
                          ) : (
                            <Calendar size={16} className="text-slate-600" aria-hidden="true" />
                          )}
                          <span className="hidden sm:inline capitalize">{activeView?.label || 'View'}</span>
                        </button>
                        {viewMenuOpen && (
                          <div className="absolute left-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                            {VIEW_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setCurrentView(option.value);
                                  setViewMenuOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                  currentView === option.value
                                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {option.Icon ? (
                                  <option.Icon size={16} className="text-slate-600" aria-hidden="true" />
                                ) : (
                                  <Calendar size={16} className="text-slate-600" aria-hidden="true" />
                                )}
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {(currentView === 'day' || currentView === 'week') && (
                  <div
                    className="relative"
                    ref={currentView === 'day' ? dayModeRef : weekModeRef}
                  >
                    {(() => {
                      const modeValue = currentView === 'day' ? dayDisplayMode : weekDisplayMode;
                      const setMode = currentView === 'day' ? setDayDisplayMode : setWeekDisplayMode;
                      const menuOpen = currentView === 'day' ? dayModeMenuOpen : weekModeMenuOpen;
                      const setMenuOpen = currentView === 'day' ? setDayModeMenuOpen : setWeekModeMenuOpen;
                      const ModeConfig = DISPLAY_MODES.find((mode) => mode.value === modeValue);
                      const ActiveIcon = ModeConfig?.Icon;
                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-700"
                            aria-label={ModeConfig?.label}
                          >
                            {ActiveIcon && <ActiveIcon size={16} className="text-slate-500" />}
                          </button>
                          {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                              {DISPLAY_MODES.map((mode) => {
                                const ModeIcon = mode.Icon;
                                return (
                                  <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => {
                                      setMode(mode.value);
                                      setMenuOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                      modeValue === mode.value
                                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <ModeIcon size={14} className="text-slate-500" />
                                    {mode.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <button
                  onClick={navigatePrevious}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50"
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={navigateToday}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  onClick={navigateNext}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50"
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-0 border-t border-slate-100">
          {currentView === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              focusedEventId={currentQuickViewEvent?.id || focusedEventId}
              onEventClick={handleEventClick}
              onDayClick={() => {}}
              onDaySelect={handleSelectDay}
            />
          )}

          {currentView === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              focusedEventId={currentQuickViewEvent?.id || focusedEventId}
              displayMode={weekDisplayMode}
              onDaySelect={handleSelectDay}
            />
          )}

          {currentView === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              focusedEventId={currentQuickViewEvent?.id || focusedEventId}
              displayMode={dayDisplayMode}
            />
          )}

          {currentView === 'year' && (
            <YearView
              currentDate={currentDate}
              events={events}
              focusedEventId={currentQuickViewEvent?.id || focusedEventId}
              onMonthSelect={handleSelectMonth}
              onDaySelect={handleSelectDay}
            />
          )}
        </div>
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
