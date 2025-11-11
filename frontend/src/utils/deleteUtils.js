/**
 * Utility functions for handling deletions with linked items
 */

/**
 * Delete a todo with confirmation for linked events
 * @param {number} todoId - ID of the todo to delete
 * @param {object} todo - The todo object (with optional calendarEventId reference)
 * @param {function} apiService - API service instance
 * @returns {Promise<boolean>} - Returns true if deleted, false if cancelled
 */
export const deleteTodoWithConfirmation = async (todoId, todo, apiService) => {
  try {
    // Check if todo has linked calendar events
    const linkedEventId = todo.calendarEventId ?? (todo.calendarEventIds && todo.calendarEventIds[0]);
    const hasLinkedEvent = Boolean(linkedEventId);
    const confirmDelete = window.confirm(
      hasLinkedEvent
        ? 'This todo is linked to a calendar event. Delete the todo (and optionally the event)?'
        : 'Are you sure you want to delete this todo?'
    );

    if (!confirmDelete) return false;

    if (hasLinkedEvent) {
      const deleteEventToo = window.confirm(
        'Do you also want to delete the linked calendar event? (OK = Yes, Cancel = No)'
      );

      if (deleteEventToo) {
        try {
          await apiService.deleteEvent(linkedEventId);
        } catch (err) {
          console.error(`Error deleting linked event ${linkedEventId}:`, err);
        }
      } else {
        try {
          await apiService.unlinkTodoFromEvent(todoId, linkedEventId);
        } catch (err) {
          console.error(`Error unlinking event ${linkedEventId}:`, err);
        }
      }
    }

    await apiService.deleteTodo(todoId);
    return true;
  } catch (err) {
    console.error('Error deleting todo:', err);
    throw err;
  }
};

/**
 * Delete an event with confirmation for linked todos
 * @param {number} eventId - ID of the event to delete
 * @param {object} event - The event object (should have linkedTodoIds array)
 * @param {function} apiService - API service instance
 * @returns {Promise<boolean>} - Returns true if deleted, false if cancelled
 */
export const deleteEventWithConfirmation = async (eventId, event, apiService) => {
  try {
    // Check if event has linked todos
    const linkedTodoId = event.linkedTodoId ?? (event.linkedTodoIds && event.linkedTodoIds[0]);
    const hasLinkedTodo = Boolean(linkedTodoId);
    const confirmDelete = window.confirm(
      hasLinkedTodo
        ? 'This event is linked to a todo. Delete the event (and optionally the todo)?'
        : 'Are you sure you want to delete this event?'
    );

    if (!confirmDelete) return false;

    if (hasLinkedTodo && linkedTodoId) {
      const deleteTodoToo = window.confirm(
        'Do you also want to delete the linked todo? (OK = Yes, Cancel = No)'
      );

      if (deleteTodoToo) {
        try {
          await apiService.deleteTodo(linkedTodoId);
        } catch (err) {
          console.error(`Error deleting linked todo ${linkedTodoId}:`, err);
        }
      } else {
        try {
          await apiService.unlinkTodoFromEvent(linkedTodoId, eventId);
        } catch (err) {
          console.error(`Error unlinking todo ${linkedTodoId}:`, err);
        }
      }
    }

    await apiService.deleteEvent(eventId);
    return true;
  } catch (err) {
    console.error('Error deleting event:', err);
    throw err;
  }
};
