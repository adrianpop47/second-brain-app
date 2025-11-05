#!/usr/bin/env python3
"""
Database Initialization Script
Creates all tables and optionally seeds with sample data
"""

import os
from datetime import datetime, timedelta
from app import app
from models import db, Context, Transaction, Todo

def init_db():
    """Initialize the database and create all tables"""
    with app.app_context():
        print("🗄️  Dropping existing tables...")
        db.drop_all()
        
        print("📊 Creating new tables...")
        db.create_all()
        
        print("✅ Database tables created successfully!")


def seed_data():
    """Seed the database with sample data"""
    with app.app_context():
        print("🌱 Seeding sample data...")
        
        # Create Contexts
        business = Context(
            name='Business',
            emoji='Briefcase',
            color='#000000',
            created_at=datetime(2025, 10, 1)
        )
        
        fitness = Context(
            name='Fitness',
            emoji='Dumbbell',
            color='#000000',
            created_at=datetime(2025, 10, 1)
        )
        
        health = Context(
            name='Health',
            emoji='Heart',
            color='#000000',
            created_at=datetime(2025, 10, 1)
        )
        
        db.session.add_all([business, fitness, health])
        db.session.commit()
        
        print("  ✓ Created 3 contexts")
        
        # Create Transactions
        transactions = [
            Transaction(
                context_id=business.id,
                type='expense',
                amount=45.50,
                description='Software subscription',
                tags=['software', 'monthly'],
                date=datetime(2025, 10, 25).date()
            ),
            Transaction(
                context_id=business.id,
                type='income',
                amount=2500,
                description='Monthly salary',
                tags=['salary', 'monthly'],
                date=datetime(2025, 10, 24).date()
            ),
            Transaction(
                context_id=business.id,
                type='expense',
                amount=120,
                description='Office rent',
                tags=['rent', 'office'],
                date=datetime(2025, 10, 23).date()
            ),
            Transaction(
                context_id=fitness.id,
                type='expense',
                amount=85,
                description='Gym membership',
                tags=['gym', 'membership'],
                date=datetime(2025, 10, 22).date()
            ),
            Transaction(
                context_id=business.id,
                type='income',
                amount=200,
                description='Web design project',
                tags=['client', 'project'],
                date=datetime(2025, 10, 21).date()
            ),
            Transaction(
                context_id=fitness.id,
                type='expense',
                amount=60,
                description='Protein powder',
                tags=['supplements'],
                date=datetime(2025, 10, 20).date()
            ),
            Transaction(
                context_id=health.id,
                type='expense',
                amount=150,
                description='Doctor visit',
                tags=['doctor', 'checkup'],
                date=datetime(2025, 10, 19).date()
            ),
            Transaction(
                context_id=business.id,
                type='income',
                amount=500,
                description='Design project',
                tags=['client', 'project'],
                date=datetime(2025, 10, 18).date()
            ),
        ]
        
        db.session.add_all(transactions)
        db.session.commit()
        
        print("  ✓ Created 8 transactions")
        
        # Create Todos
        todos = [
            Todo(
                context_id=business.id,
                title='Complete project proposal',
                description='Write and submit the Q4 project proposal to the client',
                status='todo',
                priority='high',
                due_date=(datetime.now() + timedelta(days=10)).date(),
                tags=['client', 'urgent']
            ),
            Todo(
                context_id=business.id,
                title='Review team performance',
                description='Schedule 1-on-1 meetings with team members',
                status='in_progress',
                priority='medium',
                due_date=(datetime.now() + timedelta(days=5)).date(),
                tags=['management', 'team']
            ),
            Todo(
                context_id=fitness.id,
                title='Morning workout routine',
                description='30 minutes cardio + strength training',
                status='done',
                priority='high',
                due_date=datetime.now().date(),
                tags=['daily', 'health']
            ),
        ]
        
        db.session.add_all(todos)
        db.session.commit()
        
        print("  ✓ Created 3 todos")
        
        print("\n✅ Sample data seeded successfully!")


def main():
    auto_seed = os.getenv("AUTO_SEED", "false").lower() == "true"
    init_db()
    if auto_seed:
        seed_data()


if __name__ == '__main__':
    main()