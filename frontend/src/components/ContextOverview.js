import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, CalendarPlus, Clock, Wallet, Plus, MoreVertical, Edit2, Trash2, Unlink } from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';
import AddTodoModal from './AddTodoModal';
import EditTodoModal from './EditTodoModal';
import AddTodoToCalendarModal from './AddTodoToCalendarModal';
import EventModal from './EventModal';
import apiService from '../services/apiService';
import { isOverdue as isTodoOverdue } from '../utils/todoUtils';
import { deleteTodoWithConfirmation, deleteEventWithConfirmation } from '../utils/deleteUtils';

const OverviewCard = ({ title, icon: Icon, rightSlot = null, children, className = '' }) => (
  <div className={`bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50 ${className}`}>
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

const ContextOverview = ({
  context,
  stats,
  recentTransactions,
  loading,
  onDataUpdate,
  onRequestViewCalendarEvent = () => {},
  onRequestViewLinkedTodo = () => {}
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
      alert('Failed to update todo');
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
      alert('Failed to delete todo');
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
      alert('Failed to update todo');
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
      alert('Failed to add todo');
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
    if (!window.confirm('Remove this todo from the calendar?')) return;
    try {
      await apiService.unlinkTodoFromEvent(todo.id, linkedEventId);
      await fetchRecentTodos();
      await fetchUpcomingEvents();
    } catch (err) {
      console.error('Error unlinking todo:', err);
      alert('Failed to remove from calendar');
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
      alert('Failed to delete event');
    } finally {
      setOpenEventMenuId(null);
    }
  };

  const handleUnlinkEventTodo = async (eventItem) => {
    const linkedTodoId = getLinkedTodoIdFromEvent(eventItem);
    if (!linkedTodoId) return;
    if (!window.confirm('Unlink the todo from this event?')) return;
    try {
      await apiService.unlinkTodoFromEvent(linkedTodoId, eventItem.id);
      await fetchUpcomingEvents();
      await fetchRecentTodos();
    } catch (err) {
      console.error('Error unlinking todo from event:', err);
      alert('Failed to unlink todo from event');
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
      alert('Failed to save event');
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
      alert('Amount is required');
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
      alert('Failed to add transaction: ' + err.message);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{context.name}</h2>
          <p className="text-sm text-slate-500">Context Overview</p>
        </div>
      </div>

      {/* Stats Cards - All white with consistent styling like Home */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100/80 rounded-lg">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Income</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_income?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-rose-100/80 rounded-lg">
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Expenses</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_expenses?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
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
        <OverviewCard title="Recent Transactions" icon={Wallet}>
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
                            if (window.confirm('Are you sure you want to delete this transaction?')) {
                              try {
                                await apiService.deleteTransaction(transaction.id);
                                if (onDataUpdate) {
                                  onDataUpdate();
                                }
                              } catch (err) {
                                console.error('Error deleting transaction:', err);
                                alert('Failed to delete transaction');
                              }
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
            <span className="text-sm font-normal text-slate-500">
              {recentTodos.length} {recentTodos.length === 1 ? 'todo' : 'todos'}
            </span>
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
        {/* Recent Ideas */}
        <OverviewCard title="Recent Ideas" icon={Lightbulb}>
          <div className="py-10 flex flex-col items-center justify-center text-center gap-1">
            <Lightbulb size={48} className="text-slate-300" />
            <p className="text-slate-500 text-sm">Ideas coming soon</p>
            <p className="text-slate-400 text-xs">Brainstorming tools are on the way.</p>
          </div>
        </OverviewCard>

        {/* Upcoming Events */}
        <OverviewCard title="Upcoming Events" icon={Calendar}>
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

      {/* Quick Actions - Consistent button colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Add Transaction button - indigo */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow"
        >
          <Wallet size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Transaction</p>
          <p className="text-xs text-white/80 mt-1">Track income or expenses</p>
        </button>
        
        {/* Add Todo button - blue */}
        <button 
          onClick={() => setShowAddTodoModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow"
        >
          <CheckSquare size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Todo</p>
          <p className="text-xs text-white/80 mt-1">Capture a task quickly</p>
        </button>
        
        {/* Disabled buttons - consistent gray style */}
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <Lightbulb size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Idea</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
        
        <button
          onClick={handleAddEvent}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow"
        >
          <Calendar size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Event</p>
          <p className="text-xs mt-1 text-white/80">Schedule calendar events</p>
        </button>
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
