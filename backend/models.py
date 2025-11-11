from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Context(db.Model):
    __tablename__ = 'contexts'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(50), default='Briefcase')
    color = db.Column(db.String(7), default='#000000')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', back_populates='context', cascade='all, delete-orphan')
    todos = db.relationship('Todo', back_populates='context', cascade='all, delete-orphan')
    ideas = db.relationship('Idea', back_populates='context', cascade='all, delete-orphan')
    events = db.relationship('Event', back_populates='context', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'emoji': self.emoji,
            'color': self.color,
            'createdAt': self.created_at.strftime('%Y-%m-%d')
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    context_id = db.Column(db.Integer, db.ForeignKey('contexts.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    tags = db.Column(db.JSON, default=list)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    context = db.relationship('Context', back_populates='transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'contextId': self.context_id,
            'type': self.type,
            'amount': self.amount,
            'description': self.description,
            'tags': self.tags or [],
            'date': self.date.strftime('%Y-%m-%d')
        }


class Todo(db.Model):
    __tablename__ = 'todos'
    
    id = db.Column(db.Integer, primary_key=True)
    context_id = db.Column(db.Integer, db.ForeignKey('contexts.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='todo')  # 'todo', 'in_progress', 'done'
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high'
    due_date = db.Column(db.Date)
    due_time = db.Column(db.Time)  # Optional time for due date
    tags = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    context = db.relationship('Context', back_populates='todos')
    calendar_events = db.relationship('Event', secondary='todo_event_links', back_populates='linked_todos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'contextId': self.context_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'dueDate': self.due_date.strftime('%Y-%m-%d') if self.due_date else '',
            'dueTime': self.due_time.strftime('%H:%M') if self.due_time else '',
            'tags': self.tags or [],
            'createdAt': self.created_at.strftime('%Y-%m-%d'),
            'calendarEventIds': [event.id for event in self.calendar_events],
            'calendarEventId': self.calendar_events[0].id if self.calendar_events else None
        }


# Many-to-many relationship table for Todo <-> Event
todo_event_links = db.Table('todo_event_links',
    db.Column('todo_id', db.Integer, db.ForeignKey('todos.id'), primary_key=True),
    db.Column('event_id', db.Integer, db.ForeignKey('events.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class Idea(db.Model):
    __tablename__ = 'ideas'
    
    id = db.Column(db.Integer, primary_key=True)
    context_id = db.Column(db.Integer, db.ForeignKey('contexts.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    tags = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    context = db.relationship('Context', back_populates='ideas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'contextId': self.context_id,
            'title': self.title,
            'description': self.description,
            'tags': self.tags or [],
            'createdAt': self.created_at.strftime('%Y-%m-%d')
        }


class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    context_id = db.Column(db.Integer, db.ForeignKey('contexts.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime)
    all_day = db.Column(db.Boolean, default=False)
    tags = db.Column(db.JSON, default=list)
    completed = db.Column(db.Boolean, default=False)  # Track if event is completed
    recurring = db.Column(db.Boolean, default=False)  # Is this a recurring event
    recurrence_type = db.Column(db.String(20))  # 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end_date = db.Column(db.Date)  # When recurring stops
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    context = db.relationship('Context', back_populates='events')
    linked_todos = db.relationship('Todo', secondary='todo_event_links', back_populates='calendar_events')
    
    def to_dict(self):
        return {
            'id': self.id,
            'contextId': self.context_id,
            'title': self.title,
            'description': self.description,
            'startDate': self.start_date.isoformat(),
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'allDay': self.all_day,
            'tags': self.tags or [],
            'completed': self.completed,
            'recurring': self.recurring,
            'recurrenceType': self.recurrence_type,
            'recurrenceEndDate': self.recurrence_end_date.strftime('%Y-%m-%d') if self.recurrence_end_date else None,
            'createdAt': self.created_at.strftime('%Y-%m-%d'),
            'linkedTodoIds': [todo.id for todo in self.linked_todos],
            'linkedTodoId': self.linked_todos[0].id if self.linked_todos else None
        }
