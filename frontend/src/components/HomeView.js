import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';
import EditTodoModal from './EditTodoModal';
import apiService from '../services/apiService';

const HomeView = ({ 
  summaryStats, 
  contextData,
  loading
}) => {
  const [allTodos, setAllTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [contexts, setContexts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    fetchAllTodos();
  }, []);

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

  const handleDeleteTodo = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await apiService.deleteTodo(todoId);
        fetchAllTodos();
      } catch (err) {
        console.error('Error deleting todo:', err);
        alert('Failed to delete todo');
      }
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
        <ExpenseChart data={contextData} title="Expenses by Context" />
        
        {/* Active Todos List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={20} className="text-slate-700" />
              Active Todos
            </div>
            <span className="text-sm font-normal text-slate-500">
              {activeTodoCount} {activeTodoCount === 1 ? 'todo' : 'todos'}
            </span>
          </h3>
          
          {todosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : allTodos.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pb-20">
              {allTodos.map(todo => {
                const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();
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
                        <CheckSquare size={14} className={`transition-colors ${
                          todo.status === 'in_progress' ? 'text-amber-600' : 'text-slate-600'
                        } group-hover:text-emerald-600`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 text-sm truncate">{todo.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{todo.contextName}</span>
                          {todo.dueDate && (
                            <>
                              <span className="text-xs text-slate-300">•</span>
                              <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priorityColors[todo.priority]}`}>
                        {todo.priority}
                      </span>
                      
                      {/* Todo Menu */}
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling;
                            
                            // Close all other menus first
                            document.querySelectorAll('.todo-menu').forEach(m => {
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
                        <div className="todo-menu hidden absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[100] min-w-[100px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.parentElement.classList.add('hidden');
                              setEditingTodo(todo);
                              setShowEditModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-xs text-slate-700"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.parentElement.classList.add('hidden');
                              handleDeleteTodo(todo.id);
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
            <div className="text-center py-8">
              <CheckSquare size={48} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active todos</p>
              <p className="text-slate-400 text-xs mt-1">Create todos in your contexts</p>
            </div>
          )}
        </div>
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

      {/* Coming Soon Preview */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-6 border border-slate-200/50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center border border-slate-200/50">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <Lightbulb size={24} className="text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Ideas</h4>
            <p className="text-xs text-slate-600">Capture and organize thoughts</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center border border-slate-200/50">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <Calendar size={24} className="text-orange-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Calendar</h4>
            <p className="text-xs text-slate-600">Schedule events and deadlines</p>
          </div>
        </div>
      </div>

      {/* Edit Todo Modal */}
      <EditTodoModal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        todo={editingTodo}
        onUpdate={handleEditTodo}
      />
    </div>
  );
};

export default HomeView;