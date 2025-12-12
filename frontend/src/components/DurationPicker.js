import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export const DEFAULT_DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
  { value: 1, label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' }
];

const DurationPicker = ({
  value,
  onChange,
  options = DEFAULT_DURATION_OPTIONS,
  className = '',
  allowEmpty = false,
  placeholder = 'Select duration',
  clearLabel = 'No duration'
}) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const normalizedValue = useMemo(() => {
    if (allowEmpty && (value === null || value === undefined || value === '')) {
      return null;
    }
    if (value === '' || value === null || value === undefined) {
      return options[0]?.value ?? null;
    }
    return Number(value);
  }, [value, allowEmpty, options]);

  const selectedOption = useMemo(() => {
    if (allowEmpty && (value === null || value === undefined || value === '')) {
      return null;
    }
    const match = options.find((option) => Number(option.value) === Number(normalizedValue));
    return match || null;
  }, [value, normalizedValue, options, allowEmpty]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`relative w-full ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden">
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => {
                  onChange?.(null);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  value === null || value === undefined || value === ''
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {clearLabel}
              </button>
            )}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  Number(option.value) === Number(selectedOption?.value)
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DurationPicker;
