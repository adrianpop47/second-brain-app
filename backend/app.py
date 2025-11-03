from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Dummy data storage (in-memory for now)
contexts = [
    {'id': 1, 'name': 'Business', 'emoji': 'Briefcase', 'color': '#000000', 'createdAt': '2025-10-01'},
    {'id': 2, 'name': 'Fitness', 'emoji': 'Dumbbell', 'color': '#000000', 'createdAt': '2025-10-01'},
    {'id': 3, 'name': 'Health', 'emoji': 'Heart', 'color': '#000000', 'createdAt': '2025-10-01'},
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

# ID counters to prevent collisions
next_context_id = 4
next_transaction_id = 9

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
    return jsonify({'status': 'healthy', 'message': 'Flask API is running'}), 200

@app.route('/api/contexts', methods=['GET'])
def get_contexts():
    return jsonify({
        'success': True,
        'data': contexts,
        'count': len(contexts)
    }), 200

@app.route('/api/contexts', methods=['POST'])
def create_context():
    global next_context_id
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Context name is required'
        }), 400
    
    new_context = {
        'id': next_context_id,
        'name': data.get('name'),
        'emoji': data.get('emoji', 'Briefcase'),
        'color': data.get('color', '#000000'),
        'createdAt': datetime.now().strftime('%Y-%m-%d')
    }
    
    contexts.append(new_context)
    next_context_id += 1
    
    return jsonify({
        'success': True,
        'data': new_context,
        'message': 'Context created successfully'
    }), 201

@app.route('/api/contexts/<int:context_id>', methods=['PUT'])
def update_context(context_id):
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
    global contexts, transactions
    
    context = next((c for c in contexts if c['id'] == context_id), None)
    
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    transactions = [t for t in transactions if t['contextId'] != context_id]
    contexts = [c for c in contexts if c['id'] != context_id]
    
    return jsonify({
        'success': True,
        'message': 'Context deleted successfully'
    }), 200

@app.route('/api/contexts/<int:context_id>/overview', methods=['GET'])
def get_context_overview(context_id):
    context = next((c for c in contexts if c['id'] == context_id), None)
    
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    context_transactions = [t for t in transactions if t['contextId'] == context_id]
    
    total_income = sum(t['amount'] for t in context_transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in context_transactions if t['type'] == 'expense')
    balance = total_income - total_expenses
    
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
                'todo_count': 0,
                'idea_count': 0,
                'event_count': 0
            },
            'recent_transactions': recent_transactions
        }
    }), 200

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
    return jsonify({
        'success': True,
        'data': filtered,
        'count': len(filtered)
    }), 200

@app.route('/api/contexts/<int:context_id>/transactions', methods=['GET'])
def get_context_transactions(context_id):
    date_range = request.args.get('range', 'all')
    
    context_transactions = [t for t in transactions if t['contextId'] == context_id]
    
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
    global next_transaction_id
    
    data = request.get_json()
    
    print("Received transaction data:", data)  # Debug
    
    if not data.get('amount') or not data.get('contextId'):
        return jsonify({
            'success': False,
            'message': 'Amount and context are required'
        }), 400
    
    context = next((c for c in contexts if c['id'] == data.get('contextId')), None)
    if not context:
        return jsonify({
            'success': False,
            'message': 'Context not found'
        }), 404
    
    # Ensure tags is always a list (even if empty)
    tags = data.get('tags', [])
    if tags is None:
        tags = []
    
    new_transaction = {
        'id': next_transaction_id,
        'contextId': data.get('contextId'),
        'type': data.get('type', 'expense'),
        'amount': float(data.get('amount')),
        'tags': tags,  # This should be a list
        'description': data.get('description', ''),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
    }
    
    print("Created transaction:", new_transaction)  # Debug
    
    transactions.insert(0, new_transaction)
    next_transaction_id += 1
    
    return jsonify({
        'success': True,
        'data': new_transaction,
        'message': 'Transaction added successfully'
    }), 201

@app.route('/api/stats/summary', methods=['GET'])
def get_summary_stats():
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
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
    date_range = request.args.get('range', 'all')
    filtered = filter_transactions_by_range(date_range)
    
    context_totals = {}
    for t in filtered:
        if t['type'] == 'expense':
            context = next((c for c in contexts if c['id'] == t['contextId']), None)
            if context:
                context_name = context['name']
                context_totals[context_name] = context_totals.get(context_name, 0) + t['amount']
    
    context_data = [
        {'name': context, 'value': round(amount, 2)}
        for context, amount in context_totals.items()
    ]
    
    context_data.sort(key=lambda x: x['value'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': context_data
    }), 200

@app.route('/api/stats/by-tag', methods=['GET'])
def get_stats_by_tag():
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
    # Group expenses by tag
    tag_totals = {}
    untagged_total = 0
    
    for t in filtered:
        if t['type'] == 'expense':
            tags = t.get('tags', [])
            if not tags or len(tags) == 0:
                # Count untagged expenses
                untagged_total += t['amount']
            else:
                # Count tagged expenses
                for tag in tags:
                    tag_totals[tag] = tag_totals.get(tag, 0) + t['amount']
    
    # Build result array
    tag_data = [
        {'name': tag, 'value': round(amount, 2)}
        for tag, amount in tag_totals.items()
    ]
    
    # Add "Others" for untagged if there are any
    if untagged_total > 0:
        tag_data.append({'name': 'Others (untagged)', 'value': round(untagged_total, 2)})
    
    tag_data.sort(key=lambda x: x['value'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': tag_data
    }), 200

@app.route('/api/stats/daily', methods=['GET'])
def get_daily_stats():
    date_range = request.args.get('range', 'all')
    context_id = request.args.get('contextId', None)
    
    filtered = filter_transactions_by_range(date_range)
    
    if context_id:
        filtered = [t for t in filtered if t['contextId'] == int(context_id)]
    
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
    
    daily_data = list(daily_totals.values())
    
    return jsonify({
        'success': True,
        'data': daily_data
    }), 200

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    global transactions
    
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)