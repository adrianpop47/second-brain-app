import { useState, useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag as TagIcon, Repeat, ChevronRight } from 'lucide-react';
import TimePicker from './TimePicker';
import DatePicker from './DatePicker';
import DurationPicker from './DurationPicker';
import { showAppAlert } from '../utils/alertService';

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateTime = (value) => {
  if (!value) return null;
  const [datePart, timePart = '00:00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = '0'] = timePart.split(':');
  return new Date(year, month - 1, day, Number(hour), Number(minute), Number(second));
};

const formatTime = (dateObj) => {
  if (!dateObj) return '';
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
};

const getDefaultEndDateTime = (dateStr, timeStr, durationHours = 1) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0);
  const minutesToAdd = Math.max(30, Math.round(durationHours * 60));
  dateObj.setMinutes(dateObj.getMinutes() + minutesToAdd);
  const endDateStr = formatDate(dateObj);
  const endHour = String(dateObj.getHours()).padStart(2, '0');
  const endMinute = String(dateObj.getMinutes()).padStart(2, '0');
  return `${endDateStr}T${endHour}:${endMinute}:00`;
};

const getDurationHoursFromEvent = (eventData) => {
  if (!eventData) return 1;
  if (eventData.allDay) return 24;
  if (typeof eventData.durationHours === 'number') {
    return Math.max(0.5, Number(eventData.durationHours));
  }
  if (eventData.endDate) {
    const start = parseLocalDateTime(eventData.startDate);
    const end = parseLocalDateTime(eventData.endDate);
    if (start && end) {
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.max(0.5, Math.round(diffHours * 2) / 2);
    }
  }
  return 1;
};

const snapToQuarterHour = (timeValue) => {
  if (!timeValue) return '';
  const [hourStr, minuteStr] = timeValue.split(':');
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;
  let totalMinutes = hours * 60 + minutes;
  totalMinutes = Math.round(totalMinutes / 15) * 15;
  const maxMinutes = 24 * 60 - 15; // cap at 23:45
  if (totalMinutes > maxMinutes) totalMinutes = maxMinutes;
  const snappedHour = Math.floor(totalMinutes / 60);
  const snappedMinute = totalMinutes % 60;
  return `${String(snappedHour).padStart(2, '0')}:${String(snappedMinute).padStart(2, '0')}`;
};

const EventModal = ({
  contextId,
  event = null,
  show,
  onClose,
  onSave
}) => {

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    allDay: false,
    tags: [],
    recurring: false,
    recurrenceType: 'weekly',
    recurrenceEndDate: '',
    durationHours: 1
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const recurrencePickerRef = useRef(null);
  const previousTimeRef = useRef('');
  const hasLinkedTodo = Boolean(
    event?.linkedTodoId ||
      (Array.isArray(event?.linkedTodoIds) && event.linkedTodoIds.length > 0)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (recurrencePickerRef.current && !recurrencePickerRef.current.contains(event.target)) {
        setShowRecurrencePicker(false);
      }
    };

    if (showRecurrencePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecurrencePicker]);

  useEffect(() => {
    if (show && event) {
      // Editing existing event
      const startDate = parseLocalDateTime(event.startDate);

      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: startDate ? formatDate(startDate) : '',
        startTime: event.allDay ? '' : snapToQuarterHour(formatTime(startDate)),
        allDay: event.allDay || false,
        tags: event.tags || [],
        recurring: event.recurring || false,
        recurrenceType: event.recurrenceType || 'weekly',
        recurrenceEndDate: event.recurrenceEndDate || '',
        durationHours: getDurationHoursFromEvent(event)
      });
    } else if (show && !event) {
      // Creating new event - set defaults
      const now = new Date();
      
      setFormData({
        title: '',
        description: '',
        startDate: formatDate(now),
        startTime: snapToQuarterHour(formatTime(now)),
        allDay: false,
        tags: [],
        recurring: false,
        recurrenceType: 'weekly',
        recurrenceEndDate: '',
        durationHours: 1
      });
    }
  }, [show, event]);

  if (!show) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAllDayToggle = () => {
    setFormData((prev) => {
      const nextAllDay = !prev.allDay;
      if (nextAllDay) {
        previousTimeRef.current = prev.startTime || previousTimeRef.current || '';
      }
      const restoredTime = nextAllDay
        ? ''
        : previousTimeRef.current || prev.startTime || snapToQuarterHour(formatTime(new Date()));
      return {
        ...prev,
        allDay: nextAllDay,
        startTime: restoredTime,
        durationHours:
          nextAllDay ? 24 : prev.durationHours === 24 ? 1 : prev.durationHours || 1
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showAppAlert('Event title is required');
      return;
    }

    if (!formData.startDate) {
      showAppAlert('Start date is required');
      return;
    }

    if (!formData.allDay && !formData.startTime) {
      showAppAlert('Start time is required');
      return;
    }

    setLoading(true);

    try {
      // Build datetime strings
      let startDateTime, endDateTime;

      const durationHoursValue = formData.allDay ? 24 : formData.durationHours || 1;

      if (formData.allDay) {
        // All-day event - use local date at midnight without timezone conversion
        startDateTime = `${formData.startDate}T00:00:00`;
        endDateTime = `${formData.startDate}T23:59:59`;
      } else {
        // Timed event
        startDateTime = `${formData.startDate}T${formData.startTime}:00`;
        endDateTime = getDefaultEndDateTime(
          formData.startDate,
          formData.startTime,
          durationHoursValue
        );
      }

      const eventData = {
        contextId: contextId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: formData.allDay,
        durationHours: durationHoursValue,
        tags: formData.tags,
        recurring: formData.recurring,
        recurrenceType: formData.recurring ? formData.recurrenceType : null,
        recurrenceEndDate: formData.recurring && formData.recurrenceEndDate 
          ? formData.recurrenceEndDate 
          : null
      };

      await onSave(eventData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        allDay: false,
        tags: [],
        recurring: false,
        recurrenceType: 'weekly',
        recurrenceEndDate: '',
        durationHours: 1
      });
      setTagInput('');
      setShowRecurrencePicker(false);
    } catch (err) {
      console.error('Error saving event:', err);
      showAppAlert('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      allDay: false,
      tags: [],
      recurring: false,
      recurrenceType: 'weekly',
      recurrenceEndDate: ''
    });
    setTagInput('');
    setShowRecurrencePicker(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {event ? 'Edit Event' : 'Add Event'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Schedule an event in this context
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={handleAllDayToggle}
              className="w-4 h-4 text-indigo-500 border-slate-300 rounded focus:ring-indigo-400"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-slate-700 cursor-pointer">
              All-day event
            </label>
          </div>

          {/* Start Date & Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <CalendarIcon size={14} />
                {formData.allDay ? 'Date' : 'Start Date'} <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                showClear={false}
              />
            </div>

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Clock size={14} />
                  Start Time <span className="text-red-500">*</span>
                </label>
                <TimePicker
                  value={formData.startTime}
                  onChange={(time) =>
                    setFormData((prev) => ({ ...prev, startTime: snapToQuarterHour(time) }))
                  }
                  onClear={() => setFormData(prev => ({ ...prev, startTime: '' }))}
                  showIcon={false}
                  showClear={false}
                />
              </div>
            )}

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration
                </label>
                <DurationPicker
                  value={formData.durationHours}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, durationHours: value }))
                  }
                />
                {hasLinkedTodo && (
                  <p className="text-xs text-slate-400 mt-1">
                    Changing this duration will also update the linked todo&apos;s duration.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <TagIcon size={14} />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {formData.tags.length > 0 ? (
                formData.tags.map((tag, index) => (
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Type tag and press Enter"
            />
            <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add a tag</p>
          </div>

          {/* Recurring */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    recurring: checked,
                    recurrenceEndDate: checked ? prev.recurrenceEndDate : ''
                  }));
                  if (!checked) {
                    setShowRecurrencePicker(false);
                  }
                }}
                className="w-4 h-4 text-indigo-500 border-slate-300 rounded focus:ring-indigo-400"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                <Repeat size={14} />
                Recurring event
              </label>
            </div>

            {formData.recurring && (
              <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                <div className="relative" ref={recurrencePickerRef}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Repeat
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecurrencePicker((prev) => !prev)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 flex items-center justify-between hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <span>
                      {RECURRENCE_OPTIONS.find((opt) => opt.value === formData.recurrenceType)?.label || 'Select'}
                    </span>
                    <ChevronRight size={16} className={`transition-transform ${showRecurrencePicker ? 'rotate-90' : ''}`} />
                  </button>
                  {showRecurrencePicker && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-30">
                      {RECURRENCE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, recurrenceType: option.value }));
                            setShowRecurrencePicker(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            formData.recurrenceType === option.value
                              ? 'bg-indigo-50 text-indigo-600 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Repeat (optional)
                  </label>
                  <DatePicker
                    value={formData.recurrenceEndDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, recurrenceEndDate: date }))}
                    onClear={() => setFormData(prev => ({ ...prev, recurrenceEndDate: '' }))}
                    minDate={formData.startDate}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              {loading ? 'Saving...' : 'Save'}
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

export default EventModal;
