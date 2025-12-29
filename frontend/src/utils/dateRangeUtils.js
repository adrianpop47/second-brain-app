const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const getRangeBounds = (range) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (range) {
    case 'day':
      return { start: todayStart, end: todayEnd };
    case 'week': {
      const start = new Date(todayStart);
      const day = start.getDay();
      const diff = (day + 6) % 7; // move back to Monday
      start.setDate(start.getDate() - diff);
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = endOfDay(new Date(now.getFullYear(), 11, 31));
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
};

export const isWithinRange = (value, start, end) => {
  if (!value) return false;
  if (!start && !end) return true;

  const normalized =
    typeof value === 'string' && !value.includes('T') ? `${value}T00:00:00` : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

export const formatDateParam = (date) => (date ? date.toISOString().split('T')[0] : null);
