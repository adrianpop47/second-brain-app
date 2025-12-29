from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import database and models
from models import db, Context, Transaction, Todo, Idea, Event

VALID_CONTEXT_TYPES = {'Revenue', 'Investment', 'Experimental'}
DEFAULT_CONTEXT_TYPE = 'Revenue'

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

def get_range_window(date_range):
    """Return start and end datetimes for the requested range."""
    now = datetime.now()
    start = end = None

    if date_range == 'day':
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)
    elif date_range == 'week':
        start = datetime(now.year, now.month, now.day)
        weekday = start.weekday()  # Monday=0
        start -= timedelta(days=weekday)
        end = start + timedelta(days=7)
    elif date_range == 'month':
        start = datetime(now.year, now.month, 1)
        if now.month == 12:
            end = datetime(now.year + 1, 1, 1)
        else:
            end = datetime(now.year, now.month + 1, 1)
    elif date_range == 'year':
        start = datetime(now.year, 1, 1)
        end = datetime(now.year + 1, 1, 1)

    return start, end


def filter_transactions_by_range(transactions, date_range):
    """Filter transactions by date range."""
    if date_range == 'all':
        return transactions

    start, end = get_range_window(date_range)
    if not start and not end:
        return transactions

    filtered = []
    for t in transactions:
        if isinstance(t, dict):
            trans_date = datetime.strptime(t['date'], '%Y-%m-%d')
        else:
            trans_date = datetime.combine(t.date, datetime.min.time())

        if start and trans_date < start:
            continue
        if end and trans_date >= end:
            continue
        filtered.append(t)

    return filtered


def parse_duration_minutes(value):
    """Convert incoming duration (in hours) to integer minutes."""
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == '':
            return None
        value = stripped
    try:
        hours = float(value)
        if hours <= 0:
            return None
        return int(round(hours * 60))
    except (TypeError, ValueError):
        return None


def adjust_context_time(context_obj, minutes_delta):
    if not context_obj or not minutes_delta:
        return
    current = context_obj.total_time_minutes or 0
    updated = current + int(minutes_delta)
    context_obj.total_time_minutes = max(0, updated)


def get_default_due_time(priority):
    if priority == 'high':
        return datetime.strptime('09:00', '%H:%M').time()
    if priority == 'low':
        return datetime.strptime('17:00', '%H:%M').time()
    return datetime.strptime('14:00', '%H:%M').time()


def normalize_due_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value:
        try:
            return datetime.strptime(value[:10], '%Y-%m-%d').date()
        except ValueError:
            return None
    return value


def normalize_due_time(value):
    if hasattr(value, 'hour'):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.strptime(value[:5], '%H:%M').time()
        except ValueError:
            return None
    return value


def get_event_duration_minutes(event):
    if not event or not event.start_date:
        return 0
    if event.all_day:
        return 24 * 60
    if event.end_date:
        diff_seconds = (event.end_date - event.start_date).total_seconds()
        return max(0, int(round(diff_seconds / 60)))
    # Default 1 hour block if no end date yet
    return 60


def get_todo_duration_minutes(todo):
    if not todo:
        return 0
    if todo.duration_minutes:
        return todo.duration_minutes
    if todo.calendar_events:
        return get_event_duration_minutes(todo.calendar_events[0])
    return 0


def apply_duration_to_event(event_obj, duration_minutes):
    """Update an event's end (or start) based on a duration while preserving existing schedule."""
    if not event_obj:
        return
    try:
        minutes = int(duration_minutes or 0)
    except (TypeError, ValueError):
        return
    if minutes <= 0:
        return
    if event_obj.start_date:
        event_obj.end_date = event_obj.start_date + timedelta(minutes=minutes)
    elif event_obj.end_date:
        event_obj.start_date = event_obj.end_date - timedelta(minutes=minutes)
    else:
        anchor = datetime.now().replace(second=0, microsecond=0)
        event_obj.start_date = anchor
        event_obj.end_date = anchor + timedelta(minutes=minutes)


def parse_date_param(value, is_end=False):
    """
    Normalize incoming date query params so dates without an explicit time component
    cover the full day (e.g. 2024-01-01 should include all events on Jan 1st).
    """
    if not value:
        return None

    raw_value = value.strip()
    cleaned_value = raw_value.replace('Z', '+00:00')
    has_time_component = 'T' in raw_value or ' ' in raw_value

    try:
        parsed = datetime.fromisoformat(cleaned_value)
    except ValueError:
        # Fall back to date-only format
        if len(raw_value) >= 10:
            parsed = datetime.strptime(raw_value[:10], '%Y-%m-%d')
            has_time_component = False
        else:
            raise

    if not has_time_component and is_end:
        parsed = parsed + timedelta(days=1) - timedelta(microseconds=1)

    return parsed


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
        data = request.get_json() or {}
        
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Context name is required'
            }), 400

        field_type = data.get('fieldType', DEFAULT_CONTEXT_TYPE)
        if field_type not in VALID_CONTEXT_TYPES:
            return jsonify({
                'success': False,
                'message': 'Invalid field type. Choose Revenue, Investment, or Experimental.'
            }), 400
        
        new_context = Context(
            name=data.get('name'),
            emoji=data.get('emoji', 'Briefcase'),
            color=data.get('color', '#000000'),
            field_type=field_type
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
        
        data = request.get_json() or {}
        
        context.name = data.get('name', context.name)
        context.emoji = data.get('emoji', context.emoji)
        context.color = data.get('color', context.color)
        if 'fieldType' in data and data.get('fieldType'):
            if data['fieldType'] not in VALID_CONTEXT_TYPES:
                return jsonify({
                    'success': False,
                    'message': 'Invalid field type. Choose Revenue, Investment, or Experimental.'
                }), 400
            context.field_type = data['fieldType']
        
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
        
        date_range = request.args.get('range', 'all')

        # Get transactions
        transactions = Transaction.query.filter_by(context_id=context_id).all()
        filtered_transactions = filter_transactions_by_range(transactions, date_range)
        transaction_dicts = [t.to_dict() for t in filtered_transactions]
        
        # Calculate stats
        total_income = sum(t.amount for t in filtered_transactions if t.type == 'income')
        total_expenses = sum(t.amount for t in filtered_transactions if t.type == 'expense')
        balance = total_income - total_expenses
        
        # Get todos
        todos = Todo.query.filter_by(context_id=context_id).all()
        # Get notes
        notes_count = Idea.query.filter_by(context_id=context_id).count()
        
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
                    'transaction_count': len(filtered_transactions),
                    'todo_count': len(todos),
                    'idea_count': notes_count,
                    'event_count': 0,  # TODO: Implement when events are added
                    'time_minutes': context.total_time_minutes or 0
                },
                'recent_transactions': recent_transactions
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching overview: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>/notes', methods=['GET'])
def get_context_notes(context_id):
    try:
        context = Context.query.get(context_id)
        if not context:
            return jsonify({
                'success': False,
                'message': 'Field not found'
            }), 404

        notes = Idea.query.filter_by(context_id=context_id).order_by(Idea.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [note.to_dict() for note in notes],
            'count': len(notes)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching notes: {str(e)}'
        }), 500


@app.route('/api/contexts/<int:context_id>/notes', methods=['POST'])
def add_context_note(context_id):
    try:
        context = Context.query.get(context_id)
        if not context:
            return jsonify({
                'success': False,
                'message': 'Field not found'
            }), 404

        data = request.get_json() or {}
        raw_title = data.get('title') or ''
        raw_body = data.get('body') or data.get('description') or ''
        title = raw_title
        body = raw_body

        if not title.strip() and not body.strip():
            return jsonify({
                'success': False,
                'message': 'Note title or body is required'
            }), 400

        tags = data.get('tags') or []
        if isinstance(tags, str):
            tags = [tags]
        elif not isinstance(tags, list):
            tags = []

        new_note = Idea(
            context_id=context_id,
            title=title or '',
            description=body,
            tags=tags
        )
        db.session.add(new_note)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': new_note.to_dict(),
            'message': 'Note created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating note: {str(e)}'
        }), 500


@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    try:
        note = Idea.query.get(note_id)
        if not note:
            return jsonify({
                'success': False,
                'message': 'Note not found'
            }), 404

        db.session.delete(note)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Note deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting note: {str(e)}'
        }), 500


@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    try:
        note = Idea.query.get(note_id)
        if not note:
            return jsonify({
                'success': False,
                'message': 'Note not found'
            }), 404

        data = request.get_json() or {}
        if 'title' in data:
            note.title = data['title'] or ''
        if 'body' in data or 'description' in data:
            note.description = data.get('body') or data.get('description') or ''
        if 'tags' in data:
            tags = data.get('tags') or []
            if isinstance(tags, str):
                tags = [tags]
            elif not isinstance(tags, list):
                tags = []
            note.tags = tags
        note.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({
            'success': True,
            'data': note.to_dict(),
            'message': 'Note updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating note: {str(e)}'
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
# EVENT ENDPOINTS
# ============================================================================

@app.route('/api/contexts/<int:context_id>/events', methods=['GET'])
def get_context_events(context_id):
    try:
        from_date = request.args.get('from')  # Optional date filter
        to_date = request.args.get('to')  # Optional date filter
        
        query = Event.query.filter_by(context_id=context_id)
        
        # Filter by date range if provided
        start_dt = parse_date_param(from_date)
        end_dt = parse_date_param(to_date, is_end=True)

        if start_dt:
            query = query.filter(Event.start_date >= start_dt)
        if end_dt:
            query = query.filter(Event.start_date <= end_dt)
        
        events = query.order_by(Event.start_date).all()
        
        return jsonify({
            'success': True,
            'data': [event.to_dict() for event in events],
            'count': len(events)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching events: {str(e)}'
        }), 500


@app.route('/api/events', methods=['GET'])
def get_all_events():
    try:
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        context_id = request.args.get('contextId')
        
        query = Event.query
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))

        start_dt = parse_date_param(from_date)
        end_dt = parse_date_param(to_date, is_end=True)

        if start_dt:
            query = query.filter(Event.start_date >= start_dt)
        if end_dt:
            query = query.filter(Event.start_date <= end_dt)
        
        events = query.order_by(Event.start_date).all()
        
        return jsonify({
            'success': True,
            'data': [event.to_dict() for event in events],
            'count': len(events)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching events: {str(e)}'
        }), 500


@app.route('/api/events', methods=['POST'])
def create_event():
    try:
        data = request.get_json()
        
        if not data.get('title') or not data.get('startDate') or not data.get('contextId'):
            return jsonify({
                'success': False,
                'message': 'Title, start date, and context are required'
            }), 400
        
        # Verify context exists
        context = Context.query.get(data.get('contextId'))
        if not context:
            return jsonify({
                'success': False,
                'message': 'Context not found'
            }), 404
        
        # Parse dates
        start_date = datetime.fromisoformat(data.get('startDate').replace('Z', '+00:00'))
        duration_hours = data.get('durationHours')
        if duration_hours is None:
            duration_hours = data.get('duration')
        duration_hours = float(duration_hours) if duration_hours is not None else None

        end_date = None
        if data.get('allDay', False):
            end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=0)
        elif duration_hours:
            end_date = start_date + timedelta(hours=duration_hours)
        elif data.get('endDate'):
            end_date = datetime.fromisoformat(data.get('endDate').replace('Z', '+00:00'))
        else:
            end_date = start_date + timedelta(hours=1)
        
        recurrence_end_date = None
        if data.get('recurrenceEndDate'):
            recurrence_end_date = datetime.strptime(data.get('recurrenceEndDate'), '%Y-%m-%d').date()
        
        new_event = Event(
            context_id=data.get('contextId'),
            title=data.get('title'),
            description=data.get('description', ''),
            start_date=start_date,
            end_date=end_date,
            all_day=data.get('allDay', False),
            tags=data.get('tags', []),
            recurring=data.get('recurring', False),
            recurrence_type=data.get('recurrenceType'),
            recurrence_end_date=recurrence_end_date,
            completed=data.get('completed', False)
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_event.to_dict(),
            'message': 'Event created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating event: {str(e)}'
        }), 500


@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    try:
        event = Event.query.get(event_id)

        if not event:
            return jsonify({
                'success': False,
                'message': 'Event not found'
            }), 404

        return jsonify({
            'success': True,
            'data': event.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching event: {str(e)}'
        }), 500


@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({
                'success': False,
                'message': 'Event not found'
            }), 404
        
        data = request.get_json()
        previous_completed = event.completed
        previous_duration = get_event_duration_minutes(event)
        
        # Update fields
        duration_hours_param = None
        if 'durationHours' in data:
            duration_hours_param = float(data['durationHours']) if data['durationHours'] is not None else None
        elif 'duration' in data:
            duration_hours_param = float(data['duration']) if data['duration'] is not None else None

        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'startDate' in data:
            event.start_date = datetime.fromisoformat(data['startDate'].replace('Z', '+00:00'))
        if 'endDate' in data:
            if data['endDate']:
                event.end_date = datetime.fromisoformat(data['endDate'].replace('Z', '+00:00'))
            else:
                event.end_date = None
        if 'allDay' in data:
            event.all_day = data['allDay']
        if 'tags' in data:
            event.tags = data['tags']
        if 'completed' in data:
            event.completed = bool(data['completed'])
        if 'recurring' in data:
            event.recurring = data['recurring']
        if 'recurrenceType' in data:
            event.recurrence_type = data['recurrenceType']
        if 'recurrenceEndDate' in data:
            if data['recurrenceEndDate']:
                event.recurrence_end_date = datetime.strptime(data['recurrenceEndDate'], '%Y-%m-%d').date()
            else:
                event.recurrence_end_date = None

        # Normalize end date based on duration/all-day settings
        if event.all_day:
            event.end_date = event.start_date.replace(hour=23, minute=59, second=59, microsecond=0)
        elif duration_hours_param is not None:
            event.end_date = event.start_date + timedelta(hours=duration_hours_param)
        elif event.end_date is None:
            # Default to 1 hour block when no explicit duration/end is provided
            event.end_date = event.start_date + timedelta(hours=1)
        
        new_duration = get_event_duration_minutes(event)

        # Keep linked todos in sync with event updates
        if event.linked_todos:
            for todo in event.linked_todos:
                todo.title = event.title
                if event.description is not None:
                    todo.description = event.description
                todo.tags = event.tags or []
                todo.duration_minutes = new_duration
                if 'completed' in data:
                    todo.status = 'done' if event.completed else 'todo'
        if event.context:
            if not previous_completed and event.completed:
                adjust_context_time(event.context, new_duration)
            elif previous_completed and not event.completed:
                adjust_context_time(event.context, -previous_duration)
            elif previous_completed and event.completed and new_duration != previous_duration:
                adjust_context_time(event.context, new_duration - previous_duration)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': event.to_dict(),
            'message': 'Event updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating event: {str(e)}'
        }), 500


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({
                'success': False,
                'message': 'Event not found'
            }), 404
        
        preserve_time = request.args.get('preserveTime', 'false').lower() == 'true'
        was_completed = event.completed
        event_duration = get_event_duration_minutes(event)
        event_context = event.context
        
        # Detach any linked todos via the association table
        if event.linked_todos:
            event.linked_todos = []
        
        db.session.delete(event)
        if was_completed and event_context and not preserve_time:
            adjust_context_time(event_context, -event_duration)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting event: {str(e)}'
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
        
        # Parse due time if provided
        due_time = None
        if data.get('dueTime'):
            try:
                due_time = datetime.strptime(data.get('dueTime'), '%H:%M').time()
            except:
                pass
        
        duration_source = None
        if data:
            if 'durationHours' in data:
                duration_source = data.get('durationHours')
            elif 'duration' in data:
                duration_source = data.get('duration')
        duration_minutes = parse_duration_minutes(duration_source)

        new_todo = Todo(
            context_id=data.get('contextId'),
            title=data.get('title'),
            description=data.get('description', ''),
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            due_date=due_date,
            due_time=due_time,
            duration_minutes=duration_minutes,
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
        original_status = todo.status
        original_duration = get_todo_duration_minutes(todo)
        
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
        if 'dueTime' in data:
            if data['dueTime']:
                try:
                    todo.due_time = datetime.strptime(data['dueTime'], '%H:%M').time()
                except:
                    pass
            else:
                todo.due_time = None
        duration_explicitly_set = 'durationHours' in data or 'duration' in data
        if duration_explicitly_set:
            duration_source = data.get('durationHours') if 'durationHours' in data else data.get('duration')
            todo.duration_minutes = parse_duration_minutes(duration_source)
        
        linked_events = list(todo.calendar_events or [])
        status_changed_to_done = original_status != 'done' and todo.status == 'done'
        status_changed_from_done = original_status == 'done' and todo.status != 'done'

        if linked_events and (todo.duration_minutes is None or todo.duration_minutes <= 0):
            inferred_duration = get_event_duration_minutes(linked_events[0])
            if inferred_duration:
                todo.duration_minutes = inferred_duration
            elif original_duration:
                todo.duration_minutes = original_duration

        duration_minutes_new = todo.duration_minutes
        effective_original_duration = original_duration or 0
        effective_new_duration = duration_minutes_new if duration_minutes_new is not None else 0
        duration_changed = duration_explicitly_set and effective_new_duration != effective_original_duration

        if linked_events:
            if not todo.duration_minutes or todo.duration_minutes <= 0:
                db.session.rollback()
                return jsonify({
                    'success': False,
                    'message': 'Linked todos require a duration.'
                }), 400

            if duration_changed:
                for event in linked_events:
                    apply_duration_to_event(event, todo.duration_minutes)
            if status_changed_to_done:
                added = False
                for event in linked_events:
                    if not event.completed:
                        event.completed = True
                        if not added and event.context:
                            adjust_context_time(event.context, effective_new_duration)
                            added = True
            elif status_changed_from_done:
                adjusted = False
                for event in linked_events:
                    if event.completed and not adjusted and event.context:
                        adjust_context_time(event.context, -effective_original_duration)
                        adjusted = True
                    event.completed = False
            elif todo.status == 'done' and duration_changed:
                duration_delta = effective_new_duration - effective_original_duration
                if duration_delta != 0:
                    for event in linked_events:
                        if event.completed and event.context:
                            adjust_context_time(event.context, duration_delta)
                            break
        else:
            if status_changed_to_done and todo.context:
                adjust_context_time(todo.context, effective_new_duration)
            elif status_changed_from_done and todo.context:
                adjust_context_time(todo.context, -effective_original_duration)
            elif todo.status == 'done' and duration_changed and todo.context:
                adjust_context_time(todo.context, effective_new_duration - effective_original_duration)
        
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


@app.route('/api/todos/<int:todo_id>/add-to-calendar', methods=['POST'])
def add_todo_to_calendar(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({
                'success': False,
                'message': 'Todo not found'
            }), 404
        
        data = request.get_json()
        previous_duration = get_todo_duration_minutes(todo)
        
        # Get date and time from request or use todo's due date/time
        event_date = data.get('date')
        event_time = data.get('time')
        duration_minutes = parse_duration_minutes(data.get('duration'))
        if duration_minutes is None or duration_minutes <= 0:
            duration_minutes = todo.duration_minutes or 60
        if duration_minutes <= 0:
            duration_minutes = 60

        start_date = None
        start_time = None
        if event_date:
            try:
                start_date = datetime.strptime(event_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid start date format'
                }), 400
        if event_time:
            try:
                start_time = datetime.strptime(event_time, '%H:%M').time()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid start time format'
                }), 400

        default_due_time = todo.due_time or get_default_due_time(todo.priority)
        if start_date and start_time:
            start_datetime = datetime.combine(start_date, start_time)
        elif start_date:
            start_datetime = datetime.combine(start_date, start_time or default_due_time)
        elif start_time and todo.due_date:
            start_datetime = datetime.combine(todo.due_date, start_time)
        elif start_time:
            start_datetime = datetime.combine(datetime.now().date(), start_time)
        elif todo.due_date:
            due_reference = datetime.combine(todo.due_date, default_due_time)
            start_datetime = due_reference - timedelta(minutes=duration_minutes)
        else:
            start_datetime = datetime.now().replace(second=0, microsecond=0)

        end_datetime = start_datetime + timedelta(minutes=duration_minutes)
        
        # Ensure todo only has one linked event
        for existing_event in list(todo.calendar_events):
            todo.calendar_events.remove(existing_event)
            db.session.delete(existing_event)

        # Create event
        new_event = Event(
            context_id=todo.context_id,
            title=todo.title,
            description=todo.description or '',
            start_date=start_datetime,
            end_date=end_datetime,
            all_day=False,
            tags=todo.tags or [],
            completed=todo.status == 'done'
        )
        
        db.session.add(new_event)
        db.session.flush()  # Get the event ID
        
        # Link todo to event (many-to-many)
        todo.calendar_events.append(new_event)
        todo.duration_minutes = duration_minutes

        if todo.context and todo.status == 'done':
            new_duration = duration_minutes or get_event_duration_minutes(new_event)
            diff = (new_duration or 0) - (previous_duration or 0)
            if diff:
                adjust_context_time(todo.context, diff)

        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'todo': todo.to_dict(),
                'event': new_event.to_dict()
            },
            'message': 'Todo added to calendar successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error adding todo to calendar: {str(e)}'
        }), 500


@app.route('/api/todos/<int:todo_id>/events/<int:event_id>/unlink', methods=['DELETE'])
def unlink_todo_from_event(todo_id, event_id):
    try:
        todo = Todo.query.get(todo_id)
        event = Event.query.get(event_id)

        if not todo or not event:
            return jsonify({
                'success': False,
                'message': 'Todo or Event not found'
            }), 404

        keep_event = request.args.get('keepEvent', 'false').lower() == 'true'

        removed = False
        was_completed = event.completed
        duration_minutes = get_event_duration_minutes(event)
        event_context = event.context
        if event in todo.calendar_events:
            todo.calendar_events.remove(event)
            removed = True

        action_message = 'Todo unlinked from event' if removed else 'Event deleted'

        if not keep_event:
            # Delete the event to fully remove it from the calendar when detached
            db.session.delete(event)
            should_adjust_time = (
                was_completed
                and event_context
                and (not todo or todo.status != 'done')
            )
            if should_adjust_time:
                adjust_context_time(event_context, -duration_minutes)
        else:
            action_message = 'Todo unlinked from event'

        db.session.commit()

        return jsonify({
            'success': True,
            'message': action_message
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error unlinking todo and event: {str(e)}'
        }), 500


@app.route('/api/todos/overdue', methods=['GET'])
def get_overdue_todos():
    try:
        context_id = request.args.get('contextId')
        
        # Get current date and time
        now = datetime.now()
        
        query = Todo.query.filter(
            Todo.status != 'done',
            Todo.due_date.isnot(None)
        )
        
        if context_id:
            query = query.filter_by(context_id=int(context_id))
        
        todos = query.all()
        
        # Filter overdue todos
        overdue_todos = []
        for todo in todos:
            if todo.due_time:
                # Has specific time - check datetime
                due_datetime = datetime.combine(todo.due_date, todo.due_time)
                if due_datetime < now:
                    overdue_todos.append(todo)
            else:
                # No time - check if date is in past
                if todo.due_date < now.date():
                    overdue_todos.append(todo)
        
        return jsonify({
            'success': True,
            'data': [todo.to_dict() for todo in overdue_todos],
            'count': len(overdue_todos)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching overdue todos: {str(e)}'
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

        preserve_time = request.args.get('preserveTime', 'false').lower() == 'true'
        duration_minutes = get_todo_duration_minutes(todo)
        should_adjust_time = (
            todo.context
            and todo.status == 'done'
            and duration_minutes
            and duration_minutes > 0
            and not preserve_time
        )

        db.session.delete(todo)
        if should_adjust_time:
            adjust_context_time(todo.context, -duration_minutes)
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
