import { useState } from 'react';
import { ChevronRight, Repeat as RepeatIcon } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthView = ({
  currentDate,
  events,
  onEventClick = () => {},
  onDayClick = () => {},
  focusedEventId = null
}) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Get month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // First day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Get today
  const today = new Date();
  const isToday = (day) => {
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => {
      // Parse the event's start date without timezone conversion
      const eventDateStr = event.startDate.split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  // Create calendar grid (7x6 = 42 cells)
  const calendarCells = [];
  let dayCounter = 1;

  for (let week = 0; week < 6; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellIndex = week * 7 + dayOfWeek;
      
      if (cellIndex < startingDayOfWeek || dayCounter > daysInMonth) {
        // Empty cell (before month starts or after month ends)
        calendarCells.push({
          key: `empty-${cellIndex}`,
          isEmpty: true,
          day: null
        });
      } else {
        // Active day cell
        const day = dayCounter;
        const dayEvents = getEventsForDay(day);
        
        calendarCells.push({
          key: `day-${day}`,
          isEmpty: false,
          day: day,
          isToday: isToday(day),
          events: dayEvents
        });
        
        dayCounter++;
      }
    }
  }

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
      if (onDayClick) {
        onDayClick(day);
      }
    }
  };

  const getDayEvents = () => {
    if (!selectedDay) return [];
    return getEventsForDay(selectedDay);
  };

  const selectedDayEvents = getDayEvents();

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell) => {
            if (cell.isEmpty) {
              return (
                <div
                  key={cell.key}
                  className="aspect-square border-r border-b border-slate-100 bg-slate-25"
                />
              );
            }

            const isSelected = selectedDay === cell.day;
            const hasEvents = cell.events.length > 0;
            const visibleEvents = cell.events.slice(0, 3);
            const remainingCount = cell.events.length - visibleEvents.length;

            return (
              <button
                key={cell.key}
                onClick={() => handleDayClick(cell.day)}
                className={`aspect-square border-r border-b border-slate-100 p-1.5 sm:p-2 text-left hover:bg-slate-50 transition-colors relative ${
                  isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset' : ''
                } ${cell.isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Day number */}
                <div className={`text-sm font-medium mb-1 ${
                  cell.isToday
                    ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white'
                    : 'text-slate-700'
                }`}>
                  {cell.day}
                </div>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => {
                      const isFocused = focusedEventId === event.id;
                      const startDate = new Date(event.startDate);
                      const timeStr = event.allDay ? 'All day' : startDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      });
                      
                      return (
                        <div
                          key={event.id}
                          className={`text-xs truncate px-1 py-0.5 rounded font-medium cursor-pointer flex items-center justify-between gap-1 ${
                            isFocused
                              ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) {
                              onEventClick(event);
                            }
                          }}
                          title={`${event.title}${timeStr ? ` • ${timeStr}` : ''}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {event.allDay ? '●' : '○'} {event.title}
                          </span>
                          <span className="text-[10px] whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                            {timeStr}
                            {event.recurring && <RepeatIcon size={10} className="text-slate-500" />}
                          </span>
                        </div>
                      );
                    })}
                    
                    {remainingCount > 0 && (
                      <div className="text-xs text-slate-500 font-medium px-1">
                        +{remainingCount} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events Panel */}
      {selectedDay && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">
              {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-2">
                    {selectedDayEvents.map((event) => {
                      const isFocused = focusedEventId === event.id;
                      const startDate = new Date(event.startDate);
                      const startTime = event.allDay ? 'All day' : startDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border group ${
                      isFocused ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-800 truncate">
                            {event.title}
                          </h4>
                          {event.completed && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
                              Done
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            {startTime}
                            {event.recurring && <RepeatIcon size={12} className="text-slate-500" />}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthView;
