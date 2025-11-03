from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Dummy data storage (in-memory for now)
contexts = [
    {'id': 1, 'name': 'Business', 'emoji': '💼', 'color': '#000000', 'createdAt': '2025-10-01'},
    {'id': 2, 'name': 'Fitness', 'emoji': '🏋️', 'color': '#000000', 'createdAt': '2025-10-01'},
    {'id': 3, 'name': 'Health', 'emoji': '🏥', 'color': '#000000', 'createdAt': '2025-10-01'},
]

transactions = [
    {'id': 1, 'contextId': 1, 'type': 'expense', 'amount': 45.50, 'tags': ['software', 'monthly'], 'description': 'Software subscription', 'date': '2025-10-25'},
    {'id': 2, 'contextId': 1, 'type': 'income', 'amount': 2500, 'tags': ['salary', 'monthly'], 'description': 'Monthly salary', 'date': '2025-10-24'},
    {'id': 3, 'contextId': 1, 'type': 'expense', 'amount': 120, 'tags': ['rent', 'office'], 'description': 'Office rent', 'date': '2025-10-23'},
    {'id': 4, 'contextId': 2, 'type': 'expense', 'amount': 85, 'tags': ['gym', 'membership'], 'description': 'Gym membership', 'date': '2025-10-22'},
    {'id': 5, 'contextId': 1, 'type': 'income', 'amount': 200, 'tags': ['client', 'project'], 'description': 'Web design project', 'date': '2025-10-21'},
    {'id': 6, 'contextId': 2, 'type': 'expense', 'amount': 60, 'tags': ['supplements'], 'description': 'Protein powder', 'date': '2025-10-20'},
    {'id': 7, 'contextId': 3, 'type': 'expense', 'amount': 150, 'tags': ['doctor', 'checkup'], 'description': 'Doctor visit', 'date': '2025-10-19'},
    {'id': 8, 'contextId': 1, 'type': 'income', 'amount': 500, 'tags': ['client', 'project'], 'description': 'Design project', 'date': '2025-10-18'},
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

# ============================================================================
# CONTEXT ENDPOINTS
# ============================================================================

@app.route('/api/contexts', methods=['GET'])
def get_contexts():
    """Get all contexts"""
    return jsonify({
        'success': True,
        'data': contexts,
        'count': len(contexts)
    }), 200

@app.route('/api/contexts', methods=['POST'])
def create_context():
    """Create a new context"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Context name is required'
        }), 400
    
    new_context = {
        'id': len(contexts) + 1,
        'name': data.get('name'),
        'emoji': data.get('emoji', '📁'),
        'color': data.get('color', '#000000'),
        'createdAt': datetime.now().strftime('%Y-%m-%d')
    }
    
    contexts.append(new_context)
    
    return jsonify({
        'success': True,
        'data': new_context,
        'message': 'Context created successfully'
    }), 201

@app.route('/api/contexts/<int:context_id>', methods=['PUT'])
def update_context(context_id):
    """Update a context"""
    data = request.get_json()
    
    context = next((c for c in contexts if c['id'] == context_id), None)
    
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    context['name'] = data.get('name', context['name'])
    context['emoji'] = data.get('emoji', context['emoji'])
    context['color'] = data.get('color', context['color'])
    
    return jsonify({
        'success': True,
        'data': context,
        'message': 'Context updated successfully'
    }), 200

@app.route('/api/contexts/<int:context_id>', methods=['DELETE'])
def delete_context(context_id):
    """Delete a context"""
    global contexts, transactions
    
    context = next((c for c in contexts if c['id'] == context_id), None)
    
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    # Delete all transactions in this context
    transactions = [t for t in transactions if t['contextId'] != context_id]
    
    # Delete the context
    contexts = [c for c in contexts if c['id'] != context_id]
    
    return jsonify({
        'success': True,
        'message': 'Context deleted successfully'
    }), 200

@app.route('/api/contexts/<int:context_id>/overview', methods=['GET'])
def get_context_overview(context_id):
    """Get overview stats for a specific context"""
    context = next((c for c in contexts if c['id'] == context_id), None)
    
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    # Get transactions for this context
    context_transactions = [t for t in transactions if t['contextId'] == context_id]
    
    # Calculate stats
    total_income = sum(t['amount'] for t in context_transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in context_transactions if t['type'] == 'expense')
    balance = total_income - total_expenses
    
    # Get recent transactions
    recent_transactions = sorted(context_transactions, key=lambda x: x['date'], reverse=True)[:5]
    
    return jsonify({
        'success': True,
        'data': {
            'context': context,
            'stats': {
                'total_income': round(total_income, 2),
                'total_expenses': round(total_expenses, 2),
                'balance': round(balance, 2),
                'transaction_count': len(context_transactions),
                'todo_count': 0,  # Placeholder for future
                'idea_count': 0,  # Placeholder for future
                'event_count': 0  # Placeholder for future
            },
            'recent_transactions': recent_transactions
        }
    }), 200

# ============================================================================
# TRANSACTION ENDPOINTS (Updated for contexts)
# ============================================================================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions with optional date range and context filter"""
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    # Filter by context if specified
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
    return jsonify({
        'success': True,
        'data': filtered,
        'count': len(filtered)
    }), 200

@app.route('/api/contexts/<int:context_id>/transactions', methods=['GET'])
def get_context_transactions(context_id):
    """Get all transactions for a specific context"""
    date_range = request.args.get('range', 'all')
    
    # Filter transactions by context
    context_transactions = [t for t in transactions if t['contextId'] == context_id]
    
    # Apply date range filter
    if date_range != 'all':
        now = datetime.now()
        if date_range == 'week':
            cutoff = now - timedelta(days=7)
        elif date_range == 'month':
            cutoff = now - timedelta(days=30)
        elif date_range == 'year':
            cutoff = now - timedelta(days=365)
        else:
            cutoff = now
        
        context_transactions = [t for t in context_transactions if datetime.strptime(t['date'], '%Y-%m-%d') >= cutoff]
    
    return jsonify({
        'success': True,
        'data': context_transactions,
        'count': len(context_transactions)
    }), 200

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount') or not data.get('contextId'):
        return jsonify({
            'success': False,
            'message': 'Amount and context are required'
        }), 400
    
    # Validate context exists
    context = next((c for c in contexts if c['id'] == data.get('contextId')), None)
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    # Create new transaction
    new_transaction = {
        'id': len(transactions) + 1,
        'contextId': data.get('contextId'),
        'type': data.get('type', 'expense'),
        'amount': float(data.get('amount')),
        'tags': data.get('tags', []),
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
    """Get summary statistics (income, expenses, balance) - all contexts or filtered"""
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    # Filter by context if specified
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
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

@app.route('/api/stats/by-context', methods=['GET'])
def get_stats_by_context():
    """Get expenses grouped by context for pie chart"""
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    # Group expenses by context
    context_totals = {}
    for t in filtered:
        if t['type'] == 'expense':
            context = next((c for c in contexts if c['id'] == t['contextId']), None)
            if context:
                context_name = context['name']
                context_totals[context_name] = context_totals.get(context_name, 0) + t['amount']
    
    # Convert to array format for chart
    context_data = [
        {'name': context, 'value': round(amount, 2)}
        for context, amount in context_totals.items()
    ]
    
    # Sort by value descending
    context_data.sort(key=lambda x: x['value'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': context_data
    }), 200

@app.route('/api/stats/by-tag', methods=['GET'])
def get_stats_by_tag():
    """Get expenses grouped by tag for pie chart"""
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    # Filter by context if specified
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
    # Group expenses by tag
    tag_totals = {}
    for t in filtered:
        if t['type'] == 'expense':
            for tag in t.get('tags', []):
                tag_totals[tag] = tag_totals.get(tag, 0) + t['amount']
    
    # Convert to array format for chart
    tag_data = [
        {'name': tag, 'value': round(amount, 2)}
        for tag, amount in tag_totals.items()
    ]
    
    # Sort by value descending
    tag_data.sort(key=lambda x: x['value'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': tag_data
    }), 200

@app.route('/api/stats/categories', methods=['GET'])
def get_category_stats():
    """Get expenses grouped by category for pie chart (deprecated - use by-tag)"""
    # Keeping for backwards compatibility, redirect to by-tag
    return get_stats_by_tag()

@app.route('/api/stats/daily', methods=['GET'])
def get_daily_stats():
    """Get daily income and expenses for line chart"""
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    # Filter by context if specified
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
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
    """Get available categories for expense and income (deprecated)"""
    # Keeping for backwards compatibility
    return jsonify({
        'success': True,
        'data': {
            'expense': [],
            'income': []
        },
        'message': 'Categories are deprecated. Use tags instead.'
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