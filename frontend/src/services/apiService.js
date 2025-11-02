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

  // Get all transactions with optional date range filter
  async getTransactions(dateRange = 'all') {
    return this.request(`/transactions?range=${dateRange}`);
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

  // Get summary statistics (income, expenses, balance)
  async getSummaryStats(dateRange = 'all') {
    return this.request(`/stats/summary?range=${dateRange}`);
  }

  // Get category statistics for pie chart
  async getCategoryStats(dateRange = 'all') {
    return this.request(`/stats/categories?range=${dateRange}`);
  }

  // Get daily statistics for line chart
  async getDailyStats(dateRange = 'all') {
    return this.request(`/stats/daily?range=${dateRange}`);
  }

  // Get available categories
  async getCategories() {
    return this.request('/categories');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;