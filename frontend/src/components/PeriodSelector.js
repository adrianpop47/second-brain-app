import { useState, useRef, useEffect } from 'react';
import { CalendarRange, ChevronDown } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: '7 Days' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' }
];

const PeriodSelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = PERIOD_OPTIONS.find((option) => option.value === value) || PERIOD_OPTIONS[0];

  return (
    <div className="relative w-full sm:w-56" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium text-slate-700 text-left flex items-center justify-between gap-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <CalendarRange size={16} className="text-slate-400" />
          {selected.label}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                value === option.value
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;
