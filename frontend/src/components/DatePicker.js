import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseISODate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) return null;
  return new Date(year, month - 1, day);
};

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  const parsed = parseISODate(dateStr);
  if (!parsed) return 'Select date';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DatePicker = ({
  value,
  onChange,
  onClear,
  showClear = true,
  disabled = false,
  minDate,
  placeholder = 'Select date',
  showIcon = false
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISODate(value) || new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const pickerRef = useRef(null);
  const minDateObj = parseISODate(minDate);

  useEffect(() => {
    if (value) {
      const parsed = parseISODate(value);
      if (parsed) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const leadingBlanks = startOfMonth.getDay();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const isBeforeMinDate = (date) => {
    if (!minDateObj) return false;
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedMin = new Date(
      minDateObj.getFullYear(),
      minDateObj.getMonth(),
      minDateObj.getDate()
    );
    return normalizedDate < normalizedMin;
  };

    const handleSelectDate = (day) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (isBeforeMinDate(selectedDate)) return;
    const iso = toISODate(selectedDate);
    onChange(iso);
    setOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - leadingBlanks + 1;
    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    cells.push({
      label: cellDate.getDate(),
      key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
      inCurrentMonth,
      disabled: !inCurrentMonth || isBeforeMinDate(new Date(cellDate)),
      iso: toISODate(cellDate)
    });
  }

  const displayText = value ? formatDisplayDate(value) : placeholder;

  return (
    <div className="relative w-full" ref={pickerRef}>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={`flex-1 border rounded-lg px-3 py-2.5 text-sm text-left flex items-center gap-2 transition-colors ${
            disabled
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
          }`}
        >
          {showIcon && (
            <Calendar size={16} className={disabled ? 'text-slate-300' : 'text-slate-400'} />
          )}
          <span>{displayText}</span>
        </button>

        {showClear && value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onClear?.();
              setOpen(false);
            }}
            className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
            title="Clear date"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-64">
          <div className="flex items-center justify-between mb-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                )
              }
              className="p-1.5 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMonthPicker((prev) => !prev);
                  setShowYearPicker(false);
                }}
                className="text-sm font-semibold text-slate-800 hover:text-indigo-500 transition-colors"
              >
                {viewDate.toLocaleDateString('en-US', { month: 'long' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowYearPicker((prev) => !prev);
                  setShowMonthPicker(false);
                }}
                className="text-sm font-semibold text-slate-800 hover:text-indigo-500 transition-colors"
              >
                {viewDate.getFullYear()}
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                )
              }
              className="p-1.5 rounded-lg hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {showMonthPicker && (
            <div className="grid grid-cols-3 gap-1 mb-3">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setViewDate(
                      new Date(viewDate.getFullYear(), idx, 1)
                    );
                    setShowMonthPicker(false);
                  }}
                  className={`py-1.5 rounded-lg text-sm ${
                    viewDate.getMonth() === idx
                      ? 'bg-indigo-500 text-white font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {showYearPicker && (
            <div className="mb-3 max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
              {Array.from({ length: 11 }, (_, i) => viewDate.getFullYear() - 5 + i).map(
                (year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(year, viewDate.getMonth(), 1));
                      setShowYearPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${
                      viewDate.getFullYear() === year
                        ? 'bg-indigo-500 text-white font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {year}
                  </button>
                )
              )}
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-slate-500 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-sm">
            {cells.map(({ key, label, inCurrentMonth, disabled: cellDisabled, iso }) => {
              const isSelected = value === iso;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={cellDisabled}
                  onClick={() => inCurrentMonth && handleSelectDate(label)}
                  className={`h-8 rounded-lg transition-colors ${
                    cellDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-indigo-500 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                  } ${!inCurrentMonth ? 'opacity-60' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
