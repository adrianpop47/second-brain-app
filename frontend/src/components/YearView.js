import { useMemo } from 'react';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const YearView = ({
  currentDate,
  events = [],
  focusedEventId = null,
  onMonthSelect = () => {},
  onDaySelect = () => {}
}) => {
  const year = currentDate.getFullYear();

  const { monthEvents, eventCounts, focusedDateKey } = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => []);
    const counts = {};
    let focusedKey = null;

    events.forEach((event) => {
      if (!event.startDate) return;
      const start = new Date(event.startDate);
      if (Number.isNaN(start.getTime())) return;
      if (start.getFullYear() !== year) return;

      const monthIdx = start.getMonth();
      byMonth[monthIdx].push(event);
      const key = getDateKey(start);
      counts[key] = (counts[key] || 0) + 1;
      if (event.id === focusedEventId) {
        focusedKey = key;
      }
    });

    byMonth.forEach((list, idx) => {
      byMonth[idx] = list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    });

    return { monthEvents: byMonth, eventCounts: counts, focusedDateKey: focusedKey };
  }, [events, focusedEventId, year]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIdx) => {
        const firstDay = new Date(year, monthIdx, 1);
        const lastDay = new Date(year, monthIdx + 1, 0);
        const startingWeekday = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const cells = [];
        for (let i = 0; i < startingWeekday; i += 1) {
          cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
          cells.push(new Date(year, monthIdx, day));
        }
        while (cells.length < 42) {
          cells.push(null);
        }

        return {
          monthIdx,
          name: firstDay.toLocaleDateString('en-US', { month: 'long' }),
          cells
        };
      }),
    [year]
  );

  const isToday = (dateObj) => {
    const today = new Date();
    return (
      today.getFullYear() === dateObj.getFullYear() &&
      today.getMonth() === dateObj.getMonth() &&
      today.getDate() === dateObj.getDate()
    );
  };

  return (
    <div className="p-4">
      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month, monthIdx) => {
          const monthList = monthEvents[monthIdx] || [];
          return (
            <div
              key={`year-month-${monthIdx}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 transition-colors hover:border-indigo-200 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => onMonthSelect(new Date(year, month.monthIdx, 1))}
                className="flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{month.name}</p>
                  <p className="text-xs text-slate-500">{monthList.length} events</p>
                </div>
              </button>
              <div>
                <div className="grid grid-cols-7 text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <span key={`${monthIdx}-${day}`} className="text-center">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-[11px]">
                  {month.cells.map((cellDate, cellIndex) => {
                    if (!cellDate) {
                      return <div key={`empty-${monthIdx}-${cellIndex}`} className="h-6" />;
                    }
                    const key = getDateKey(cellDate);
                    const count = eventCounts[key] || 0;
                    const hasFocus = focusedDateKey === key;
                    return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => onDaySelect(cellDate)}
                      className={`h-6 px-1 flex flex-col items-center justify-center rounded-md text-xs transition-colors ${
                        count
                          ? hasFocus
                            ? 'bg-indigo-500 text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="leading-none">{cellDate.getDate()}</span>
                      {count > 0 && (
                        <span className="text-[9px] font-semibold leading-none">
                          {count}
                        </span>
                      )}
                      {count === 0 && isToday(cellDate) && (
                        <span className="text-[8px] text-indigo-500 font-semibold leading-none">●</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearView;
