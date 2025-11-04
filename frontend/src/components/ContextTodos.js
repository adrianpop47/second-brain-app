import { useState, useEffect } from 'react';
import { Plus, Search, X, Filter } from 'lucide-react';
import TodoColumn from './TodoColumn';
import AddTodoModal from './AddTodoModal';
import apiService from '../services/apiService';

const STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};

const ContextTodos = ({ context }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: [],
    contextId: context.id,
    status: STATUSES.TODO
  });

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContextTodos(context.id);
      setTodos(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.title.trim()) {
      alert('Todo title is required');
      return;
    }

    try {
      await apiService.addTodo({
        ...newTodo,
        contextId: context.id
      });

      await fetchTodos();
      
      // Reset form
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
        contextId: context.id,
        status: STATUSES.TODO
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding todo:', err);
      alert('Failed to add todo');
    }
  };

  const updateTodoStatus = async (todoId, newStatus) => {
    try {
      await apiService.updateTodo(todoId, { status: newStatus });
      await fetchTodos();
    } catch (err) {
      console.error('Error updating todo status:', err);
      alert('Failed to update todo');
    }
  };

  const deleteTodo = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await apiService.deleteTodo(todoId);
        await fetchTodos();
      } catch (err) {
        console.error('Error deleting todo:', err);
        alert('Failed to delete todo');
      }
    }
  };

  const updateTodo = async (todoId, updates) => {
    try {
      await apiService.updateTodo(todoId, updates);
      await fetchTodos();
    } catch (err) {
      console.error('Error updating todo:', err);
      alert('Failed to update todo');
    }
  };

  // Filter todos based on search and priority
  const filteredTodos = todos.filter(todo => {
    // Remove # from search query if user types it
    const cleanQuery = searchQuery.toLowerCase().replace(/^#/, '');
    
    const matchesSearch = !cleanQuery || 
      todo.title.toLowerCase().includes(cleanQuery) ||
      todo.description?.toLowerCase().includes(cleanQuery) ||
      todo.tags?.some(tag => tag.toLowerCase().includes(cleanQuery));
    
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Group todos by status
  const todosByStatus = {
    [STATUSES.TODO]: filteredTodos.filter(t => t.status === STATUSES.TODO),
    [STATUSES.IN_PROGRESS]: filteredTodos.filter(t => t.status === STATUSES.IN_PROGRESS),
    [STATUSES.DONE]: filteredTodos.filter(t => t.status === STATUSES.DONE)
  };

  const getTodoStats = () => {
    const total = todos.length;
    const completed = todos.filter(t => t.status === STATUSES.DONE).length;
    const inProgress = todos.filter(t => t.status === STATUSES.IN_PROGRESS).length;
    const pending = todos.filter(t => t.status === STATUSES.TODO).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, pending, completionRate };
  };

  const stats = getTodoStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{context.name} › Todos</h2>
          <p className="text-sm text-slate-500">Task management with Kanban board</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow"
        >
          <Plus size={18} />
          Add Todo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50">
          <p className="text-xs font-medium text-slate-600 mb-1">Total</p>
          <p className="text-2xl font-semibold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50">
          <p className="text-xs font-medium text-slate-600 mb-1">To Do</p>
          <p className="text-2xl font-semibold text-slate-600">{stats.pending}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50">
          <p className="text-xs font-medium text-slate-600 mb-1">In Progress</p>
          <p className="text-2xl font-semibold text-amber-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50">
          <p className="text-xs font-medium text-slate-600 mb-1">Done</p>
          <p className="text-2xl font-semibold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-sm">
          <p className="text-xs font-medium text-blue-100 mb-1">Completion</p>
          <p className="text-2xl font-semibold text-white">{stats.completionRate}%</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search todos by title, description, or tags..."
            className="w-full bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative sm:w-48">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="appearance-none w-full bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg pl-10 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <div className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TodoColumn
          title="To Do"
          status={STATUSES.TODO}
          todos={todosByStatus[STATUSES.TODO]}
          onUpdateStatus={updateTodoStatus}
          onDeleteTodo={deleteTodo}
          onUpdateTodo={updateTodo}
          color="slate"
        />
        <TodoColumn
          title="In Progress"
          status={STATUSES.IN_PROGRESS}
          todos={todosByStatus[STATUSES.IN_PROGRESS]}
          onUpdateStatus={updateTodoStatus}
          onDeleteTodo={deleteTodo}
          onUpdateTodo={updateTodo}
          color="amber"
        />
        <TodoColumn
          title="Done"
          status={STATUSES.DONE}
          todos={todosByStatus[STATUSES.DONE]}
          onUpdateStatus={updateTodoStatus}
          onDeleteTodo={deleteTodo}
          onUpdateTodo={updateTodo}
          color="emerald"
        />
      </div>

      {/* Add Todo Modal */}
      <AddTodoModal
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        newTodo={newTodo}
        setNewTodo={setNewTodo}
        onAdd={addTodo}
      />
    </div>
  );
};

export default ContextTodos;