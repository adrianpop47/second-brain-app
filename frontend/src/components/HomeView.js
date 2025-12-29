import { useState, useEffect, useRef } from 'react';
import { Wallet, TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, CalendarPlus, Clock, MoreVertical, Edit2, Trash2, Unlink } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';
import EditTodoModal from './EditTodoModal';
import AddTodoToCalendarModal from './AddTodoToCalendarModal';
import EventModal from './EventModal';
import PeriodSelector from './PeriodSelector';
import apiService from '../services/apiService';
import { isOverdue as isTodoOverdue } from '../utils/todoUtils';
import { deleteTodoWithConfirmation, deleteEventWithConfirmation } from '../utils/deleteUtils';
import { showAppAlert } from '../utils/alertService';
import { confirmAction } from '../utils/confirmService';
import { getRangeBounds, isWithinRange, formatDateParam } from '../utils/dateRangeUtils';

const SectionCard = ({
  title,
  leadingIcon: LeadingIcon,
  rightSlot = null,
  children,
  className = ''
}) => (
  <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {LeadingIcon && <LeadingIcon size={20} className="text-slate-700" />}
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {rightSlot}
    </div>
    {children}
  </div>
);

const getNotePreview = (text, limit = 120) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}…`;
};

const getNoteDateLabel = (value) => {
  if (!value) return '';
  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getNoteSortValue = (note = {}) => {
  const source = note.updatedAt || note.modifiedAt || note.createdAt;
  if (!source) return 0;
  const normalized = source.includes('T') ? source : `${source}T00:00:00`;
  const date = new Date(normalized);
  return date.getTime() || 0;
};

const HomeView = ({ 
  summaryStats, 
  contextData,
  loading,
  dateRange = 'month',
  onChangeDateRange = () => {},
  onRequestViewCalendarEvent = () => {},
  onRequestViewLinkedTodo = () => {},
  onOpenNote = () => {}
}) => {
  const [allTodos, setAllTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [contexts, setContexts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showAddToCalendarModal, setShowAddToCalendarModal] = useState(false);
  const [calendarTodo, setCalendarTodo] = useState(null);
  const [activeTodoMenu, setActiveTodoMenu] = useState(null);
  const [activeEventMenu, setActiveEventMenu] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [openNoteMenuId, setOpenNoteMenuId] = useState(null);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const noteMenuContainerRef = useRef(null);
  const todoMenuRef = useRef(null);
  const eventMenuRef = useRef(null);

  useEffect(() => {
    fetchAllTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    fetchUpcomingEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    fetchRecentNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    if (!openNoteMenuId) {
      noteMenuContainerRef.current = null;
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (noteMenuContainerRef.current?.contains(event.target)) return;
      setOpenNoteMenuId(null);
      noteMenuContainerRef.current = null;
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openNoteMenuId]);

  useEffect(() => {
    if (!activeTodoMenu && !activeEventMenu) return undefined;
    const handleClickOutside = (e) => {
      if (activeTodoMenu && todoMenuRef.current && !todoMenuRef.current.contains(e.target)) {
        setActiveTodoMenu(null);
      }
      if (activeEventMenu && eventMenuRef.current && !eventMenuRef.current.contains(e.target)) {
        setActiveEventMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTodoMenu, activeEventMenu]);

  const handleDeleteRecentNote = async (note) => {
    const confirmed = await confirmAction({
      title: `Delete note${note.title ? ` “${note.title}”` : ''}?`,
      message: 'This note will be permanently removed.',
      confirmLabel: 'Delete note',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.deleteNote(note.id);
      setRecentNotes((prev) => prev.filter((item) => item.id !== note.id));
      showAppAlert('Note deleted', { type: 'info' });
    } catch (err) {
      console.error('Failed to delete note:', err);
      showAppAlert('Failed to delete note');
    } finally {
      setOpenNoteMenuId(null);
      /* no-op */
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      setEventsLoading(true);
      const { start, end } = getRangeBounds(dateRange);
      const now = new Date();
      const effectiveStart = start ? new Date(Math.max(start.getTime(), now.getTime())) : now;
      const response = await apiService.getEvents(
        formatDateParam(effectiveStart),
        formatDateParam(end)
      );
      const upcoming = (response.data || [])
        .filter((event) => {
          const eventDate = new Date(event.startDate);
          if (Number.isNaN(eventDate.getTime())) return false;
          if (eventDate < now) return false;
          if (start && eventDate < start) return false;
          if (end && eventDate > end) return false;
          return true;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchRecentNotes = async () => {
    try {
      setNotesLoading(true);
      const { start, end } = getRangeBounds(dateRange);
      const contextsRes = await apiService.getContexts();
      const contextsList = contextsRes.data || [];
      const notesByContext = await Promise.all(
        contextsList.map(async (context) => {
          try {
            const response = await apiService.getContextNotes(context.id);
            const contextNotes = response.data || [];
            return contextNotes.map((note) => ({
              ...note,
              contextId: context.id,
              contextName: context.name,
              contextEmoji: context.emoji
            }));
          } catch (err) {
            console.error(`Error fetching notes for context ${context.id}:`, err);
            return [];
          }
        })
      );
      const combined = notesByContext.flat().sort((a, b) => getNoteSortValue(b) - getNoteSortValue(a));
      const filtered = combined.filter((note) => {
        if (!start && !end) return true;
        const referenceDate = note.updatedAt || note.modifiedAt || note.createdAt;
        if (!referenceDate) return false;
        return isWithinRange(referenceDate, start, end);
      });
      setRecentNotes(filtered.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent notes:', err);
      setRecentNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const fetchAllTodos = async () => {
    try {
      setTodosLoading(true);
      const { start, end } = getRangeBounds(dateRange);
      // Get contexts first
      const contextsRes = await apiService.getContexts();
      setContexts(contextsRes.data);
      
      // Fetch todos from all contexts
      const todosPromises = contextsRes.data.map(context => 
        apiService.getContextTodos(context.id)
      );
      const todosResults = await Promise.all(todosPromises);
      
      // Combine all todos and filter for active (not done)
      const allTodosData = todosResults.flatMap((result, index) => 
        result.data.map(todo => ({
          ...todo,
          contextName: contextsRes.data[index].name,
          contextEmoji: contextsRes.data[index].emoji
        }))
      );
      
      // Filter for active todos and sort by due date
      const activeTodos = allTodosData
        .filter(todo => todo.status !== 'done')
        .filter((todo) => {
          if (!start && !end) return true;
          if (!todo.dueDate) return false;
          const dueValue = `${todo.dueDate}T${todo.dueTime || '00:00:00'}`;
          return isWithinRange(dueValue, start, end);
        })
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        })
        .slice(0, 8); // Show top 8
      
      setAllTodos(activeTodos);
      setTodosLoading(false);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setTodosLoading(false);
    }
  };

  const handleMarkTodoAsDone = async (todoId) => {
    try {
      await apiService.updateTodo(todoId, { status: 'done' });
      // Refresh the todos list
      fetchAllTodos();
    } catch (err) {
      console.error('Error updating todo:', err);
      showAppAlert('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todo) => {
    try {
      const deleted = await deleteTodoWithConfirmation(todo.id, todo, apiService);
      if (deleted) {
        fetchAllTodos();
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      showAppAlert('Failed to delete todo');
    }
  };

  const handleEditTodo = async (todoId, updates) => {
    try {
      await apiService.updateTodo(todoId, updates);
      fetchAllTodos();
      setShowEditModal(false);
      setEditingTodo(null);
    } catch (err) {
      console.error('Error updating todo:', err);
      showAppAlert('Failed to update todo');
    }
  };

  const handleAddTodoToCalendar = async (todoId, eventData) => {
    await apiService.addTodoToCalendar(todoId, eventData);
    await fetchAllTodos();
    await fetchUpcomingEvents();
    setShowAddToCalendarModal(false);
    setCalendarTodo(null);
  };

  const handleViewCalendarEvent = (todo) => {
    const linkedEventId = todo.calendarEventId ?? (todo.calendarEventIds && todo.calendarEventIds[0]);
    if (!linkedEventId) {
      setCalendarTodo(todo);
      setShowAddToCalendarModal(true);
      return;
    }
    const contextId = todo.contextId ?? todo.context_id;
    if (contextId) {
      onRequestViewCalendarEvent?.(contextId, linkedEventId);
    }
  };

  const handleRemoveTodoFromCalendar = async (todo) => {
    const linkedEventId = todo.calendarEventId ?? (todo.calendarEventIds && todo.calendarEventIds[0]);
    if (!linkedEventId) return;
    const confirmed = await confirmAction({
      title: 'Remove from calendar?',
      message: 'This will unlink the calendar event from the todo.',
      confirmLabel: 'Remove',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.unlinkTodoFromEvent(todo.id, linkedEventId);
      await fetchAllTodos();
      await fetchUpcomingEvents();
    } catch (err) {
      console.error('Error removing todo from calendar:', err);
      showAppAlert('Failed to remove from calendar');
    }
  };

  const getLinkedTodoIdFromEvent = (event) =>
    event?.linkedTodoId ?? (event?.linkedTodoIds && event.linkedTodoIds[0]);

  const getEventContextId = (event) =>
    event?.contextId ?? event?.context_id ?? null;

  const handleViewEvent = (eventItem) => {
    const contextId = getEventContextId(eventItem);
    if (contextId) {
      onRequestViewCalendarEvent?.(contextId, eventItem.id);
    }
    setActiveEventMenu(null);
  };

  const handleEditEvent = (eventItem) => {
    setEditingEvent(eventItem);
    setShowEventModal(true);
    setActiveEventMenu(null);
  };

  const handleSaveEvent = async (eventData) => {
    if (!editingEvent) return;
    try {
      await apiService.updateEvent(editingEvent.id, {
        ...eventData,
        contextId: getEventContextId(editingEvent),
      });
      await fetchUpcomingEvents();
      setShowEventModal(false);
      setEditingEvent(null);
      setActiveEventMenu(null);
    } catch (err) {
      console.error('Error saving event:', err);
      showAppAlert('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventItem) => {
    try {
      const deleted = await deleteEventWithConfirmation(eventItem.id, eventItem, apiService);
      if (deleted) {
        await fetchUpcomingEvents();
        await fetchAllTodos();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      showAppAlert('Failed to delete event');
    } finally {
      setActiveEventMenu(null);
    }
  };

  const handleUnlinkEventFromTodo = async (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    const confirmed = await confirmAction({
      title: 'Unlink todo?',
      message: 'This will unlink the todo from this event.',
      confirmLabel: 'Unlink',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.unlinkTodoFromEvent(linkedTodoId, eventItem.id);
      await fetchUpcomingEvents();
      await fetchAllTodos();
    } catch (err) {
      console.error('Error unlinking todo:', err);
      showAppAlert('Failed to unlink todo from event');
    } finally {
      setActiveEventMenu(null);
    }
  };

  const handleViewLinkedTodo = (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    const contextId = getEventContextId(eventItem);
    if (contextId) {
      onRequestViewLinkedTodo?.(contextId, linkedTodoId);
    }
    setActiveEventMenu(null);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const getTodoStats = () => {
    const total = allTodos.length;
    return total;
  };

  const activeTodoCount = getTodoStats();

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">Home</h1>
            <p className="text-sm text-slate-500 mt-1">
              See activity across all your fields in one place without switching views.
            </p>
          </div>
          <PeriodSelector value={dateRange} onChange={onChangeDateRange} compact />
        </div>
        <div className="mt-4 h-px bg-slate-100" />
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-6 border border-slate-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Getting Started</h3>
          <button
            type="button"
            onClick={() => setShowGettingStarted((prev) => !prev)}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            aria-expanded={showGettingStarted}
          >
            {showGettingStarted ? 'Hide' : 'Show'}
          </button>
        </div>
        {showGettingStarted && (
          <div className="space-y-3 mt-4">
            <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Create Fields</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Organize your life into different areas (Work, Health, Personal, etc.)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Track Your Finances</p>
                <p className="text-xs text-slate-600 mt-0.5">Add income and expenses to each field with custom tags</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Manage Your Tasks</p>
                <p className="text-xs text-slate-600 mt-0.5">Use the Kanban board to organize todos with priorities and due dates</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={16} className="text-blue-600" />
                <p className="text-sm font-semibold text-slate-800">Pro Tip</p>
              </div>
              <p className="text-xs text-slate-600">
                Click on a field in the sidebar to see detailed stats, finances, and todos. Notes and Calendar are coming soon!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards - All white with colored icon backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          icon={TrendingUp}
          label="Total Income"
          value={`$${summaryStats.total_income?.toFixed(2) || '0.00'}`}
          variant="income"
        />
        
        <StatCard 
          icon={TrendingDown}
          label="Total Expenses"
          value={`$${summaryStats.total_expenses?.toFixed(2) || '0.00'}`}
          variant="expense"
        />
        
        <StatCard 
          icon={Wallet}
          label="Total Balance"
          value={`$${summaryStats.balance?.toFixed(2) || '0.00'}`}
          variant="balance"
        />
      </div>

      {/* Main Content Grid - Expenses Chart + Active Todos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Field */}
        <ExpenseChart data={contextData} title="Expenses by Field" leadingIcon={Wallet} />
        
        {/* Active Todos List */}
        <SectionCard
          title="Active Todos"
          leadingIcon={CheckSquare}
          rightSlot={
            <span className="text-sm font-normal text-slate-500">
              {activeTodoCount} {activeTodoCount === 1 ? 'todo' : 'todos'}
            </span>
          }
        >
          {todosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : allTodos.length > 0 ? (
            <div className="space-y-2 pb-2">
              {allTodos.map((todo) => {
                const isOverdue = isTodoOverdue(todo.dueDate, todo.dueTime, todo.status);
                const formattedDueDate = todo.dueDate
                  ? new Date(`${todo.dueDate}T00:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : '';
                const formattedDueTime = todo.dueTime
                  ? new Date(`1970-01-01T${todo.dueTime}`).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })
                  : '';
                const priorityColors = {
                  low: 'bg-slate-100 text-slate-700',
                  medium: 'bg-amber-100 text-amber-700',
                  high: 'bg-red-100 text-red-700'
                };

                return (
                  <div
                    key={`${todo.contextId}-${todo.id}`}
                    className="flex items-start justify-between p-2.5 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-colors group relative"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => handleMarkTodoAsDone(todo.id)}
                        className={`p-1.5 rounded-lg flex-shrink-0 transition-all ${
                          todo.status === 'in_progress'
                            ? 'bg-amber-100/80 hover:bg-emerald-100'
                            : 'bg-slate-100/80 hover:bg-emerald-100'
                        }`}
                        title="Mark as done"
                      >
                        <CheckSquare
                          size={14}
                          className={`transition-colors ${
                            todo.status === 'in_progress' ? 'text-amber-600' : 'text-slate-600'
                          } group-hover:text-emerald-600`}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 text-sm truncate">{todo.title}</p>
                        <div className="flex flex-col gap-1 mt-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-slate-600">{todo.contextName}</span>
                          {(todo.dueDate || todo.dueTime) && (
                            <div
                              className={`flex items-center gap-3 ${
                                isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Calendar
                                  size={12}
                                  className={isOverdue ? 'text-red-500' : 'text-slate-500'}
                                />
                                <span>{formattedDueDate || 'No due date'}</span>
                              </span>
                              {formattedDueTime && (
                                <span className="flex items-center gap-1">
                                  <Clock
                                    size={12}
                                    className={isOverdue ? 'text-red-500' : 'text-slate-500'}
                                  />
                                  <span>{formattedDueTime}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priorityColors[todo.priority]}`}>
                        {todo.priority}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200">
                          Overdue
                        </span>
                      )}
                      
                      {/* Todo Menu */}
                      <div className="relative">
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            const key = `${todo.contextId || todo.context_id}-${todo.id}`;
                            if (activeTodoMenu?.id === key) {
                              setActiveTodoMenu(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const position = spaceBelow < 160 ? 'top' : 'bottom';
                            setActiveTodoMenu({ id: key, position });
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <MoreVertical size={14} className="text-slate-500" />
                        </button>
                        {(() => {
                          const key = `${todo.contextId || todo.context_id}-${todo.id}`;
                          if (activeTodoMenu?.id !== key) return null;
                          const linkedEventId =
                            todo.calendarEventId ?? (todo.calendarEventIds && todo.calendarEventIds[0]);
                          const hasLinkedEvent = Boolean(linkedEventId);
                          return (
                            <div
                              ref={todoMenuRef}
                              className={`absolute right-0 ${
                                activeTodoMenu.position === 'top'
                                  ? 'bottom-full -mb-1'
                                  : 'top-full mt-1'
                              } bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[150px] z-50`}
                            >
                              <button
                                onClick={() => {
                                  setEditingTodo(todo);
                                  setShowEditModal(true);
                                  setActiveTodoMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                              >
                                <Edit2 size={12} />
                                Edit
                              </button>
                              {hasLinkedEvent ? (
                                <>
                                  <button
                                    onClick={() => {
                                      handleViewCalendarEvent(todo);
                                      setActiveTodoMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                                  >
                                    <Calendar size={12} />
                                    View Calendar Event
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleRemoveTodoFromCalendar(todo);
                                      setActiveTodoMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                                  >
                                    <Unlink size={12} />
                                    Remove from Calendar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCalendarTodo(todo);
                                    setShowAddToCalendarModal(true);
                                    setActiveTodoMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                                >
                                  <CalendarPlus size={12} />
                                  Add to Calendar
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleDeleteTodo(todo);
                                  setActiveTodoMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-1">
              <CheckSquare size={48} className="text-slate-300" />
              <p className="text-slate-500 text-sm">No active todos</p>
              <p className="text-slate-400 text-xs">Create todos in your fields</p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard
        title="Recent Notes"
        leadingIcon={Lightbulb}
      >
        {notesLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="space-y-2">
            {recentNotes.map((note) => {
              const dateLabel = getNoteDateLabel(
                note.updatedAt || note.modifiedAt || note.createdAt
              );
              const preview = getNotePreview(note.body || note.description);
              const tags = Array.isArray(note.tags) ? note.tags : [];
              return (
                <div
                  key={note.id}
                  ref={openNoteMenuId === note.id ? noteMenuContainerRef : undefined}
                  className="group relative p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer"
                  onClick={() => {
                    setOpenNoteMenuId(null);
                    onOpenNote(note.contextId);
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                    <span>{dateLabel}</span>
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenNoteMenuId((prev) => (prev === note.id ? null : note.id));
                      }}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1 truncate">
                    {note.title || 'Untitled note'}
                  </p>
                  {preview && (
                    <p className="text-xs text-slate-500 truncate">{preview}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium text-slate-600 bg-white/70 rounded-full px-2 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {openNoteMenuId === note.id && (
                    <div
                      className="absolute top-8 right-2 bg-white rounded-lg border border-slate-200 shadow-lg py-1 min-w-[130px] z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecentNote(note);
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-slate-500">
            No notes yet. Start capturing ideas in your fields.
          </div>
        )}
      </SectionCard>

      {/* Upcoming Events */}
      <SectionCard
        title="Upcoming Events"
        leadingIcon={Calendar}
      >
        {eventsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((eventItem) => {
              const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
              const isOpen = activeEventMenu?.id === eventItem.id;
              return (
                <div
                  key={eventItem.id}
                  className="relative p-3 bg-slate-50/70 rounded-lg border border-slate-100 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{eventItem.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(eventItem.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {eventItem.allDay
                          ? 'All day'
                          : new Date(eventItem.startDate).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                      </span>
                      {linkedTodoId && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          Linked todo
                        </span>
                      )}
                    </div>
                  </div>
                    <div className="relative">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeEventMenu?.id === eventItem.id) {
                            setActiveEventMenu(null);
                            return;
                          }
                          const rect = e.currentTarget.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const position = spaceBelow < 200 ? 'top' : 'bottom';
                          setActiveEventMenu({ id: eventItem.id, position });
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                    {isOpen && (
                      <div
                        ref={eventMenuRef}
                        className={`absolute right-0 ${
                          activeEventMenu.position === 'top'
                            ? 'bottom-full -mb-1'
                            : 'top-full mt-1'
                        } bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[170px] z-50`}
                      >
                        <button
                          onClick={() => handleViewEvent(eventItem)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                        >
                          <Calendar size={12} />
                          View Event
                        </button>
                        <button
                          onClick={() => handleEditEvent(eventItem)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                        >
                          <Edit2 size={12} />
                          Edit Event
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(eventItem)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
                        >
                          <Trash2 size={12} />
                          Delete Event
                        </button>
                        {linkedTodoId && (
                          <>
                            <button
                              onClick={() => handleViewLinkedTodo(eventItem)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                            >
                              <CheckSquare size={12} />
                              View Linked Todo
                            </button>
                            <button
                              onClick={() => handleUnlinkEventFromTodo(eventItem)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                            >
                              <Unlink size={12} />
                              Unlink Todo
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-1">
            <Calendar size={40} className="text-slate-300" />
            <p className="text-slate-500 text-sm">No upcoming events scheduled.</p>
            <p className="text-slate-400 text-xs">Add events to keep your schedule aligned.</p>
          </div>
        )}
      </SectionCard>
      </div>

      <AddTodoToCalendarModal
        showModal={showAddToCalendarModal}
        setShowModal={setShowAddToCalendarModal}
        todo={calendarTodo}
        onAdd={(eventData) => {
          if (calendarTodo) {
            handleAddTodoToCalendar(calendarTodo.id, eventData);
          }
        }}
      />

      <EditTodoModal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        todo={editingTodo}
        onUpdate={handleEditTodo}
      />

      <EventModal
        contextId={getEventContextId(editingEvent)}
        event={editingEvent}
        show={showEventModal}
        onClose={handleCloseEventModal}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

export default HomeView;
