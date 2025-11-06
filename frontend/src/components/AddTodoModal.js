import { useState } from 'react';
import { X, Flag, Tag as TagIcon } from 'lucide-react';

const AddTodoModal = ({ 
  showModal, 
  setShowModal, 
  contextId,
  onAdd 
}) => {
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  if (!showModal) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag) {
        const currentTags = newTodo.tags || [];
        if (!currentTags.includes(tag)) {
          setNewTodo(prev => ({
            ...prev,
            tags: [...currentTags, tag]
          }));
        }
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = newTodo.tags || [];
    setNewTodo(prev => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) {
      alert('Todo title is required');
      return;
    }
    
    // Call onAdd with the todo data
    onAdd(newTodo);
    
    // Reset form
    setNewTodo({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      tags: []
    });
    setTagInput('');
  };

  const handleClose = () => {
    // Reset form when closing
    setNewTodo({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      tags: []
    });
    setTagInput('');
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Add New Todo</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter todo title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Flag size={14} />
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewTodo(prev => ({ ...prev, priority: 'low' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  newTodo.priority === 'low'
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setNewTodo(prev => ({ ...prev, priority: 'medium' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  newTodo.priority === 'medium'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setNewTodo(prev => ({ ...prev, priority: 'high' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  newTodo.priority === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date (optional)</label>
            <input
              type="date"
              value={newTodo.dueDate}
              onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Time (optional)</label>
            <input
              type="time"
              value={newTodo.dueTime || ''}
              onChange={(e) => setNewTodo(prev => ({ ...prev, dueTime: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Set a specific time for this todo</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <TagIcon size={14} />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {(newTodo.tags || []).length > 0 ? (
                (newTodo.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 py-1">No tags added yet</span>
              )}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Type tag and press Enter (e.g., urgent, project)"
            />
            <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add a tag</p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
          >
            Add Todo
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTodoModal;