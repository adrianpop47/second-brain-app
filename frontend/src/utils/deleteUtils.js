import { confirmAction } from './confirmService';

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
    if (hasLinkedEvent) {
      const selection = await confirmAction({
        title: 'Linked calendar event',
        message: 'This todo is linked to a calendar event. Choose what you want to remove.',
        options: [
          { label: 'Delete Todo only', value: 'todo-only' },
          { label: 'Delete both', value: 'both', tone: 'danger' }
        ],
        cancelLabel: 'Cancel',
        tone: 'danger'
      });

      if (!selection) return false;

      let preserveTime = false;
      if (selection === 'both') {
        try {
          await apiService.deleteEvent(linkedEventId);
        } catch (err) {
          console.error(`Error deleting linked event ${linkedEventId}:`, err);
          throw err;
        }
      } else {
        try {
          await apiService.unlinkTodoFromEvent(todoId, linkedEventId, { keepEvent: true });
        } catch (err) {
          console.error(`Error unlinking event ${linkedEventId}:`, err);
          throw err;
        }
        preserveTime = true;
      }

      await apiService.deleteTodo(todoId, { preserveTime });
      return true;
    }

    const confirmDelete = await confirmAction({
      title: 'Delete todo?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });

    if (!confirmDelete) return false;

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
    if (hasLinkedTodo && linkedTodoId) {
      const selection = await confirmAction({
        title: 'Linked todo',
        message: 'This event is linked to a todo. Choose what you want to remove.',
        options: [
          { label: 'Delete Event only', value: 'event-only' },
          { label: 'Delete both', value: 'both', tone: 'danger' }
        ],
        cancelLabel: 'Cancel',
        tone: 'danger'
      });

      if (!selection) return false;

      if (selection === 'both') {
        try {
          await apiService.deleteTodo(linkedTodoId);
        } catch (err) {
          console.error(`Error deleting linked todo ${linkedTodoId}:`, err);
          throw err;
        }
        await apiService.deleteEvent(eventId);
      } else {
        await apiService.deleteEvent(eventId, { preserveTime: true });
      }
      return true;
    }

    const confirmDelete = await confirmAction({
      title: 'Delete event?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });

    if (!confirmDelete) return false;

    await apiService.deleteEvent(eventId);
    return true;
  } catch (err) {
    console.error('Error deleting event:', err);
    throw err;
  }
};
