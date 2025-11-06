/**
 * Utility functions for formatting dates and times in todos
 */

/**
 * Format a date and optional time for display
 * @param {string} dueDate - Date in YYYY-MM-DD format
 * @param {string} dueTime - Time in HH:MM format (24-hour)
 * @returns {string} Formatted date/time string
 */
export const formatDueDateTime = (dueDate, dueTime) => {
  if (!dueDate) return '';
  
  const dateObj = new Date(dueDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    return `${formattedDate} at ${formattedTime}`;
  }
  
  return formattedDate;
};

/**
 * Check if a todo is overdue
 * @param {string} dueDate - Date in YYYY-MM-DD format
 * @param {string} dueTime - Time in HH:MM format (24-hour)
 * @param {string} status - Todo status
 * @returns {boolean} True if overdue
 */
export const isOverdue = (dueDate, dueTime, status) => {
  if (!dueDate || status === 'done') return false;
  
  const now = new Date();
  
  if (dueTime) {
    // Has specific time - check datetime
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDateTime = new Date(dueDate + 'T00:00:00');
    dueDateTime.setHours(hours, minutes, 0, 0);
    return dueDateTime < now;
  } else {
    // No time - check if date is in past
    const dateObj = new Date(dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateObj < today;
  }
};