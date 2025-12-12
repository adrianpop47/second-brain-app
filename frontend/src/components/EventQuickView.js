import { X, Calendar as CalendarIcon, Clock, Tag as TagIcon, MoreVertical, Repeat as RepeatIcon, Edit3, Trash2, Unlink, Link as LinkIcon, Timer } from 'lucide-react';
import { useState } from 'react';

const formatDate = (isoString) => {
  if (!isoString) return 'No date';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (isoString, allDay) => {
  if (allDay) return 'All day';
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatDuration = (event) => {
  if (!event) return '';
  if (event.allDay) return 'All day';

  let durationHours = typeof event.durationHours === 'number' ? event.durationHours : null;

  if (durationHours === null && event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
  }

  if (!durationHours || durationHours <= 0) return '';

  const totalMinutes = Math.round(durationHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Less than 1m';
};

const EventQuickView = ({
  event,
  onClose,
  onEdit,
  onDelete,
  onUnlink,
  onViewLinkedTodo,
  onToggleComplete
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!event) return null;
  const durationText = formatDuration(event);

  const linkedTodoId = event.linkedTodoId ?? (event.linkedTodoIds && event.linkedTodoIds[0]);

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative mt-12">
        <div className="flex items-start justify-between p-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 truncate">{event.title}</h3>
            <p className="text-xs text-slate-500 mt-1 truncate">{event.contextName || 'Event details'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[160px] z-10">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit?.(event);
                    }}
                  >
                    <Edit3 size={14} />
                    Edit Event
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(event);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Event
                  </button>
                  {linkedTodoId && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onUnlink?.(event);
                      }}
                    >
                      <Unlink size={14} />
                      Unlink Todo
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <CalendarIcon size={16} className="text-slate-500" />
            <div>
              <p>{formatDate(event.startDate)}</p>
              {event.recurrenceEndDate && (
                <p className="text-xs text-slate-500">Until {formatDate(event.recurrenceEndDate)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Clock size={16} className="text-slate-500" />
            <span>{formatTime(event.startDate, event.allDay)}</span>
          </div>

          {durationText && (
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Timer size={16} className="text-slate-500" />
              <span>{durationText}</span>
            </div>
          )}

          {event.recurring && (
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <RepeatIcon size={16} className="text-slate-500" />
              <span className="capitalize">{event.recurrenceType || 'Recurring'}</span>
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <TagIcon size={12} />
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {linkedTodoId && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <LinkIcon size={14} />
                Linked Todo
              </p>
              <button
                type="button"
                onClick={() => onViewLinkedTodo?.(event)}
                className="w-full text-left text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View linked todo
              </button>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100">
            <label
              htmlFor={`event-complete-${event.id}`}
              className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer select-none"
            >
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  event.completed ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    event.completed ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
              Mark as complete
            </label>
            <input
              id={`event-complete-${event.id}`}
              type="checkbox"
              className="sr-only"
              checked={Boolean(event.completed)}
              onChange={() => onToggleComplete?.(event, !event.completed)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventQuickView;
