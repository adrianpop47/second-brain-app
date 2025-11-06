import { useState, useRef, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

const TimePicker = ({ 
  value, 
  onChange, 
  onClear, 
  showClear = true, 
  disabled = false,
  showIcon = true
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const pickerRef = useRef(null);

  // Parse existing value when component mounts or value changes
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setSelectedPeriod(period);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Ensure picker closes when component becomes disabled
  useEffect(() => {
    if (disabled && showPicker) {
      setShowPicker(false);
    }
  }, [disabled, showPicker]);

  const formatTime = (hour, minute, period) => {
    const paddedHour = hour.toString().padStart(2, '0');
    const paddedMinute = minute.toString().padStart(2, '0');
    return `${paddedHour}:${paddedMinute} ${period}`;
  };

  const handleConfirm = () => {
    // Convert to 24-hour format for storage
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    
    const time24 = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(time24);
    setShowPicker(false);
  };

  const displayValue = value ? formatTime(selectedHour, selectedMinute, selectedPeriod) : 'Select time';

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="relative w-full" ref={pickerRef}>
      {/* Input Display */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setShowPicker(!showPicker);
            }
          }}
          disabled={disabled}
          className={`flex-1 border rounded-lg px-3 py-2.5 text-sm text-left flex items-center gap-2 transition-colors ${
            disabled
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
          }`}
        >
          {showIcon && (
            <Clock size={16} className={disabled ? 'text-slate-300' : 'text-slate-400'} />
          )}
          <span>{displayValue}</span>
        </button>
        
        {showClear && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
            title="Clear time"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Picker Dropdown */}
      {showPicker && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-56">
          <div className="flex gap-2 mb-3">
            {/* Hours Column */}
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-600 mb-2 text-center">Hour</div>
              <div className="max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 rounded-lg border border-slate-200">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setSelectedHour(hour)}
                    className={`w-full py-2 text-sm transition-colors ${
                      selectedHour === hour
                        ? 'bg-indigo-500 text-white font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-600 mb-2 text-center">Min</div>
              <div className="max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 rounded-lg border border-slate-200">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => setSelectedMinute(minute)}
                    className={`w-full py-2 text-sm transition-colors ${
                      selectedMinute === minute
                        ? 'bg-indigo-500 text-white font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Column */}
            <div className="w-16">
              <div className="text-xs font-medium text-slate-600 mb-2 text-center">Period</div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={`w-full py-2 text-sm rounded-lg transition-colors ${
                    selectedPeriod === 'AM'
                      ? 'bg-indigo-500 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={`w-full py-2 text-sm rounded-lg transition-colors ${
                    selectedPeriod === 'PM'
                      ? 'bg-indigo-500 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
