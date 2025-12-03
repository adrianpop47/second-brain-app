import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import TimePicker from './TimePicker';
import DatePicker from './DatePicker';
import DurationPicker from './DurationPicker';
import { showAppAlert } from '../utils/alertService';

const AddTodoToCalendarModal = ({
  showModal,
  setShowModal,
  todo,
  onAdd
}) => {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal && todo) {
      if (todo.dueDate) {
        setEventDate(todo.dueDate);
      } else {
        setEventDate(new Date().toISOString().split('T')[0]);
      }

      if (todo.dueTime) {
        setEventTime(todo.dueTime);
      } else if (todo.priority === 'high') {
        setEventTime('09:00');
      } else if (todo.priority === 'low') {
        setEventTime('17:00');
      } else {
        setEventTime('14:00');
      }

      setDuration(1);
    }
  }, [showModal, todo]);

  if (!showModal || !todo) return null;

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventDate || !eventTime) {
      showAppAlert('Date and time are required');
      return;
    }

    setLoading(true);

    try {
      await onAdd({
        date: eventDate,
        time: eventTime,
        duration
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Calendar size={14} />
              Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={eventDate}
              onChange={setEventDate}
              minDate={new Date().toISOString().split('T')[0]}
              showClear={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Clock size={14} />
              Time <span className="text-red-500">*</span>
            </label>
            <TimePicker
              value={eventTime}
              onChange={(time) => setEventTime(time)}
              onClear={() => setEventTime('')}
              showIcon={false}
              showClear={false}
            />
            <p className="text-xs text-slate-500 mt-1">
              Suggested: {todo.priority === 'high'
                ? '9:00 AM (High priority)'
                : todo.priority === 'low'
                  ? '5:00 PM (Low priority)'
                  : '2:00 PM (Medium priority)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration
            </label>
            <DurationPicker value={duration} onChange={setDuration} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800 flex items-center gap-1 font-semibold mb-1">
              <Calendar size={12} />
              <span>Calendar Event Preview</span>
            </div>
            {eventDate && eventTime ? (
              <p className="text-xs text-blue-700">
                {new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}{' '}
                at {eventTime} ({duration}h)
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
