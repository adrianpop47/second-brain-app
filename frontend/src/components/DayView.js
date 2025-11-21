import { useMemo, useEffect, useRef } from 'react';
import { Repeat as RepeatIcon } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: `${String(hour).padStart(2, '0')}:00`
}));

const MINUTES_IN_DAY = 24 * 60;
const MIN_BLOCK_MINUTES = 30;
const HOUR_BLOCK_HEIGHT = 56; // pixels per hour block
const DEFAULT_START_HOUR = 8;
const ALL_DAY_ROW_HEIGHT = HOUR_BLOCK_HEIGHT / 2;
const EVENT_GAP_PX = 2;

const getEventKey = (startDate = '') =>
  startDate && startDate.includes('T') ? startDate.split('T')[0] : startDate;

const formatTimeRange = (event) => {
  if (!event || !event.startDate) return '';
  if (event.allDay) return 'All day';

  const start = new Date(event.startDate);
  if (Number.isNaN(start.getTime())) return '';

  let end = null;
  if (event.endDate) {
    end = new Date(event.endDate);
    if (Number.isNaN(end.getTime())) {
      end = null;
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

const buildTimedBlocks = (events, currentDate) => {
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const clampWithinDay = (dateObj) => {
    if (!dateObj) return null;
    if (dateObj < dayStart) return new Date(dayStart);
    if (dateObj > dayEnd) return new Date(dayEnd);
    return dateObj;
  };

  const blocks = events
    .map((event) => {
      if (!event.startDate) return null;
      const rawStart = new Date(event.startDate);
      if (Number.isNaN(rawStart.getTime())) return null;

      let rawEnd = null;
      if (event.endDate) {
        const parsedEnd = new Date(event.endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          rawEnd = parsedEnd;
        }
      }

      if (!rawEnd) {
        const durationHours = event.durationHours || 1;
        rawEnd = new Date(rawStart.getTime() + durationHours * 60 * 60 * 1000);
      }

      const startDate = clampWithinDay(rawStart);
      const endDate = clampWithinDay(rawEnd);
      if (!startDate || !endDate) return null;

      let startMinutes = Math.max(
        0,
        Math.round((startDate.getTime() - dayStart.getTime()) / 60000)
      );
      let endMinutes = Math.max(
        startMinutes + MIN_BLOCK_MINUTES,
        Math.round((endDate.getTime() - dayStart.getTime()) / 60000)
      );

      // keep within the visible day range
      const maxStart = MINUTES_IN_DAY - MIN_BLOCK_MINUTES;
      startMinutes = Math.min(startMinutes, maxStart);
      endMinutes = Math.min(Math.max(endMinutes, startMinutes + MIN_BLOCK_MINUTES), MINUTES_IN_DAY);

      return {
        event,
        startMinutes,
        endMinutes,
        durationMinutes: endMinutes - startMinutes
      };
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

const DayView = ({
  currentDate,
  events = [],
  onEventClick = () => {},
  focusedEventId = null,
  displayMode = 'timeline'
}) => {
  const dayKey = currentDate.toLocaleDateString('en-CA');

  const dayEvents = useMemo(
    () => events.filter((event) => getEventKey(event.startDate) === dayKey),
    [events, dayKey]
  );

  const allDayEvents = useMemo(
    () =>
      dayEvents
        .filter((event) => event.allDay)
        .sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [dayEvents]
  );

  const timedEvents = useMemo(
    () =>
      dayEvents
        .filter((event) => !event.allDay)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    [dayEvents]
  );

  const timedBlocks = useMemo(
    () => buildTimedBlocks(timedEvents, currentDate),
    [timedEvents, currentDate]
  );

  const minutesToPixels = (minutes) => (minutes / 60) * HOUR_BLOCK_HEIGHT;
  const trackHeight = HOURS.length * HOUR_BLOCK_HEIGHT;
  const labelsRef = useRef(null);
  const gridRef = useRef(null);
  const hasAllDay = allDayEvents.length > 0;
  const allDaySectionHeight = hasAllDay
    ? allDayEvents.length * ALL_DAY_ROW_HEIGHT + Math.max(allDayEvents.length - 1, 0) * EVENT_GAP_PX
    : 0;

  useEffect(() => {
    const targetScroll = Math.max(0, DEFAULT_START_HOUR * HOUR_BLOCK_HEIGHT);
    if (gridRef.current) {
      gridRef.current.scrollTop = targetScroll;
    }
    if (labelsRef.current) {
      labelsRef.current.scrollTop = targetScroll;
    }
  }, [dayKey]);

  useEffect(() => {
    const labelEl = labelsRef.current;
    const gridEl = gridRef.current;
    if (!labelEl || !gridEl) return;

    const handleScroll = () => {
      labelEl.scrollTop = gridEl.scrollTop;
    };

    gridEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      gridEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (dayEvents.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">No events scheduled for this day.</div>
    );
  }

  const listEvents = [
    ...allDayEvents.map((event) => ({
      event,
      isAllDay: true,
      timeLabel: 'All day'
    })),
    ...timedEvents.map((event) => ({
      event,
      isAllDay: false,
      timeLabel: formatTimeRange(event)
    }))
  ];

  if (displayMode === 'list') {
    return (
      <div className="p-4 space-y-2">
        {listEvents.map((item) => {
          const isFocused = focusedEventId === item.event.id;
          const eventTitle = (item.event.title || '').trim() || 'Untitled event';
          return (
            <button
              type="button"
              key={item.event.id}
              onClick={() => onEventClick?.(item.event)}
              className="w-full text-left"
              title={`${eventTitle} • ${item.timeLabel}`}
            >
              <div
                className={`rounded-md border px-1.5 py-1 text-xs font-medium transition-colors flex flex-col gap-1 ${
                  isFocused
                    ? 'bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-200'
                    : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{eventTitle}</span>
                  <span
                    className={`text-[11px] whitespace-nowrap font-semibold ${
                      item.isAllDay ? 'text-indigo-700' : ''
                    }`}
                  >
                    {item.timeLabel}
                  </span>
                </div>
                {item.event.description && (
                  <p className="text-[11px] text-slate-600 truncate">{item.event.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const renderEventCardContent = (event, timeLabel, isAllDay, isFocused) => {
    const title = (event.title || '').trim() || 'Untitled event';
    return (
      <div
        className={`h-full rounded-md border px-1.5 py-1 text-xs font-medium transition-colors flex flex-col justify-start gap-[2px] ${
          isFocused
            ? 'bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-200'
            : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="truncate text-sm">{title}</span>
          <span
            className={`text-[11px] whitespace-nowrap flex items-center gap-1 font-semibold ${
              isAllDay ? 'text-indigo-700' : ''
            }`}
          >
            {timeLabel}
            {event.recurring && (
              <RepeatIcon size={10} className={isFocused ? 'text-white' : 'text-indigo-500'} />
            )}
          </span>
        </div>
        {event.description && (
          <p className="text-[11px] text-slate-600 truncate">{event.description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] min-w-[640px]">
        <div className="bg-slate-50/80 flex flex-col">
          {hasAllDay && (
            <div
              className="border-b border-slate-100 bg-white"
              style={{ height: `${allDaySectionHeight}px` }}
            />
          )}
          <div ref={labelsRef} className="h-[520px] overflow-hidden">
            <div style={{ height: `${trackHeight}px` }}>
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
          </div>
        </div>
        <div className="flex flex-col">
          {hasAllDay && (
            <div
              className="relative border-b border-slate-100 bg-white"
              style={{ height: `${allDaySectionHeight}px` }}
            >
              {allDayEvents.map((event, index) => {
                const topOffset = index * (ALL_DAY_ROW_HEIGHT + EVENT_GAP_PX);
                const isFocused = focusedEventId === event.id;
                return (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    style={{
                      top: `${topOffset}px`,
                      left: `${EVENT_GAP_PX}px`,
                      width: `calc(100% - ${EVENT_GAP_PX * 2}px)`,
                      height: `${ALL_DAY_ROW_HEIGHT}px`
                    }}
                    className="absolute w-full text-left"
                    title={(event.title || '').trim() || 'Untitled event'}
                  >
                    {renderEventCardContent(event, 'All day', true, isFocused)}
                  </button>
                );
              })}
            </div>
          )}
          <div ref={gridRef} className="relative h-[520px] overflow-y-auto bg-white">
            <div style={{ height: `${trackHeight}px` }} className="relative">
              <div className="absolute inset-0 z-0 pointer-events-none">
                {HOURS.map((hour) => (
                  <div
                    key={`grid-${hour.hour}`}
                    style={{ height: `${HOUR_BLOCK_HEIGHT}px` }}
                    className="border-b border-slate-100 last:border-b-0"
                  />
                ))}
              </div>
              <div className="absolute inset-0 z-10">
                {timedBlocks.map((block) => {
                  const widthPercent = 100 / block.totalColumns;
                  const leftPercent = widthPercent * block.column;
                  const adjustedHeight = minutesToPixels(block.durationMinutes);
                  const availableHeight = trackHeight - minutesToPixels(block.startMinutes);
                  const heightPx = Math.max(28, Math.min(availableHeight, adjustedHeight) - EVENT_GAP_PX);
                  const isFocused = focusedEventId === block.event.id;
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
                      className="absolute w-full text-left"
                      title={`${(block.event.title || '').trim() || 'Untitled event'} • ${formatTimeRange(
                        block.event
                      )}`}
                    >
                      {renderEventCardContent(block.event, formatTimeRange(block.event), false, isFocused)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default DayView;
