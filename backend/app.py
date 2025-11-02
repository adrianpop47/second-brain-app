from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Dummy data storage (in-memory for now)
transactions = [
    {'id': 1, 'type': 'expense', 'amount': 45.50, 'category': 'Food', 'description': 'Grocery shopping', 'date': '2025-10-25'},
    {'id': 2, 'type': 'income', 'amount': 2500, 'category': 'Salary', 'description': 'Monthly salary', 'date': '2025-10-24'},
    {'id': 3, 'type': 'expense', 'amount': 120, 'category': 'Transport', 'description': 'Gas', 'date': '2025-10-23'},
    {'id': 4, 'type': 'expense', 'amount': 85, 'category': 'Entertainment', 'description': 'Cinema tickets', 'date': '2025-10-22'},
    {'id': 5, 'type': 'income', 'amount': 200, 'category': 'Freelance', 'description': 'Web design project', 'date': '2025-10-21'},
    {'id': 6, 'type': 'expense', 'amount': 60, 'category': 'Food', 'description': 'Restaurant', 'date': '2025-10-20'},
    {'id': 7, 'type': 'expense', 'amount': 150, 'category': 'Shopping', 'description': 'Clothes', 'date': '2025-10-19'},
    {'id': 8, 'type': 'income', 'amount': 500, 'category': 'Freelance', 'description': 'Design project', 'date': '2025-10-18'},
]

# Helper function to filter transactions by date range
def filter_transactions_by_range(date_range):
    now = datetime.now()
    
    if date_range == 'all':
        return transactions
    
    if date_range == 'week':
        cutoff = now - timedelta(days=7)
    elif date_range == 'month':
        cutoff = now - timedelta(days=30)
    elif date_range == 'year':
        cutoff = now - timedelta(days=365)
    else:
        return transactions
    
    return [t for t in transactions if datetime.strptime(t['date'], '%Y-%m-%d') >= cutoff]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Flask API is running'}), 200

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions with optional date range filter"""
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    return jsonify({
        'success': True,
        'data': filtered,
        'count': len(filtered)
    }), 200

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount') or not data.get('category'):
        return jsonify({
            'success': False,
            'message': 'Amount and category are required'
        }), 400
    
    # Create new transaction
    new_transaction = {
        'id': len(transactions) + 1,
        'type': data.get('type', 'expense'),
        'amount': float(data.get('amount')),
        'category': data.get('category'),
        'description': data.get('description', ''),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
    }
    
    transactions.insert(0, new_transaction)
    
    return jsonify({
        'success': True,
        'data': new_transaction,
        'message': 'Transaction added successfully'
    }), 201

@app.route('/api/stats/summary', methods=['GET'])
def get_summary_stats():
    """Get summary statistics (income, expenses, balance)"""
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    total_income = sum(t['amount'] for t in filtered if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in filtered if t['type'] == 'expense')
    balance = total_income - total_expenses
    
    return jsonify({
        'success': True,
        'data': {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expenses, 2),
            'balance': round(balance, 2)
        }
    }), 200

@app.route('/api/stats/categories', methods=['GET'])
def get_category_stats():
    """Get expenses grouped by category for pie chart"""
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    # Group expenses by category
    category_totals = {}
    for t in filtered:
        if t['type'] == 'expense':
            category = t['category']
            category_totals[category] = category_totals.get(category, 0) + t['amount']
    
    # Convert to array format for chart
    category_data = [
        {'name': cat, 'value': round(amount, 2)}
        for cat, amount in category_totals.items()
    ]
    
    # Sort by value descending
    category_data.sort(key=lambda x: x['value'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': category_data
    }), 200

@app.route('/api/stats/daily', methods=['GET'])
def get_daily_stats():
    """Get daily income and expenses for line chart"""
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    # Group by date
    daily_totals = {}
    for t in filtered:
        date_obj = datetime.strptime(t['date'], '%Y-%m-%d')
        date_key = date_obj.strftime('%b %d')
        
        if date_key not in daily_totals:
            daily_totals[date_key] = {'date': date_key, 'expenses': 0, 'income': 0}
        
        if t['type'] == 'expense':
            daily_totals[date_key]['expenses'] += t['amount']
        else:
            daily_totals[date_key]['income'] += t['amount']
    
    # Convert to array and sort by date
    daily_data = list(daily_totals.values())
    
    return jsonify({
        'success': True,
        'data': daily_data
    }), 200

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get available categories for expense and income"""
    return jsonify({
        'success': True,
        'data': {
            'expense': ['Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Education', 'Other'],
            'income': ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other']
        }
    }), 200

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction by ID"""
    global transactions
    
    # Find and remove transaction
    transaction = next((t for t in transactions if t['id'] == transaction_id), None)
    
    if not transaction:
        return jsonify({
            'success': False,
            'message': 'Transaction not found'
        }), 404
    
    transactions = [t for t in transactions if t['id'] != transaction_id]
    
    return jsonify({
        'success': True,
        'message': 'Transaction deleted successfully'
    }), 200

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update a transaction by ID"""
    data = request.get_json()
    
    # Find transaction
    transaction = next((t for t in transactions if t['id'] == transaction_id), None)
    
    if not transaction:
        return jsonify({
            'success': False,
            'message': 'Transaction not found'
        }), 404
    
    # Update fields
    transaction['type'] = data.get('type', transaction['type'])
    transaction['amount'] = float(data.get('amount', transaction['amount']))
    transaction['category'] = data.get('category', transaction['category'])
    transaction['description'] = data.get('description', transaction['description'])
    transaction['date'] = data.get('date', transaction['date'])
    
    return jsonify({
        'success': True,
        'data': transaction,
        'message': 'Transaction updated successfully'
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)