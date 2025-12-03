const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTEXT ENDPOINTS
  // ============================================================================

  async getContexts() {
    return this.request('/contexts');
  }

  async createContext(context) {
    return this.request('/contexts', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }

  async updateContext(contextId, context) {
    return this.request(`/contexts/${contextId}`, {
      method: 'PUT',
      body: JSON.stringify(context),
    });
  }

  async deleteContext(contextId) {
    return this.request(`/contexts/${contextId}`, {
      method: 'DELETE',
    });
  }

  async getContextOverview(contextId) {
    return this.request(`/contexts/${contextId}/overview`);
  }

  async getContextTransactions(contextId, dateRange = 'all') {
    return this.request(`/contexts/${contextId}/transactions?range=${dateRange}`);
  }

  async getContextNotes(contextId) {
    return this.request(`/contexts/${contextId}/notes`);
  }

  async createContextNote(contextId, note) {
    return this.request(`/contexts/${contextId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async deleteNote(noteId) {
    return this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async updateNote(noteId, updates) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // TRANSACTION ENDPOINTS
  // ============================================================================

  async getTransactions(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/transactions?${params}`);
  }

  async addTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(transactionId) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  async updateTransaction(transactionId, transaction) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  // ============================================================================
  // TODOS ENDPOINTS
  // ============================================================================

  async getContextTodos(contextId) {
    return this.request(`/contexts/${contextId}/todos`);
  }

  async addTodo(todo) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(todoId, updates) {
    return this.request(`/todos/${todoId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTodo(todoId) {
    return this.request(`/todos/${todoId}`, {
      method: 'DELETE',
    });
  }

  // Get overdue todos
  async getOverdueTodos(contextId = null) {
    const params = contextId ? `?contextId=${contextId}` : '';
    return this.request(`/todos/overdue${params}`);
  }

  // Add todo to calendar
  async addTodoToCalendar(todoId, eventData) {
    return this.request(`/todos/${todoId}/add-to-calendar`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async unlinkTodoFromEvent(todoId, eventId) {
    return this.request(`/todos/${todoId}/events/${eventId}/unlink`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // EVENT ENDPOINTS
  // ============================================================================

  // Get all events
  async getEvents(fromDate = null, toDate = null, contextId = null) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    if (contextId) params.append('contextId', contextId);
    return this.request(`/events?${params}`);
  }

  // Get context events
  async getContextEvents(contextId, fromDate = null, toDate = null) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    return this.request(`/contexts/${contextId}/events?${params}`);
  }

  // Create event
  async createEvent(event) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Update event
  async updateEvent(eventId, updates) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete event
  async deleteEvent(eventId) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // STATS ENDPOINTS
  // ============================================================================

  async getSummaryStats(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/stats/summary?${params}`);
  }

  async getStatsByContext(dateRange = 'all') {
    return this.request(`/stats/by-context?range=${dateRange}`);
  }

  async getStatsByTag(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/stats/by-tag?${params}`);
  }

  async getDailyStats(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/stats/daily?${params}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;
