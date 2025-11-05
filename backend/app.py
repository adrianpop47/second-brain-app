from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import database and models
from models import db, Context, Transaction, Todo

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize extensions
CORS(app)
db.init_app(app)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def filter_transactions_by_range(transactions, date_range):
    """Filter transactions by date range"""
    if date_range == 'all':
        return transactions
    
    now = datetime.now()
    
    if date_range == 'week':
        cutoff = now - timedelta(days=7)
    elif date_range == 'month':
        cutoff = now - timedelta(days=30)
    elif date_range == 'year':
        cutoff = now - timedelta(days=365)
    else:
        return transactions
    
    # Handle both dict and model objects
    filtered = []
    for t in transactions:
        if isinstance(t, dict):
            # Already converted to dict
            trans_date = datetime.strptime(t['date'], '%Y-%m-%d')
        else:
            # Model object
            trans_date = datetime.combine(t.date, datetime.min.time())
        
        if trans_date >= cutoff:
            filtered.append(t)
    
    return filtered


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            'status': 'healthy', 
            'message': 'Flask API is running',
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': 'Database connection failed',
            'error': str(e)
        }), 500


# ============================================================================
# CONTEXT ENDPOINTS
# ============================================================================

@app.route('/api/contexts', methods=['GET'])
def get_contexts():
    try:
        contexts = Context.query.order_by(Context.created_at).all()
        return jsonify({
            'success': True,
            'data': [context.to_dict() for context in contexts],
            'count': len(contexts)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching contexts: {str(e)}'
        }), 500


@app.route('/api/contexts', methods=['POST'])
def create_context():
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Context name is required'
            }), 400
        
        new_context = Context(
            name=data.get('name'),
            emoji=data.get('emoji', 'Briefcase'),
            color=data.get('color', '#000000')
        )
        
        db.session.add(new_context)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_context.to_dict(),
            'message': 'Context created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating context: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>', methods=['PUT'])
def update_context(context_id):
    try:
        context = Context.query.get(context_id)
        
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        data = request.get_json()
        
        context.name = data.get('name', context.name)
        context.emoji = data.get('emoji', context.emoji)
        context.color = data.get('color', context.color)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': context.to_dict(),
            'message': 'Context updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating context: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>', methods=['DELETE'])
def delete_context(context_id):
    try:
        context = Context.query.get(context_id)
        
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        db.session.delete(context)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Context deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting context: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>/overview', methods=['GET'])
def get_context_overview(context_id):
    try:
        context = Context.query.get(context_id)
        
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        # Get transactions
        transactions = Transaction.query.filter_by(context_id=context_id).all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Calculate stats
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
        balance = total_income - total_expenses
        
        # Get todos
        todos = Todo.query.filter_by(context_id=context_id).all()
        
        # Get recent transactions (last 5)
        recent_transactions = sorted(transaction_dicts, key=lambda x: x['date'], reverse=True)[:5]
        
        return jsonify({
            'success': True,
            'data': {
                'context': context.to_dict(),
                'stats': {
                    'total_income': round(total_income, 2),
                    'total_expenses': round(total_expenses, 2),
                    'balance': round(balance, 2),
                    'transaction_count': len(transactions),
                    'todo_count': len(todos),
                    'idea_count': 0,  # TODO: Implement when ideas are added
                    'event_count': 0  # TODO: Implement when events are added
                },
                'recent_transactions': recent_transactions
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching overview: {str(e)}'
        }), 500


# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        date_range = request.args.get('range', 'all')
        context_id = request.args.get('contextId', None)
        
        query = Transaction.query
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))
        
        transactions = query.order_by(Transaction.date.desc()).all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
        return jsonify({
            'success': True,
            'data': filtered,
            'count': len(filtered)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching transactions: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>/transactions', methods=['GET'])
def get_context_transactions(context_id):
    try:
        date_range = request.args.get('range', 'all')
        
        transactions = Transaction.query.filter_by(context_id=context_id).order_by(Transaction.date.desc()).all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
        return jsonify({
            'success': True,
            'data': filtered,
            'count': len(filtered)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching transactions: {str(e)}'
        }), 500


@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    try:
        data = request.get_json()
        
        if not data.get('amount') or not data.get('contextId'):
            return jsonify({
                'success': False,
                'message': 'Amount and context are required'
            }), 400
        
        # Verify context exists
        context = Context.query.get(data.get('contextId'))
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        # Parse date
        date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        new_transaction = Transaction(
            context_id=data.get('contextId'),
            type=data.get('type', 'expense'),
            amount=float(data.get('amount')),
            description=data.get('description', ''),
            tags=data.get('tags', []),
            date=date_obj
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_transaction.to_dict(),
            'message': 'Transaction added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error adding transaction: {str(e)}'
        }), 500


@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    try:
        transaction = Transaction.query.get(transaction_id)
        
        if not transaction:
            return jsonify({
                'success': False,
                'message': 'Transaction not found'
            }), 404
        
        data = request.get_json()
        
        # Update only provided fields
        if 'type' in data:
            transaction.type = data['type']
        if 'amount' in data:
            transaction.amount = float(data['amount'])
        if 'description' in data:
            transaction.description = data['description']
        if 'tags' in data:
            transaction.tags = data['tags']
        if 'date' in data:
            try:
                transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except:
                pass
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': transaction.to_dict(),
            'message': 'Transaction updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating transaction: {str(e)}'
        }), 500


@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    try:
        transaction = Transaction.query.get(transaction_id)
        
        if not transaction:
            return jsonify({
                'success': False,
                'message': 'Transaction not found'
            }), 404
        
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Transaction deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting transaction: {str(e)}'
        }), 500


# ============================================================================
# TODOS ENDPOINTS
# ============================================================================

@app.route('/api/contexts/<int:context_id>/todos', methods=['GET'])
def get_context_todos(context_id):
    try:
        todos = Todo.query.filter_by(context_id=context_id).order_by(Todo.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [todo.to_dict() for todo in todos],
            'count': len(todos)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching todos: {str(e)}'
        }), 500


@app.route('/api/todos', methods=['POST'])
def add_todo():
    try:
        data = request.get_json()
        
        if not data.get('title') or not data.get('contextId'):
            return jsonify({
                'success': False,
                'message': 'Title and context are required'
            }), 400
        
        # Verify context exists
        context = Context.query.get(data.get('contextId'))
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        # Parse due date if provided
        due_date = None
        if data.get('dueDate'):
            try:
                due_date = datetime.strptime(data.get('dueDate'), '%Y-%m-%d').date()
            except:
                pass
        
        new_todo = Todo(
            context_id=data.get('contextId'),
            title=data.get('title'),
            description=data.get('description', ''),
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            due_date=due_date,
            tags=data.get('tags', [])
        )
        
        db.session.add(new_todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_todo.to_dict(),
            'message': 'Todo added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error adding todo: {str(e)}'
        }), 500


@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({
                'success': False,
                'message': 'Todo not found'
            }), 404
        
        data = request.get_json()
        
        # Update only provided fields
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data['description']
        if 'status' in data:
            todo.status = data['status']
        if 'priority' in data:
            todo.priority = data['priority']
        if 'tags' in data:
            todo.tags = data['tags']
        if 'dueDate' in data:
            if data['dueDate']:
                try:
                    todo.due_date = datetime.strptime(data['dueDate'], '%Y-%m-%d').date()
                except:
                    pass
            else:
                todo.due_date = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': todo.to_dict(),
            'message': 'Todo updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating todo: {str(e)}'
        }), 500


@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({
                'success': False,
                'message': 'Todo not found'
            }), 404
        
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Todo deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting todo: {str(e)}'
        }), 500


# ============================================================================
# STATS ENDPOINTS
# ============================================================================

@app.route('/api/stats/summary', methods=['GET'])
def get_summary_stats():
    try:
        date_range = request.args.get('range', 'all')
        context_id = request.args.get('contextId', None)
        
        query = Transaction.query
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))
        
        transactions = query.all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
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
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching summary: {str(e)}'
        }), 500


@app.route('/api/stats/by-context', methods=['GET'])
def get_stats_by_context():
    try:
        date_range = request.args.get('range', 'all')
        
        contexts = Context.query.all()
        transactions = Transaction.query.filter_by(type='expense').all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
        # Group by context
        context_totals = {}
        context_map = {c.id: c.name for c in contexts}
        
        for t in filtered:
            context_name = context_map.get(t['contextId'], 'Unknown')
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
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching context stats: {str(e)}'
        }), 500


@app.route('/api/stats/by-tag', methods=['GET'])
def get_stats_by_tag():
    try:
        date_range = request.args.get('range', 'all')
        context_id = request.args.get('contextId', None)
        
        query = Transaction.query.filter_by(type='expense')
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))
        
        transactions = query.all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
        # Group by tag
        tag_totals = {}
        untagged_total = 0
        
        for t in filtered:
            tags = t.get('tags', [])
            if not tags or len(tags) == 0:
                untagged_total += t['amount']
            else:
                for tag in tags:
                    tag_totals[tag] = tag_totals.get(tag, 0) + t['amount']
        
        tag_data = [
            {'name': tag, 'value': round(amount, 2)}
            for tag, amount in tag_totals.items()
        ]
        
        if untagged_total > 0:
            tag_data.append({'name': 'Others (untagged)', 'value': round(untagged_total, 2)})
        
        tag_data.sort(key=lambda x: x['value'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': tag_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching tag stats: {str(e)}'
        }), 500


@app.route('/api/stats/daily', methods=['GET'])
def get_daily_stats():
    try:
        date_range = request.args.get('range', 'all')
        context_id = request.args.get('contextId', None)
        
        query = Transaction.query
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))
        
        transactions = query.all()
        transaction_dicts = [t.to_dict() for t in transactions]
        
        # Filter by date range
        filtered = filter_transactions_by_range(transaction_dicts, date_range)
        
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
        
        daily_data = list(daily_totals.values())
        
        return jsonify({
            'success': True,
            'data': daily_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching daily stats: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)