import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import DurationPicker from './DurationPicker';
import { showAppAlert } from '../utils/alertService';

const getDefaultTimeForPriority = (priority = 'medium') => {
  if (priority === 'high') return '09:00';
  if (priority === 'low') return '17:00';
  return '14:00';
};

const getStartFromTodo = (todo, durationHours) => {
  const durationMs = Math.max(Number(durationHours) || 1, 0.5) * 60 * 60 * 1000;
  let endDateTime;
  if (todo.dueDate) {
    const timeStr = todo.dueTime || getDefaultTimeForPriority(todo.priority);
    endDateTime = new Date(`${todo.dueDate}T${timeStr}`);
  } else {
    const fallback = new Date();
    const [hour, minute] = getDefaultTimeForPriority(todo.priority)
      .split(':')
      .map(Number);
    fallback.setHours(hour, minute, 0, 0);
    endDateTime = fallback;
  }
  const startDateTime = new Date(endDateTime.getTime() - durationMs);
  return {
    startDateTime,
    endDateTime
  };
};

const getTodoEndDateTime = (todo) => {
  if (!todo?.dueDate) return null;
  const timeStr = todo.dueTime || getDefaultTimeForPriority(todo.priority);
  const due = new Date(`${todo.dueDate}T${timeStr}`);
  if (Number.isNaN(due.getTime())) return null;
  return due;
};

const formatInputDate = (dateObj) => {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
  const day = `${dateObj.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatInputTime = (dateObj) => {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  const hours = `${dateObj.getHours()}`.padStart(2, '0');
  const minutes = `${dateObj.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const AddTodoToCalendarModal = ({ showModal, setShowModal, todo, onAdd }) => {
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const durationValue = Number(duration) || 0;
  const safeDurationHours = durationValue > 0 ? durationValue : 1;

  const formatDateLabel = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

  const formatTimeLabel = (date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    if (!showModal || !todo) return;
    const todoDurationHours =
      typeof todo.durationHours === 'number' && todo.durationHours > 0
        ? todo.durationHours
        : typeof todo.durationMinutes === 'number' && todo.durationMinutes > 0
          ? todo.durationMinutes / 60
          : null;
    const resolvedDuration = todoDurationHours || 1;
    setDuration(resolvedDuration);

    const defaults = getStartFromTodo(todo, resolvedDuration);
    if (defaults?.startDateTime && !Number.isNaN(defaults.startDateTime.getTime())) {
      setStartDate(formatInputDate(defaults.startDateTime));
      setStartTime(formatInputTime(defaults.startDateTime));
    } else {
      setStartDate('');
      setStartTime('');
    }
  }, [showModal, todo]);

  const previewRange = useMemo(() => {
    if (!startDate || !startTime) return null;
    const start = new Date(`${startDate}T${startTime}`);
    if (Number.isNaN(start.getTime())) return null;

    const durationMs = safeDurationHours * 60 * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);
    return {
      startDateTime: start,
      endDateTime: end
    };
  }, [startDate, startTime, safeDurationHours]);

  const dueDisplayDateTime = todo ? getTodoEndDateTime(todo) : null;

  if (!showModal || !todo) return null;

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !startTime) {
      showAppAlert('Start date and time are required');
      return;
    }
    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (Number.isNaN(startDateTime.getTime())) {
      showAppAlert('Invalid start date or time');
      return;
    }
    const dateStr = formatInputDate(startDateTime);
    const timeStr = formatInputTime(startDateTime);

    setLoading(true);

    try {
      await onAdd({
        date: dateStr,
        time: timeStr,
        duration: safeDurationHours
      });
      setShowModal(false);
    } catch (err) {
      console.error('Error adding to calendar:', err);
      showAppAlert('Failed to add to calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Add to Calendar</h3>
            <p className="text-sm text-slate-500 mt-1">
              Schedule this todo with a clear time block.
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

        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="font-medium text-slate-800 text-sm">{todo.title}</p>
          {todo.description && (
            <p className="text-xs text-slate-600 mt-1">{todo.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                todo.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : todo.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {todo.priority}
            </span>
          </div>
          {dueDisplayDateTime && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mt-2">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-slate-500" />
                {formatDateLabel(dueDisplayDateTime)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-slate-500" />
                {formatTimeLabel(dueDisplayDateTime)}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Calendar size={14} />
              Start Date
            </label>
            <DatePicker value={startDate} onChange={setStartDate} showClear={false} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Clock size={14} />
              Start Time
            </label>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              onClear={() => setStartTime('')}
              showIcon={false}
              showClear={false}
            />
            <p className="text-xs text-slate-500 mt-1">
              {previewRange
                ? `Event will start at ${formatTimeLabel(previewRange.startDateTime)} and finish at ${formatTimeLabel(previewRange.endDateTime)}.`
                : 'Adjust start time to control when the event begins. The todo due time updates automatically.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration
            </label>
            <DurationPicker value={duration} onChange={setDuration} />
            <p className="text-xs text-slate-500 mt-1">
              This will also update the todo&apos;s duration so both stay aligned.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800 flex items-center gap-1 font-semibold mb-1">
              <Calendar size={12} />
              <span>Calendar Event Preview</span>
            </div>
            {previewRange ? (
              <p className="text-xs text-blue-700">
                {formatDateLabel(previewRange.endDateTime)} · {formatTimeLabel(previewRange.startDateTime)} –{' '}
                {formatTimeLabel(previewRange.endDateTime)} ({safeDurationHours}h)
              </p>
            ) : (
              <p className="text-xs text-blue-600">Select a date and time to see the preview.</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              {loading ? 'Adding...' : 'Add to Calendar'}
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

export default AddTodoToCalendarModal;
