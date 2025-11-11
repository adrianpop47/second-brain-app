import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, CalendarPlus, Clock, MoreVertical, Edit2, Trash2, Unlink } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';
import EditTodoModal from './EditTodoModal';
import AddTodoToCalendarModal from './AddTodoToCalendarModal';
import EventModal from './EventModal';
import apiService from '../services/apiService';
import { isOverdue as isTodoOverdue } from '../utils/todoUtils';
import { deleteTodoWithConfirmation, deleteEventWithConfirmation } from '../utils/deleteUtils';

const SectionCard = ({
  title,
  leadingIcon: LeadingIcon,
  rightSlot = null,
  children,
  className = ''
}) => (
  <div className={`bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50 ${className}`}>
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

const HomeView = ({ 
  summaryStats, 
  contextData,
  loading,
  onRequestViewCalendarEvent = () => {},
  onRequestViewLinkedTodo = () => {}
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

  useEffect(() => {
    fetchAllTodos();
  }, []);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setEventsLoading(true);
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 7);
      const format = (date) => date.toISOString().split('T')[0];
      const response = await apiService.getEvents(format(start), format(end));
      const upcoming = response.data
        .filter((event) => new Date(event.startDate) >= start)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchAllTodos = async () => {
    try {
      setTodosLoading(true);
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

  const openTodoMenu = (event, todo) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    const menuWidth = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight ? rect.bottom : rect.top - menuHeight;
    const left = Math.max(
      8,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
    );
    setActiveTodoMenu({
      todo,
      style: { top, left }
    });
  };

  const closeTodoMenu = () => setActiveTodoMenu(null);

  const openEventMenu = (e, calendarEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const menuWidth = 190;
    const menuHeight = 200;
    let top = rect.bottom + 4;
    let left = rect.left;

    const viewportBottom = window.innerHeight;
    if (top + menuHeight > viewportBottom - 8) {
      top = rect.top - menuHeight - 4;
    }
    if (top < 8) top = 8;

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) left = 8;

    setActiveEventMenu({
      event: calendarEvent,
      style: {
        top: top + scrollY,
        left: left + scrollX,
      },
    });
  };

  const closeEventMenu = () => setActiveEventMenu(null);

  const handleMarkTodoAsDone = async (todoId) => {
    try {
      await apiService.updateTodo(todoId, { status: 'done' });
      // Refresh the todos list
      fetchAllTodos();
    } catch (err) {
      console.error('Error updating todo:', err);
      alert('Failed to update todo');
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
      alert('Failed to delete todo');
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
      alert('Failed to update todo');
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
    if (!window.confirm('Remove this todo from the calendar?')) return;
    try {
      await apiService.unlinkTodoFromEvent(todo.id, linkedEventId);
      await fetchAllTodos();
      await fetchUpcomingEvents();
    } catch (err) {
      console.error('Error removing todo from calendar:', err);
      alert('Failed to remove from calendar');
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
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
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
      alert('Failed to delete event');
    } finally {
      setActiveEventMenu(null);
    }
  };

  const handleUnlinkEventFromTodo = async (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    if (!window.confirm('Unlink the todo from this event?')) return;
    try {
      await apiService.unlinkTodoFromEvent(linkedTodoId, eventItem.id);
      await fetchUpcomingEvents();
      await fetchAllTodos();
    } catch (err) {
      console.error('Error unlinking todo:', err);
      alert('Failed to unlink todo from event');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Home</h2>
          <p className="text-sm text-slate-500">All contexts overview</p>
        </div>
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
        {/* Expenses by Context */}
        <ExpenseChart data={contextData} title="Expenses by Context" leadingIcon={Wallet} />
        
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
            <div className="space-y-2 max-h-[250px] overflow-y-auto pb-20">
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
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => openTodoMenu(e, todo)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <MoreVertical size={14} className="text-slate-500" />
                        </button>
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
              <p className="text-slate-400 text-xs">Create todos in your contexts</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Getting Started - Now below the main content */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-6 border border-slate-200/50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Getting Started</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Create Contexts</p>
              <p className="text-xs text-slate-600 mt-0.5">Organize your life into different areas (Work, Health, Personal, etc.)</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Track Your Finances</p>
              <p className="text-xs text-slate-600 mt-0.5">Add income and expenses to each context with custom tags</p>
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
            <p className="text-xs text-slate-600">Click on a context in the sidebar to see detailed stats, finances, and todos. Ideas and Calendar are coming soon!</p>
          </div>
        </div>
      </div>

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
              return (
                <div
                  key={eventItem.id}
                  className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 flex items-start justify-between gap-3"
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
                  <button
                    onClick={(e) => openEventMenu(e, eventItem)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-1">
            <Calendar size={40} className="text-slate-300" />
            <p className="text-slate-500 text-sm">No events scheduled this week.</p>
            <p className="text-slate-400 text-xs">Add events to keep your schedule aligned.</p>
          </div>
        )}
      </SectionCard>

      {activeTodoMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeTodoMenu} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[150px]"
            style={activeTodoMenu.style}
          >
            <button
              onClick={() => {
                setEditingTodo(activeTodoMenu.todo);
                setShowEditModal(true);
                closeTodoMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
            >
              <Edit2 size={12} />
              Edit
            </button>
            {(() => {
              const linkedEventId =
                activeTodoMenu.todo.calendarEventId ??
                (activeTodoMenu.todo.calendarEventIds && activeTodoMenu.todo.calendarEventIds[0]);
              const hasLinkedEvent = Boolean(linkedEventId);
              if (hasLinkedEvent) {
                return (
                  <>
                    <button
                      onClick={() => {
                        handleViewCalendarEvent(activeTodoMenu.todo);
                        closeTodoMenu();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                    >
                      <Calendar size={12} />
                      View Calendar Event
                    </button>
                    <button
                      onClick={() => {
                        handleRemoveTodoFromCalendar(activeTodoMenu.todo);
                        closeTodoMenu();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                    >
                      <Unlink size={12} />
                      Remove from Calendar
                    </button>
                  </>
                );
              }
              return (
                <button
                  onClick={() => {
                    setCalendarTodo(activeTodoMenu.todo);
                    setShowAddToCalendarModal(true);
                    closeTodoMenu();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                >
                  <CalendarPlus size={12} />
                  Add to Calendar
                </button>
              );
            })()}
            <button
              onClick={() => {
                handleDeleteTodo(activeTodoMenu.todo);
                closeTodoMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </>
      )}

      {activeEventMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeEventMenu} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[180px]"
            style={activeEventMenu.style}
          >
            <button
              onClick={() => handleViewEvent(activeEventMenu.event)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
            >
              <Calendar size={12} />
              View Event
            </button>
            <button
              onClick={() => handleEditEvent(activeEventMenu.event)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
            >
              <Edit2 size={12} />
              Edit Event
            </button>
            <button
              onClick={() => handleDeleteEvent(activeEventMenu.event)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
            >
              <Trash2 size={12} />
              Delete Event
            </button>
            {getLinkedTodoIdFromEvent(activeEventMenu.event) && (
              <>
                <button
                  onClick={() => handleViewLinkedTodo(activeEventMenu.event)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                >
                  <CheckSquare size={12} />
                  View Linked Todo
                </button>
                <button
                  onClick={() => handleUnlinkEventFromTodo(activeEventMenu.event)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                >
                  <Unlink size={12} />
                  Unlink Todo
                </button>
              </>
            )}
          </div>
        </>
      )}
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
