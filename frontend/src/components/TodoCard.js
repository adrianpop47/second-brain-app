import { useState } from 'react';
import { MoreVertical, Trash2, Calendar, CalendarPlus, Clock, Flag, Tag, Edit2 } from 'lucide-react';
import { isOverdue as isTodoOverdue } from '../utils/todoUtils';

const TodoCard = ({ 
  todo, 
  onDeleteTodo, 
  onEditRequest,
  onAddToCalendarRequest
}) => {
  const [showMenu, setShowMenu] = useState(false);

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

  const isOverdue = isTodoOverdue(todo.dueDate, todo.dueTime, todo.status);
  const formattedDueDate = todo.dueDate
    ? new Date(`${todo.dueDate}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    : '';
  const formattedDueTime = todo.dueTime
    ? new Date(`1970-01-01T${todo.dueTime}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })
    : '';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white rounded-lg p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all cursor-move group"
    >
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
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    onEditRequest?.(todo);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-sm text-slate-700"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onAddToCalendarRequest?.(todo);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 whitespace-nowrap"
                >
                  <CalendarPlus size={14} />
                  Add to Calendar
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
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${priorityColors[todo.priority]}`}>
            <Flag size={10} className={priorityIcons[todo.priority]} />
            <span className="text-xs font-medium capitalize">{todo.priority}</span>
          </div>
          {isOverdue && (
            <span className="px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold uppercase tracking-wide">
              Overdue
            </span>
          )}
        </div>

        {(todo.dueDate || todo.dueTime) && (
          <div
            className={`flex items-center gap-3 text-xs ${
              isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-slate-500'} />
              <span>{formattedDueDate || 'No due date'}</span>
            </span>
            {formattedDueTime && (
              <span className="flex items-center gap-1">
                <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-slate-500'} />
                <span>{formattedDueTime}</span>
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default TodoCard;
