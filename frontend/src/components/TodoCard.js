import { useState } from 'react';
import { MoreVertical, Trash2, Calendar, Flag, Tag, Edit2, Check, X } from 'lucide-react';

const TodoCard = ({ todo, onUpdateStatus, onDeleteTodo, onUpdateTodo }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);
  const [editedDescription, setEditedDescription] = useState(todo.description || '');
  const [editedPriority, setEditedPriority] = useState(todo.priority);
  const [editedDueDate, setEditedDueDate] = useState(todo.dueDate || '');
  const [editedTags, setEditedTags] = useState(todo.tags || []);
  const [tagInput, setTagInput] = useState('');

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200'
  };

  const priorityIcons = {
    low: 'text-slate-500',
    medium: 'text-amber-500',
    high: 'text-red-500'
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('todoId', todo.id.toString());
    e.dataTransfer.setData('fromStatus', todo.status);
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      onUpdateTodo(todo.id, {
        title: editedTitle,
        description: editedDescription,
        priority: editedPriority,
        dueDate: editedDueDate,
        tags: editedTags
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(todo.title);
    setEditedDescription(todo.description || '');
    setEditedPriority(todo.priority);
    setEditedDueDate(todo.dueDate || '');
    setEditedTags(todo.tags || []);
    setTagInput('');
    setIsEditing(false);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag && !editedTags.includes(tag)) {
        setEditedTags([...editedTags, tag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== 'done';

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      className="bg-white rounded-lg p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all cursor-move group"
    >
      {isEditing ? (
        // Edit Mode - Enhanced with priority, tags, due date
        <div className="space-y-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Add description..."
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            rows={2}
          />
          
          {/* Priority Selector */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setEditedPriority('low')}
                className={`py-1 rounded text-xs font-medium transition-all ${
                  editedPriority === 'low'
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setEditedPriority('medium')}
                className={`py-1 rounded text-xs font-medium transition-all ${
                  editedPriority === 'medium'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setEditedPriority('high')}
                className={`py-1 rounded text-xs font-medium transition-all ${
                  editedPriority === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Due Date</label>
            <input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1 min-h-[24px]">
              {editedTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag..."
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              <Check size={14} />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 flex items-center justify-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-slate-800 text-sm flex-1 leading-snug">
              {todo.title}
            </h4>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={16} className="text-slate-500" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[140px]">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-sm text-slate-700"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDeleteTodo(todo.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-sm text-red-600"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {todo.description && (
            <p className="text-xs text-slate-600 mb-2 line-clamp-2">
              {todo.description}
            </p>
          )}

          {/* Tags */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {todo.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs"
                >
                  <Tag size={10} />
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            {/* Priority */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${priorityColors[todo.priority]}`}>
              <Flag size={10} className={priorityIcons[todo.priority]} />
              <span className="text-xs font-medium capitalize">{todo.priority}</span>
            </div>

            {/* Due Date */}
            {todo.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
              }`}>
                <Calendar size={12} />
                {new Date(todo.dueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TodoCard;