import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

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
      // Pre-fill with todo's due date/time if available
      if (todo.dueDate) {
        setEventDate(todo.dueDate);
      } else {
        // Default to today
        setEventDate(new Date().toISOString().split('T')[0]);
      }

      if (todo.dueTime) {
        setEventTime(todo.dueTime);
      } else {
        // Default time based on priority
        if (todo.priority === 'high') {
          setEventTime('09:00');
        } else if (todo.priority === 'low') {
          setEventTime('17:00');
        } else {
          setEventTime('14:00');
        }
      }
    }
  }, [showModal, todo]);

  if (!showModal || !todo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventDate || !eventTime) {
      alert('Date and time are required');
      return;
    }

    setLoading(true);
    
    try {
      await onAdd({
        date: eventDate,
        time: eventTime,
        duration: duration
      });
      
      // Reset and close
      setEventDate('');
      setEventTime('');
      setDuration(1);
      setShowModal(false);
    } catch (err) {
      console.error('Error adding to calendar:', err);
      alert('Failed to add to calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEventDate('');
    setEventTime('');
    setDuration(1);
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Add to Calendar</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Todo Info */}
        <div className="mb-5 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="font-medium text-slate-800 text-sm">{todo.title}</p>
          {todo.description && (
            <p className="text-xs text-slate-600 mt-1">{todo.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              todo.priority === 'high' ? 'bg-red-100 text-red-700' :
              todo.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {todo.priority}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Calendar size={14} />
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Clock size={14} />
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Suggested: {todo.priority === 'high' ? '9:00 AM (High priority)' : 
                         todo.priority === 'low' ? '5:00 PM (Low priority)' : 
                         '2:00 PM (Medium priority)'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            >
              <option value={0.5}>30 minutes</option>
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>📅 Calendar Event Preview:</strong><br/>
              {eventDate && eventTime && (
                <>
                  {new Date(eventDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })} at {eventTime} ({duration}h)
                </>
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
          >
            {loading ? 'Adding...' : 'Add to Calendar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTodoToCalendarModal;