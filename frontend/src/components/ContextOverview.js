import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, Wallet, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';
import AddTodoModal from './AddTodoModal';
import EditTodoModal from './EditTodoModal';
import apiService from '../services/apiService';

const ContextOverview = ({ context, stats, recentTransactions, loading, onDataUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [recentTodos, setRecentTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [showEditTodoModal, setShowEditTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    tags: [],
    description: '',
    date: new Date().toISOString().split('T')[0],
    contextId: context.id
  });

  useEffect(() => {
    fetchRecentTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id]);

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

  const handleDeleteTodo = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await apiService.deleteTodo(todoId);
        fetchRecentTodos();
        if (onDataUpdate) {
          onDataUpdate();
        }
      } catch (err) {
        console.error('Error deleting todo:', err);
        alert('Failed to delete todo');
      }
    }
  };

  const handleEditTodo = async (todoId, updates) => {
    try {
      await apiService.updateTodo(todoId, updates);
      fetchRecentTodos();
      setShowEditTodoModal(false);
      setEditingTodo(null);
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

      await apiService.addTransaction(transactionToAdd);

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
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert('Failed to add transaction: ' + err.message);
    }
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
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-slate-700" />
            Recent Transactions
          </h3>
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
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.currentTarget.parentElement.classList.add('hidden');
                            // Set transaction for editing
                            setNewTransaction({
                              ...transaction,
                              contextId: context.id
                            });
                            setShowAddModal(true);
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
            <p className="text-slate-500 text-sm">No transactions yet</p>
          )}
        </div>

        {/* Recent Todos */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={20} className="text-slate-700" />
              Active Todos
            </div>
            <span className="text-sm font-normal text-slate-500">
              {recentTodos.length} {recentTodos.length === 1 ? 'todo' : 'todos'}
            </span>
          </h3>
          {todosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : recentTodos.length > 0 ? (
            <div className="space-y-2">
              {recentTodos.map(todo => {
                const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();
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
                        <CheckSquare size={14} className={`transition-colors ${
                          todo.status === 'in_progress' ? 'text-amber-600' : 'text-slate-600'
                        } group-hover:text-emerald-600`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 text-sm truncate">{todo.title}</p>
                        {todo.dueDate && (
                          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                            Due: {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <div className="todo-menu hidden absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[100px]">
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
            </div>
          )}
        </div>

        {/* Recent Ideas */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-slate-700" />
            Recent Ideas
          </h3>
          <div className="text-center py-8">
            <Lightbulb size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Ideas coming soon</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-slate-700" />
            Upcoming Events
          </h3>
          <div className="text-center py-8">
            <Calendar size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Calendar coming soon</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Consistent button colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Add Transaction button - indigo */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow"
        >
          <Plus size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Transaction</p>
        </button>
        
        {/* Add Todo button - blue - NOW WORKING */}
        <button 
          onClick={() => setShowAddTodoModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow"
        >
          <CheckSquare size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Todo</p>
        </button>
        
        {/* Disabled buttons - consistent gray style */}
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <Lightbulb size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Idea</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
        
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <Calendar size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Event</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onAdd={addTransaction}
        contextId={context.id}
      />

      {/* Add Todo Modal */}
      <AddTodoModal
        showModal={showAddTodoModal}
        setShowModal={setShowAddTodoModal}
        contextId={context.id}
        onAdd={handleAddTodo}
      />

      {/* Edit Todo Modal */}
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