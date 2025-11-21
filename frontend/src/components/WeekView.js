import { useMemo, useState, useEffect, useRef } from 'react';

const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: `${String(hour).padStart(2, '0')}:00`
}));
const MINUTES_IN_DAY = 24 * 60;
const MIN_BLOCK_MINUTES = 30;
const HOUR_BLOCK_HEIGHT = 56;
const ALL_DAY_ROW_HEIGHT = HOUR_BLOCK_HEIGHT / 2;
const EVENT_GAP_PX = 2;
const DAY_HEADER_HEIGHT = 56;
const DEFAULT_START_HOUR = 8;

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalIsoDate = (date) => {
  const utc = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return utc.toISOString().split('T')[0];
};

const getEventDateString = (value = '') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return toLocalIsoDate(date);
};

const formatTimeRange = (event) => {
  if (!event || !event.startDate) return '';
  if (event.allDay) return 'All day';

  const start = new Date(event.startDate);
  if (Number.isNaN(start.getTime())) return '';

  let end = null;
  if (event.endDate) {
    const parsedEnd = new Date(event.endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      end = parsedEnd;
    }
  }

  if (!end) {
    const durationHours = event.durationHours || 1;
    end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  }

  const formatter = (date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${formatter(start)} – ${formatter(end)}`;
};

const buildTimedBlocks = (events, dayStartDate) => {
  const dayStart = new Date(dayStartDate);
  dayStart.setHours(0, 0, 0, 0);
  const blocks = events
    .map((event) => {
      if (!event.startDate) return null;
      const start = new Date(event.startDate);
      if (Number.isNaN(start.getTime())) return null;
      let end = null;
      if (event.endDate) {
        const parsedEnd = new Date(event.endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          end = parsedEnd;
        }
      }
      if (!end) {
        const durationHours = event.durationHours || 1;
        end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      }
      let startMinutes = Math.max(0, Math.round((start - dayStart) / 60000));
      let endMinutes = Math.max(startMinutes + MIN_BLOCK_MINUTES, Math.round((end - dayStart) / 60000));
      const maxStart = MINUTES_IN_DAY - MIN_BLOCK_MINUTES;
      startMinutes = Math.min(startMinutes, maxStart);
      endMinutes = Math.min(Math.max(endMinutes, startMinutes + MIN_BLOCK_MINUTES), MINUTES_IN_DAY);
      return { event, startMinutes, endMinutes, durationMinutes: endMinutes - startMinutes };
    })
    .filter(Boolean)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.durationMinutes - b.durationMinutes);

  const active = [];
  blocks.forEach((block) => {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].endMinutes <= block.startMinutes) {
        active.splice(i, 1);
      }
    }
    const usedColumns = active.map((item) => item.column);
    let column = 0;
    while (usedColumns.includes(column)) {
      column += 1;
    }
    block.column = column;
    block.totalColumns = Math.max(1, column + 1);
    active.push(block);
    const columnsInUse = Math.max(...active.map((item) => item.column)) + 1;
    active.forEach((item) => {
      item.totalColumns = Math.max(item.totalColumns || 1, columnsInUse);
    });
  });

  return blocks;
};

const WeekView = ({
  currentDate,
  events = [],
  onEventClick = () => {},
  focusedEventId = null,
  displayMode = 'timeline',
  onDaySelect = () => {}
}) => {
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(currentDate));
  const [hoveredDay, setHoveredDay] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    setSelectedDateKey(formatDateKey(currentDate));
  }, [currentDate]);

  const startOfWeek = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return start;
  }, [currentDate]);

  const days = useMemo(() => {
    const dayBlocks = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const isoDate = toLocalIsoDate(date);
      const dayEvents = events
        .filter((event) => getEventDateString(event.startDate) === isoDate)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      dayBlocks.push({
        date,
        isoDate,
        label: FULL_DAY_NAMES[date.getDay()],
        events: dayEvents,
        isToday: (() => {
          const now = new Date();
          return (
            now.getFullYear() === date.getFullYear() &&
            now.getMonth() === date.getMonth() &&
            now.getDate() === date.getDate()
          );
        })()
      });
    }
    return dayBlocks;
  }, [events, startOfWeek]);

  const processedDays = useMemo(
    () =>
      days.map((day) => {
        const allDayEvents = day.events.filter((event) => event.allDay);
        const timedEvents = day.events.filter((event) => !event.allDay);
        return {
          ...day,
          allDayEvents,
          timedBlocks: buildTimedBlocks(timedEvents, day.date)
        };
      }),
    [days]
  );

  const maxAllDayHeight = useMemo(
    () =>
      Math.max(
        ...processedDays.map((day) =>
          day.allDayEvents.length
            ? day.allDayEvents.length * ALL_DAY_ROW_HEIGHT +
              Math.max(day.allDayEvents.length - 1, 0) * EVENT_GAP_PX
            : 0
        ),
        0
      ),
    [processedDays]
  );

  useEffect(() => {
    const targetScroll = Math.max(0, DEFAULT_START_HOUR * HOUR_BLOCK_HEIGHT);
    if (timelineRef.current) {
      timelineRef.current.scrollTop = targetScroll;
    }
  }, [currentDate, processedDays.length]);

  const handleDaySelect = (isoDate) => {
    setSelectedDateKey((prev) => (prev === isoDate ? null : isoDate));
    const date = processedDays.find((day) => day.isoDate === isoDate)?.date;
    if (date) {
      onDaySelect?.(new Date(date));
    }
  };

  const minutesToPixels = (minutes) => (minutes / 60) * HOUR_BLOCK_HEIGHT;
  const trackHeight = HOURS.length * HOUR_BLOCK_HEIGHT;

  if (displayMode === 'list') {
    return (
      <div className="bg-white overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {processedDays.map((day) => (
            <button
              type="button"
              key={`list-header-${day.isoDate}`}
              onClick={() => handleDaySelect(day.isoDate)}
              className="py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col gap-1 items-center justify-center transition-colors hover:bg-slate-100"
            >
              {day.label}
              <span className="text-xs font-semibold text-slate-800">{day.date.getDate()}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white">
          {processedDays.map((day) => (
            <button
              type="button"
              key={`list-${day.isoDate}`}
              onClick={() => handleDaySelect(day.isoDate)}
              className={`block w-full p-3 flex flex-col min-h-[220px] text-left transition-all border-r border-b border-slate-100 last:border-r-0 hover:bg-slate-50 ${
                day.isToday ? 'bg-blue-50' : ''
              } ${selectedDateKey === day.isoDate ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
            >
              <div className="space-y-1 overflow-hidden w-full">
                {day.events.map((event) => {
                  const isFocused = focusedEventId === event.id;
                  const title = (event.title || '').trim() || 'Untitled event';
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={`text-xs px-1.5 py-1 rounded font-medium cursor-pointer w-full ${
                        isFocused
                          ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1 min-w-0">
                        {event.allDay ? '●' : '○'}
                        <span className="truncate">{title}</span>
                      </span>
                      {event.description && (
                        <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  );
                })}
                {day.events.length === 0 && <div className="flex-1" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderTimelineCard = (event, isFocused) => {
    const title = (event.title || '').trim() || 'Untitled event';
    return (
      <div
        className={`h-full rounded-md border px-1.5 py-1 text-xs font-medium transition-colors flex flex-col justify-start gap-[2px] ${
          isFocused
            ? 'bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-200'
            : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'
        }`}
      >
        <span className="truncate text-sm">{title}</span>
      </div>
    );
  };

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-hidden">
        <div className="space-y-0 w-full">
          <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
            <div
              className="bg-white border-r border-slate-200 border-b-0"
              style={{ height: `${DAY_HEADER_HEIGHT}px`, borderTop: 'none' }}
            />
            {processedDays.map((day) => (
              <button
                type="button"
                key={`header-${day.isoDate}`}
                onClick={() => onDaySelect?.(new Date(day.date))}
                className={`border-b border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-slate-100 cursor-pointer ${
                  day.isToday ? 'text-indigo-600' : 'text-slate-600'
                }`}
                style={{ height: `${DAY_HEADER_HEIGHT}px` }}
              >
                <div className="text-sm font-semibold">
                  {SHORT_DAY_NAMES[day.date.getDay()]}
                </div>
                <span className="text-slate-500 text-xs">{day.date.getDate()}</span>
              </button>
            ))}
          </div>
          {maxAllDayHeight > 0 && (
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-50">
              <div className="bg-white border-r border-slate-100 border-b-0" style={{ height: `${maxAllDayHeight}px` }} />
              {processedDays.map((day, dayIndex) => (
                <div
                  key={`allday-${day.isoDate}`}
                  className={`relative border-b border-slate-100 ${
                    dayIndex > 0 ? 'border-l border-slate-100' : ''
                  } transition-colors cursor-pointer ${
                    hoveredDay === day.isoDate ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{ height: `${maxAllDayHeight}px` }}
                  onClick={() => onDaySelect?.(new Date(day.date))}
                  onMouseEnter={() => setHoveredDay(day.isoDate)}
                  onMouseLeave={() => setHoveredDay(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onDaySelect?.(new Date(day.date));
                    }
                  }}
                >
                  {day.allDayEvents.map((event, eventIndex) => {
                    const isFocused = focusedEventId === event.id;
                    return (
                      <button
                        type="button"
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="absolute w-full text-left transition-transform hover:scale-[1.01]"
                        style={{
                          top: `${eventIndex * (ALL_DAY_ROW_HEIGHT + EVENT_GAP_PX)}px`,
                          left: `${EVENT_GAP_PX}px`,
                          width: `calc(100% - ${EVENT_GAP_PX * 2}px)`,
                          height: `${ALL_DAY_ROW_HEIGHT}px`
                        }}
                        title={(event.title || '').trim() || 'Untitled event'}
                      >
                        {renderTimelineCard(event, isFocused)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div className="relative h-[520px] overflow-y-auto" ref={timelineRef}>
            <div style={{ height: `${trackHeight}px` }}>
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                <div className="bg-slate-50/80">
                  {HOURS.map((hour) => (
                    <div
                      key={`label-${hour.hour}`}
                      style={{ height: `${HOUR_BLOCK_HEIGHT}px` }}
                      className="border-b border-slate-100 last:border-b-0 flex items-center justify-center text-xs font-semibold text-slate-500"
                    >
                      {hour.label}
                    </div>
                  ))}
                </div>
                {processedDays.map((day) => (
                  <div
                    key={`timeline-${day.isoDate}`}
                    className={`relative border-l border-slate-100 text-left transition-colors ${
                      hoveredDay === day.isoDate ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                    }`}
                    style={{ height: `${trackHeight}px`, cursor: 'pointer' }}
                    onClick={(e) => {
                      if (e.target.closest('button[data-event-card="true"]')) return;
                      onDaySelect?.(new Date(day.date));
                    }}
                    onMouseEnter={() => setHoveredDay(day.isoDate)}
                    onMouseLeave={() => setHoveredDay(null)}
                    role="presentation"
                  >
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      {HOURS.map((hour) => (
                        <div
                          key={`grid-${day.isoDate}-${hour.hour}`}
                          style={{ height: `${HOUR_BLOCK_HEIGHT}px` }}
                          className="border-b border-slate-100 last:border-b-0"
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {day.timedBlocks.map((block) => {
                        const isFocused = focusedEventId === block.event.id;
                        const widthPercent = 100 / block.totalColumns;
                        const leftPercent = widthPercent * block.column;
                        const heightPx = Math.max(28, minutesToPixels(block.durationMinutes) - EVENT_GAP_PX);
                        const timeLabel = formatTimeRange(block.event);
                        return (
                          <button
                            type="button"
                            key={block.event.id}
                            onClick={() => onEventClick?.(block.event)}
                            style={{
                              top: `${minutesToPixels(block.startMinutes)}px`,
                              height: `${heightPx}px`,
                              left: `calc(${leftPercent}% + ${EVENT_GAP_PX}px)`,
                              width: `calc(${widthPercent}% - ${EVENT_GAP_PX * 2}px)`
                            }}
                            className="absolute w-full text-left pointer-events-auto"
                            data-event-card="true"
                            title={`${(block.event.title || '').trim() || 'Untitled event'} • ${timeLabel}`}
                          >
                            {renderTimelineCard(block.event, isFocused)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
