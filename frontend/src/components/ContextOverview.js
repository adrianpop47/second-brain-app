import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, CalendarPlus, Clock, Wallet, MoreVertical, Edit2, Trash2, Unlink } from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';
import AddTodoModal from './AddTodoModal';
import EditTodoModal from './EditTodoModal';
import AddTodoToCalendarModal from './AddTodoToCalendarModal';
import EventModal from './EventModal';
import apiService from '../services/apiService';
import { isOverdue as isTodoOverdue } from '../utils/todoUtils';
import { deleteTodoWithConfirmation, deleteEventWithConfirmation } from '../utils/deleteUtils';
import { showAppAlert } from '../utils/alertService';
import { confirmAction } from '../utils/confirmService';

const OverviewCard = ({ title, icon: Icon, rightSlot = null, children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 border border-slate-200 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-slate-700" />}
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {rightSlot}
    </div>
    {children}
  </div>
);

const stripHtml = (text = '') => text.replace(/<[^>]+>/g, ' ');
const getNotePreview = (text, limit = 130) => {
  const normalized = stripHtml(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
};

const getNoteTimestamp = (createdAt) => {
  if (!createdAt) return { date: '', time: '' };
  const hasTime = createdAt.includes('T');
  let date;
  if (hasTime) {
    date = new Date(createdAt);
  } else {
    const [year, month, day] = createdAt.split('-').map(Number);
    date = new Date(year, month - 1, day);
  }
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = hasTime
    ? date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })
    : '';
  return { date: formattedDate, time: formattedTime };
};

const FIELD_TYPE_BADGE_CLASS =
  'inline-flex items-center border border-slate-300 bg-white text-slate-700 text-[11px] font-semibold capitalize tracking-[0.02em] px-2.5 py-0.5 rounded-full shadow-sm';

const ContextOverview = ({
  context,
  stats,
  recentTransactions,
  loading,
  onDataUpdate,
  onRequestViewCalendarEvent = () => {},
  onRequestViewLinkedTodo = () => {},
  onOpenNotes = () => {}
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [recentTodos, setRecentTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [showEditTodoModal, setShowEditTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showAddToCalendarModal, setShowAddToCalendarModal] = useState(false);
  const [calendarTodo, setCalendarTodo] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [openEventMenuId, setOpenEventMenuId] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    tags: [],
    description: '',
    date: new Date().toISOString().split('T')[0],
    contextId: context.id
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [openNoteMenuId, setOpenNoteMenuId] = useState(null);
  const noteMenuContainerRef = useRef(null);

  const fetchRecentTodos = async () => {
    try {
      setTodosLoading(true);
      const response = await apiService.getContextTodos(context.id);
      // Get incomplete todos (not done), sorted by due date
      const activeTodos = response.data
        .filter(todo => todo.status !== 'done')
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        })
        .slice(0, 5); // Show only first 5
      setRecentTodos(activeTodos);
      setTodosLoading(false);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setTodosLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      setEventsLoading(true);
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 14);
      const format = (date) => date.toISOString().split('T')[0];
      const response = await apiService.getContextEvents(
        context.id,
        format(today),
        format(end)
      );
      const upcoming = response.data
        .filter((event) => new Date(event.startDate) >= today)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTodos();
    fetchUpcomingEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setNotesLoading(true);
        const response = await apiService.getContextNotes(context.id);
        const notes = response.data || [];
        setRecentNotes(notes.slice(0, 3));
      } catch (err) {
        setRecentNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [context.id]);

  useEffect(() => {
    if (!openNoteMenuId) {
      noteMenuContainerRef.current = null;
      return undefined;
    }
    const handler = (event) => {
      if (noteMenuContainerRef.current?.contains(event.target)) return;
      setOpenNoteMenuId(null);
      noteMenuContainerRef.current = null;
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openNoteMenuId]);

  const handleDeleteNotePreview = async (note) => {
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
    }
  };

  const handleMarkTodoAsDone = async (todoId) => {
    try {
      await apiService.updateTodo(todoId, { status: 'done' });
      // Refresh todos and overview
      fetchRecentTodos();
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      console.error('Error updating todo:', err);
      showAppAlert('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todo) => {
    try {
      const deleted = await deleteTodoWithConfirmation(todo.id, todo, apiService);
      if (deleted) {
        fetchRecentTodos();
        if (onDataUpdate) {
          onDataUpdate();
        }
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      showAppAlert('Failed to delete todo');
    }
  };

  const handleEditTodo = async (todoId, updates) => {
    try {
      await apiService.updateTodo(todoId, updates);
      await fetchRecentTodos();
      setEditingTodo(null);
      setShowEditTodoModal(false);
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      console.error('Error updating todo:', err);
      showAppAlert('Failed to update todo');
    }
  };

  const handleAddTodo = async (todoData) => {
    try {
      await apiService.addTodo({
        ...todoData,
        contextId: context.id
      });
      fetchRecentTodos();
      setShowAddTodoModal(false);
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      console.error('Error adding todo:', err);
      showAppAlert('Failed to add todo');
    }
  };

  const handleAddTodoToCalendar = async (todoId, eventData) => {
    await apiService.addTodoToCalendar(todoId, eventData);
    await fetchRecentTodos();
    await fetchUpcomingEvents();
    setShowAddToCalendarModal(false);
    setCalendarTodo(null);
  };

  const getLinkedTodoIdFromEvent = (event) =>
    event?.linkedTodoId ?? (event?.linkedTodoIds && event.linkedTodoIds[0]);

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
      await fetchRecentTodos();
      await fetchUpcomingEvents();
    } catch (err) {
      console.error('Error unlinking todo:', err);
      showAppAlert('Failed to remove from calendar');
    }
  };

  const handleViewCalendarEvent = (todo) => {
    const linkedEventId = todo.calendarEventId ?? (todo.calendarEventIds && todo.calendarEventIds[0]);
    if (!linkedEventId) {
      setCalendarTodo(todo);
      setShowAddToCalendarModal(true);
      return;
    }
    onRequestViewCalendarEvent?.(context.id, linkedEventId);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (eventItem) => {
    setEditingEvent(eventItem);
    setShowEventModal(true);
    setOpenEventMenuId(null);
  };

  const handleDeleteEvent = async (eventItem) => {
    try {
      const deleted = await deleteEventWithConfirmation(eventItem.id, eventItem, apiService);
      if (deleted) {
        await fetchUpcomingEvents();
        await fetchRecentTodos();
        if (onDataUpdate) {
          onDataUpdate();
        }
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      showAppAlert('Failed to delete event');
    } finally {
      setOpenEventMenuId(null);
    }
  };

  const handleUnlinkEventTodo = async (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    const confirmed = await confirmAction({
      title: 'Unlink todo?',
      message: 'This will unlink the todo from the event.',
      confirmLabel: 'Unlink',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.unlinkTodoFromEvent(linkedTodoId, eventItem.id);
      await fetchUpcomingEvents();
      await fetchRecentTodos();
    } catch (err) {
      console.error('Error unlinking todo from event:', err);
      showAppAlert('Failed to unlink todo from event');
    } finally {
      setOpenEventMenuId(null);
    }
  };

  const handleViewLinkedTodo = (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    onRequestViewLinkedTodo?.(context.id, linkedTodoId);
    setOpenEventMenuId(null);
  };

  const handleViewEventDetails = (eventItem) => {
    onRequestViewCalendarEvent?.(context.id, eventItem.id);
    setOpenEventMenuId(null);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, eventData);
      } else {
        await apiService.createEvent({
          ...eventData,
          contextId: context.id
        });
      }
      await fetchUpcomingEvents();
      setShowEventModal(false);
      setEditingEvent(null);
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      console.error('Error saving event:', err);
      showAppAlert('Failed to save event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const addTransaction = async () => {
    if (!newTransaction.amount) {
      showAppAlert('Amount is required');
      return;
    }
    
    try {
      const transactionToAdd = {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        tags: Array.isArray(newTransaction.tags) ? newTransaction.tags : [],
        date: newTransaction.date,
        contextId: context.id
      };

      if (editingTransaction) {
        // Update existing transaction
        await apiService.updateTransaction(editingTransaction.id, transactionToAdd);
      } else {
        // Add new transaction
        await apiService.addTransaction(transactionToAdd);
      }

      // Trigger data refresh in parent
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      // Reset form
      setNewTransaction({
        type: 'expense',
        amount: '',
        tags: [],
        description: '',
        date: new Date().toISOString().split('T')[0],
        contextId: context.id
      });
      setEditingTransaction(null);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
      showAppAlert('Failed to add transaction: ' + err.message);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      amount: transaction.amount.toString(),
      tags: transaction.tags || [],
      description: transaction.description,
      date: transaction.date,
      contextId: context.id
    });
    setShowAddModal(true);
  };

  const handleCloseTransactionModal = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
    setNewTransaction({
      type: 'expense',
      amount: '',
      tags: [],
      description: '',
      date: new Date().toISOString().split('T')[0],
      contextId: context.id
    });
  };

  const fieldType = context.fieldType || 'Revenue';
  const fieldBadgeClass = FIELD_TYPE_BADGE_CLASS;

  return (
    <div className="space-y-4 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="my-4 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">{context.name}</h1>
            <span className={fieldBadgeClass}>{fieldType}</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Summarizes this field’s finances, todos, notes, and calendar so you know what’s happening now.
        </p>
        <div className="mt-4 h-px bg-slate-100" />
      </div>

      {/* Stats Cards - All white with consistent styling like Home */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100/80 rounded-lg">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Income</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_income?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-rose-100/80 rounded-lg">
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Expenses</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_expenses?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-100/80 rounded-lg">
              <Wallet size={18} className="text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Balance</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.balance?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <OverviewCard
          title="Recent Transactions"
          icon={Wallet}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              Add Transaction
            </button>
          }
        >
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-colors group relative"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      transaction.type === 'income' ? 'bg-emerald-100/80' : 'bg-rose-100/80'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={14} className="text-emerald-600" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm truncate">{transaction.description}</p>
                      <p className="text-xs text-slate-500">
                        {transaction.tags?.map(tag => `#${tag}`).join(' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold flex-shrink-0 ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    
                    {/* Transaction Menu */}
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = e.currentTarget.nextElementSibling;
                          
                          // Close all other menus first
                          document.querySelectorAll('.transaction-menu').forEach(m => {
                            if (m !== menu) m.classList.add('hidden');
                          });
                          
                          menu.classList.toggle('hidden');
                          
                          // Adjust position if near bottom of viewport
                          const rect = e.currentTarget.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          
                          if (spaceBelow < 100) {
                            menu.style.bottom = '100%';
                            menu.style.top = 'auto';
                            menu.style.marginBottom = '4px';
                          } else {
                            menu.style.top = '100%';
                            menu.style.bottom = 'auto';
                            menu.style.marginTop = '4px';
                          }
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <MoreVertical size={14} className="text-slate-500" />
                      </button>
                      <div className="transaction-menu hidden absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[100px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.parentElement.classList.add('hidden');
                            handleEditTransaction(transaction);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.currentTarget.parentElement.classList.add('hidden');
                            const confirmed = await confirmAction({
                              title: 'Delete transaction?',
                              message: 'This transaction will be permanently removed.',
                              confirmLabel: 'Delete',
                              tone: 'danger'
                            });
                            if (!confirmed) return;
                            try {
                              await apiService.deleteTransaction(transaction.id);
                              if (onDataUpdate) {
                                onDataUpdate();
                              }
                              showAppAlert('Transaction deleted', { type: 'info' });
                            } catch (err) {
                              console.error('Error deleting transaction:', err);
                              showAppAlert('Failed to delete transaction');
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-1">
              <Wallet size={48} className="text-slate-300" />
              <p className="text-slate-500 text-sm">No transactions yet</p>
              <p className="text-slate-400 text-xs">Track finances to see recent activity.</p>
            </div>
          )}
        </OverviewCard>

        {/* Recent Todos */}
        <OverviewCard
          title="Active Todos"
          icon={CheckSquare}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowAddTodoModal(true)}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              Add Todo
            </button>
          }
        >
          {todosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : recentTodos.length > 0 ? (
            <div className="space-y-2">
              {recentTodos.map((todo) => {
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
                    key={todo.id}
                    className="flex items-start justify-between p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-colors group relative"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => handleMarkTodoAsDone(todo.id)}
                        className={`p-1.5 rounded-lg flex-shrink-0 transition-all ${
                          todo.status === 'in_progress' ? 'bg-amber-100/80 hover:bg-emerald-100' : 'bg-slate-100/80 hover:bg-emerald-100'
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
                        {(todo.dueDate || todo.dueTime) && (
                          <div
                            className={`flex items-center gap-3 text-xs ${
                              isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                            } mt-0.5`}
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priorityColors[todo.priority]}`}>
                        {todo.priority}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200">
                          Overdue
                        </span>
                      )}
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling;

                            document.querySelectorAll('.todo-menu').forEach((m) => {
                              if (m !== menu) m.classList.add('hidden');
                            });

                            menu.classList.toggle('hidden');

                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;

                            if (spaceBelow < 120) {
                              menu.style.bottom = '100%';
                              menu.style.top = 'auto';
                              menu.style.marginBottom = '4px';
                            } else {
                              menu.style.top = '100%';
                              menu.style.bottom = 'auto';
                              menu.style.marginTop = '4px';
                            }
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <MoreVertical size={14} className="text-slate-500" />
                        </button>
                        <div className="todo-menu hidden absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.parentElement.classList.add('hidden');
                              setEditingTodo(todo);
                              setShowEditTodoModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          {todo.calendarEventId || (todo.calendarEventIds && todo.calendarEventIds.length) ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.parentElement.classList.add('hidden');
                                  handleViewCalendarEvent(todo);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                              >
                                <Calendar size={12} />
                                View Calendar Event
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.parentElement.classList.add('hidden');
                                  handleRemoveTodoFromCalendar(todo);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                              >
                                <Unlink size={12} />
                                Remove from Calendar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.parentElement.classList.add('hidden');
                                setCalendarTodo(todo);
                                setShowAddToCalendarModal(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700 whitespace-nowrap"
                            >
                              <CalendarPlus size={12} />
                              Add to Calendar
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.parentElement.classList.add('hidden');
                              handleDeleteTodo(todo);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
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
              <p className="text-slate-400 text-xs">Create todos to see them here.</p>
            </div>
          )}
        </OverviewCard>
        {/* Recent Notes */}
        <OverviewCard
          title="Recent Notes"
          icon={Lightbulb}
          rightSlot={
            <button
              type="button"
              onClick={onOpenNotes}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              Add Note
            </button>
          }
        >
          {notesLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="space-y-2">
              {recentNotes.map((note) => {
                const { date } = getNoteTimestamp(note.createdAt);
                const tags = Array.isArray(note.tags) ? note.tags : [];
                const isMenuOpen = openNoteMenuId === note.id;
                return (
                  <div
                    key={note.id}
                    ref={openNoteMenuId === note.id ? noteMenuContainerRef : undefined}
                    className="group relative flex flex-col gap-2 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setOpenNoteMenuId(null);
                      onOpenNotes();
                    }}
                  >
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenNoteMenuId((prev) => (prev === note.id ? null : note.id));
                      }}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {isMenuOpen && (
                      <div
                        className="absolute top-8 right-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[130px] z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotePreview(note);
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">{date}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{note.title || 'Untitled note'}</p>
                      {getNotePreview(note.body) && (
                        <p className="text-xs text-slate-500 truncate">{getNotePreview(note.body)}</p>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">No notes yet. Start capturing ideas.</div>
          )}
        </OverviewCard>

        {/* Upcoming Events */}
        <OverviewCard
          title="Upcoming Events"
          icon={Calendar}
          rightSlot={
            <button
              type="button"
              onClick={handleAddEvent}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              Add Event
            </button>
          }
        >
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const linkedTodoId = getLinkedTodoIdFromEvent(event);
                const isMenuOpen = openEventMenuId === event.id;
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-slate-50/60 rounded-lg border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{event.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {event.allDay
                            ? 'All day'
                            : new Date(event.startDate).toLocaleTimeString([], {
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenEventMenuId(isMenuOpen ? null : event.id);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px] z-20">
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                          >
                            <Calendar size={12} />
                            View Event
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                          >
                            <Edit2 size={12} />
                            Edit Event
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-xs text-red-600"
                          >
                            <Trash2 size={12} />
                            Delete Event
                          </button>
                          {linkedTodoId && (
                            <>
                              <button
                                onClick={() => handleViewLinkedTodo(event)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                              >
                                <CheckSquare size={12} />
                                View Linked Todo
                              </button>
                              <button
                                onClick={() => handleUnlinkEventTodo(event)}
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
              <Calendar size={48} className="text-slate-300" />
              <p className="text-slate-500 text-sm">No events scheduled</p>
              <p className="text-slate-400 text-xs">Use Add Event to schedule one.</p>
            </div>
          )}
        </OverviewCard>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        showModal={showAddModal}
        setShowModal={handleCloseTransactionModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onAdd={addTransaction}
        contextId={context.id}
        isEditing={!!editingTransaction}
      />

      {/* Add Todo Modal */}
      <AddTodoModal
        showModal={showAddTodoModal}
        setShowModal={setShowAddTodoModal}
        onAdd={handleAddTodo}
      />

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

      <EventModal
        contextId={context.id}
        event={editingEvent}
        show={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />

      <EditTodoModal
        showModal={showEditTodoModal}
        setShowModal={setShowEditTodoModal}
        todo={editingTodo}
        onUpdate={handleEditTodo}
      />
    </div>
  );
};

export default ContextOverview;
