import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthView = ({
  currentDate,
  events,
  onEventClick = () => {},
  onDayClick = () => {},
  focusedEventId = null,
  onDaySelect = () => {}
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
    if (!day) return;
    setSelectedDay(day);
    onDayClick?.(day);
    const dateObj = new Date(year, month, day);
    onDaySelect?.(dateObj);
  };

  const getMaxVisibleEvents = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 600) return 0;
    if (width < 1100) return 1;
    if (width < 1500) return 2;
    return 3;
  };

  const [maxVisibleEvents, setMaxVisibleEvents] = useState(getMaxVisibleEvents);

  useEffect(() => {
    const handleResize = () => {
      setMaxVisibleEvents(getMaxVisibleEvents());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="bg-white overflow-hidden">
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
            const visibleEvents = cell.events.slice(0, maxVisibleEvents);
            const remainingCount = cell.events.length - visibleEvents.length;

            return (
              <button
                key={cell.key}
                onClick={() => handleDayClick(cell.day)}
                className={`aspect-square border-r border-b border-slate-100 p-1.5 sm:p-2 text-left hover:bg-slate-50 transition-colors relative flex flex-col ${
                  isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset' : ''
                } ${cell.isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Day number */}
                <div
                  className={`text-sm font-medium ${
                    cell.isToday
                      ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white'
                      : 'text-slate-700'
                  }`}
                >
                  {cell.day}
                </div>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="mt-2 space-y-0.5 flex-1 overflow-hidden w-full">
                    {visibleEvents.map((event) => {
                      const isFocused = focusedEventId === event.id;
                      const eventTitle = (event.title || '').trim() || 'Untitled event';
                      return (
                        <div
                          key={event.id}
                          className={`w-full text-left text-xs px-1.5 py-1 rounded font-medium ${
                            isFocused
                              ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onEventClick?.(event);
                            }
                          }}
                          title={eventTitle}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {event.allDay ? '●' : '○'}
                            <span className="truncate">{eventTitle}</span>
                          </div>
                        </div>
                      );
                    })}

                    {(remainingCount > 0 || maxVisibleEvents === 0) && (
                      <div className="text-xs text-slate-500 font-medium px-1.5">
                        +{remainingCount > 0 ? remainingCount : cell.events.length} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default MonthView;
