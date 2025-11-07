import { useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import TodoCard from './TodoCard';

const TodoColumn = ({ 
  title, 
  status, 
  todos, 
  onUpdateStatus, 
  onDeleteTodo, 
  onUpdateTodo,
  onEditRequest,
  onAddToCalendarRequest,
  color = 'slate' 
}) => {
  const [dragOverColumn, setDragOverColumn] = useState(false);

  const colorVariants = {
    slate: {
      header: 'bg-slate-100',
      icon: 'text-slate-600',
      count: 'bg-slate-200 text-slate-700'
    },
    amber: {
      header: 'bg-amber-100',
      icon: 'text-amber-600',
      count: 'bg-amber-200 text-amber-700'
    },
    emerald: {
      header: 'bg-emerald-100',
      icon: 'text-emerald-600',
      count: 'bg-emerald-200 text-emerald-700'
    }
  };

  const colors = colorVariants[color] || colorVariants.slate;

  const getIcon = () => {
    switch (status) {
      case 'todo':
        return <Circle size={18} className={colors.icon} />;
      case 'in_progress':
        return <Clock size={18} className={colors.icon} />;
      case 'done':
        return <CheckCircle2 size={18} className={colors.icon} />;
      default:
        return <Circle size={18} className={colors.icon} />;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOverColumn(true);
  };

  const handleDragLeave = () => {
    setDragOverColumn(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverColumn(false);
    
    const todoId = e.dataTransfer.getData('todoId');
    const fromStatus = e.dataTransfer.getData('fromStatus');
    
    if (todoId && fromStatus !== status) {
      onUpdateStatus(parseInt(todoId), status);
    }
  };

  return (
    <div 
      className={`bg-white/50 backdrop-blur-sm rounded-xl border-2 transition-all ${
        dragOverColumn 
          ? 'border-blue-400 shadow-lg' 
          : 'border-slate-200/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`${colors.header} px-4 py-3 rounded-t-xl border-b border-slate-200/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-semibold text-slate-800">{title}</h3>
          </div>
          <span className={`${colors.count} px-2 py-0.5 rounded-full text-xs font-semibold`}>
            {todos.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3 space-y-3 min-h-[400px]">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <div className={`w-12 h-12 rounded-full ${colors.header} flex items-center justify-center mx-auto mb-2`}>
              {getIcon()}
            </div>
            <p className="text-sm text-slate-500">No todos here</p>
          </div>
        ) : (
          todos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onUpdateStatus={onUpdateStatus}
              onDeleteTodo={onDeleteTodo}
              onUpdateTodo={onUpdateTodo}
              onEditRequest={onEditRequest}
              onAddToCalendarRequest={onAddToCalendarRequest}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoColumn;
