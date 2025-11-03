const StatCard = ({ icon: Icon, label, value, variant = 'default', onClick, comingSoon = false }) => {
  const variants = {
    default: 'bg-white/70 backdrop-blur-sm border border-slate-200/50',
    income: 'bg-white/70 backdrop-blur-sm border border-slate-200/50',
    expense: 'bg-white/70 backdrop-blur-sm border border-slate-200/50',
    balance: 'bg-white/70 backdrop-blur-sm border border-slate-200/50',
    todos: 'bg-white/70 backdrop-blur-sm border border-slate-200/50',
    action: 'bg-indigo-500 hover:bg-indigo-600 cursor-pointer'
  };

  const iconBgColors = {
    income: 'bg-emerald-100/80',
    expense: 'bg-rose-100/80',
    balance: 'bg-indigo-100/80',
    todos: 'bg-blue-100/80',
    action: 'bg-white/20',
    default: 'bg-slate-100/80'
  };

  const iconColors = {
    income: 'text-emerald-600',
    expense: 'text-rose-600',
    balance: 'text-indigo-600',
    todos: 'text-blue-600',
    action: 'text-white',
    default: 'text-slate-600'
  };

  const labelColors = {
    action: 'text-white/90',
    default: 'text-slate-600'
  };

  const valueColors = {
    action: 'text-white',
    default: 'text-slate-800'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`${variants[variant]} rounded-xl p-3 sm:p-4 shadow-sm ${
        onClick ? 'transition-all hover:shadow text-left' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 ${iconBgColors[variant] || iconBgColors.default} rounded-lg`}>
          <Icon size={14} className={`${iconColors[variant] || iconColors.default} sm:w-4 sm:h-4`} />
        </div>
        <span className={`text-xs font-medium ${labelColors[variant] || labelColors.default}`}>
          {label}
        </span>
      </div>
      <p className={`text-lg sm:text-2xl font-semibold ${valueColors[variant] || valueColors.default}`}>
        {value}
      </p>
      {comingSoon && (
        <p className="text-xs text-slate-500 mt-1">Coming soon</p>
      )}
    </Component>
  );
};

export default StatCard;