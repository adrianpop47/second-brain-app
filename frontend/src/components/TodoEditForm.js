import { useState, useEffect } from 'react';
import { Flag, Tag as TagIcon, X, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import TimePicker from './TimePicker';
import DatePicker from './DatePicker';
import DurationPicker from './DurationPicker';
import { showAppAlert } from '../utils/alertService';

const priorityOptions = [
  { value: 'low', label: 'Low', active: 'bg-slate-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
  { value: 'medium', label: 'Medium', active: 'bg-amber-500 text-white', inactive: 'bg-amber-100 text-amber-600 hover:bg-amber-200' },
  { value: 'high', label: 'High', active: 'bg-red-500 text-white', inactive: 'bg-red-100 text-red-600 hover:bg-red-200' }
];

const defaultTodo = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  dueTime: '',
  durationHours: '',
  tags: []
};

const TodoEditForm = ({
  todo,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  submitting: submittingProp = false
}) => {
  const [formState, setFormState] = useState(defaultTodo);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const hasLinkedEvent = Boolean(
    todo?.calendarEventId ||
      (Array.isArray(todo?.calendarEventIds) && todo.calendarEventIds.length > 0)
  );

  useEffect(() => {
    if (todo) {
      setFormState({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        dueDate: todo.dueDate || '',
        dueTime: todo.dueTime || '',
        durationHours:
          typeof todo.durationHours === 'number' && todo.durationHours > 0
            ? String(todo.durationHours)
            : '',
        tags: Array.isArray(todo.tags) ? todo.tags : []
      });
      setTagInput('');
    }
  }, [todo]);

  const handlePriorityChange = (value) => {
    setFormState((prev) => ({ ...prev, priority: value }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (tag && !formState.tags.includes(tag)) {
        setFormState((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormState((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const clearDueDate = () => {
    setFormState((prev) => ({ ...prev, dueDate: '', dueTime: '' }));
  };

  const clearDueTime = () => {
    setFormState((prev) => ({ ...prev, dueTime: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      showAppAlert('Todo title is required');
      return;
    }
    try {
      setSaving(true);
      await Promise.resolve(
        onSubmit({
          title: formState.title.trim(),
          description: formState.description.trim(),
          priority: formState.priority,
          dueDate: formState.dueDate,
          dueTime: formState.dueTime,
          durationHours: (() => {
            const parsed = parseFloat(formState.durationHours);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
          })(),
          tags: formState.tags
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="sr-only" htmlFor="todo-title">Title</label>
        <input
          id="todo-title"
          type="text"
          value={formState.title}
          onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="Todo title"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="sr-only" htmlFor="todo-description">Description</label>
        <textarea
          id="todo-description"
          value={formState.description}
          onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
          placeholder="Add description (optional)"
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
          {priorityOptions.map(({ value, label, active, inactive }) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePriorityChange(value)}
              className={`py-2 rounded-lg transition-all font-medium text-sm ${
                formState.priority === value ? active : inactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date & Time */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <CalendarIcon size={14} />
            Due Date
          </label>
          <div className="flex gap-2">
            <DatePicker
              value={formState.dueDate}
              onChange={(date) =>
                setFormState((prev) => ({
                  ...prev,
                  dueDate: date,
                  dueTime: date ? prev.dueTime : ''
                }))
              }
              onClear={clearDueDate}
              showIcon={false}
              showClear={Boolean(formState.dueDate)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <ClockIcon size={14} />
            Due Time
          </label>
          <TimePicker
            value={formState.dueTime}
            onChange={(time) => setFormState((prev) => ({ ...prev, dueTime: time }))}
            onClear={clearDueTime}
            disabled={!formState.dueDate}
            showIcon={false}
            showClear={Boolean(formState.dueTime)}
          />
          {!formState.dueDate && (
            <p className="text-xs text-slate-400 mt-1">
              Select a due date to enable time selection.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Duration
          </label>
          <DurationPicker
            value={formState.durationHours === '' ? null : Number(formState.durationHours)}
            onChange={(val) =>
              setFormState((prev) => ({
                ...prev,
                durationHours: val === null ? '' : String(val)
              }))
            }
            allowEmpty={!hasLinkedEvent}
            placeholder="Duration"
            clearLabel="No duration"
          />
          <p className="text-xs text-slate-400 mt-1">
            {hasLinkedEvent
              ? 'Updating this duration also updates the linked calendar event.'
              : 'Optional estimate to plan your effort.'}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
          <TagIcon size={14} />
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
          {formState.tags.length > 0 ? (
            formState.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-indigo-900"
                  title={`Remove tag ${tag}`}
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
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="Type tag and press Enter (e.g., urgent, project)"
        />
        <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add a tag</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || submittingProp}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TodoEditForm;
