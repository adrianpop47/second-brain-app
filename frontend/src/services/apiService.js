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

  // Get all contexts
  async getContexts() {
    return this.request('/contexts');
  }

  // Create a new context
  async createContext(context) {
    return this.request('/contexts', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }

  // Update a context
  async updateContext(contextId, context) {
    return this.request(`/contexts/${contextId}`, {
      method: 'PUT',
      body: JSON.stringify(context),
    });
  }

  // Delete a context
  async deleteContext(contextId) {
    return this.request(`/contexts/${contextId}`, {
      method: 'DELETE',
    });
  }

  // Get context overview (stats + recent items)
  async getContextOverview(contextId) {
    return this.request(`/contexts/${contextId}/overview`);
  }

  // Get transactions for a specific context
  async getContextTransactions(contextId, dateRange = 'all') {
    return this.request(`/contexts/${contextId}/transactions?range=${dateRange}`);
  }

  // ============================================================================
  // TRANSACTION ENDPOINTS
  // ============================================================================

  // Get all transactions with optional date range and context filter
  async getTransactions(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/transactions?${params}`);
  }

  // Add a new transaction
  async addTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Delete a transaction
  async deleteTransaction(transactionId) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // Update a transaction
  async updateTransaction(transactionId, transaction) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  // ============================================================================
  // STATS ENDPOINTS
  // ============================================================================

  // Get summary statistics (income, expenses, balance)
  async getSummaryStats(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/stats/summary?${params}`);
  }

  // Get expenses grouped by context (for Home view pie chart)
  async getStatsByContext(dateRange = 'all') {
    return this.request(`/stats/by-context?range=${dateRange}`);
  }

  // Get expenses grouped by tag (for context finances pie chart)
  async getStatsByTag(dateRange = 'all', contextId = null) {
    const params = new URLSearchParams({ range: dateRange });
    if (contextId) params.append('contextId', contextId);
    return this.request(`/stats/by-tag?${params}`);
  }

  // Get daily statistics for line chart
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