import { useState } from 'react';
import { X, Flag, Tag as TagIcon, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import TimePicker from './TimePicker';
import DatePicker from './DatePicker';
import DurationPicker from './DurationPicker';
import { showAppAlert } from '../utils/alertService';

const AddTodoModal = ({ 
  showModal, 
  setShowModal, 
  onAdd 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    durationHours: '',
    tags: [],
    status: 'todo'
  });
  const [tagInput, setTagInput] = useState('');

  if (!showModal) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag) {
        const currentTags = formData.tags || [];
        if (!currentTags.includes(tag)) {
          setFormData(prev => ({
            ...prev,
            tags: [...currentTags, tag]
          }));
        }
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = formData.tags || [];
    setFormData(prev => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const clearDueDate = () => {
    setFormData(prev => ({ ...prev, dueDate: '', dueTime: '' }));
  };

  const clearDueTime = () => {
    setFormData(prev => ({ ...prev, dueTime: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showAppAlert('Todo title is required');
      return;
    }
    
    // Call onAdd with the todo data
    onAdd({
      ...formData,
      durationHours: (() => {
        const parsed = parseFloat(formData.durationHours);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      })(),
      status: formData.status || 'todo'
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      durationHours: '',
      tags: [],
      status: 'todo'
    });
    setTagInput('');
    setShowModal(false);
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      durationHours: '',
      tags: [],
      status: 'todo'
    });
    setTagInput('');
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Add New Todo</h3>
            <p className="text-sm text-slate-500 mt-1">
              Capture a task for this context.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        <div className="border-t border-slate-100 mt-4 mb-5" />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter todo title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                onClick={() => setFormData(prev => ({ ...prev, priority: 'low' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  formData.priority === 'low'
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: 'medium' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  formData.priority === 'medium'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: 'high' }))}
                className={`py-2 rounded-lg transition-all font-medium text-sm ${
                  formData.priority === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                High
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <CalendarIcon size={14} />
                Due Date
              </label>
              <div className="flex gap-2">
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDate: date,
                      dueTime: date ? prev.dueTime : ''
                    }))
                  }
                  onClear={clearDueDate}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Due Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <ClockIcon size={14} />
                Due Time
              </label>
              <TimePicker
                value={formData.dueTime}
                onChange={(time) => setFormData(prev => ({ ...prev, dueTime: time }))}
                onClear={clearDueTime}
                disabled={!formData.dueDate}
                showIcon={false}
              />
              {!formData.dueDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Select a due date to enable time selection.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                Duration
              </label>
              <DurationPicker
                value={
                  formData.durationHours === '' ? null : Number(formData.durationHours)
                }
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    durationHours: val === null ? '' : String(val)
                  }))
                }
                allowEmpty
                placeholder="Duration"
                clearLabel="No duration"
              />
              <p className="text-xs text-slate-400 mt-1">
                Optional. Estimate how long this task should take.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <TagIcon size={14} />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {(formData.tags || []).length > 0 ? (
                (formData.tags || []).map((tag, index) => (
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

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              Add Todo
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTodoModal;
