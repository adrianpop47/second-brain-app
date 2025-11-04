import { useState, useEffect } from 'react';
import { X, Flag, Tag as TagIcon } from 'lucide-react';

const EditTodoModal = ({ 
  showModal, 
  setShowModal, 
  todo,
  onUpdate
}) => {
  const [editedTodo, setEditedTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (todo) {
      setEditedTodo({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        dueDate: todo.dueDate || '',
        tags: todo.tags || []
      });
    }
  }, [todo]);

  if (!showModal || !todo) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag && !editedTodo.tags.includes(tag)) {
        setEditedTodo(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedTodo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editedTodo.title.trim()) {
      alert('Title is required');
      return;
    }
    onUpdate(todo.id, editedTodo);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Edit Todo</h3>
          <button
            type="button"
            onClick={() => setShowModal(false)}
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
              value={editedTodo.title}
              onChange={(e) => setEditedTodo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter todo title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={editedTodo.description}
              onChange={(e) => setEditedTodo(prev => ({ ...prev, description: e.target.value }))}
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
                onClick={() => setEditedTodo(prev => ({ ...prev, priority: 'low' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  editedTodo.priority === 'low'
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setEditedTodo(prev => ({ ...prev, priority: 'medium' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  editedTodo.priority === 'medium'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setEditedTodo(prev => ({ ...prev, priority: 'high' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  editedTodo.priority === 'high'
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
            <input
              type="date"
              value={editedTodo.dueDate}
              onChange={(e) => setEditedTodo(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <TagIcon size={14} />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {editedTodo.tags.length > 0 ? (
                editedTodo.tags.map((tag, index) => (
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
            Update Todo
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTodoModal;