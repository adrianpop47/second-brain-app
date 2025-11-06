#!/usr/bin/env python3
"""
Database Migration - Add Calendar Features
Adds:
- due_time to todos
- Many-to-many relationship between todos and events
- completed, recurring fields to events
"""

import os
from app import app
from models import db

def migrate_database():
    """Run database migration"""
    with app.app_context():
        print("🔄 Running database migration...")
        print("   Adding new fields for calendar integration...")
        
        try:
            # Drop all tables and recreate (WARNING: This deletes all data!)
            print("\n⚠️  WARNING: This will delete all existing data!")
            
            print("\n📊 Dropping existing tables...")
            db.drop_all()
            
            print("📊 Creating new tables with updated schema...")
            db.create_all()
            
            print("\n✅ Migration completed successfully!")
            print("\n📝 New schema includes:")
            print("   Todos:")
            print("   - due_time (optional time for due date)")
            print("\n   Events:")
            print("   - completed (track if event is done)")
            print("   - recurring (is this a recurring event)")
            print("   - recurrence_type (daily/weekly/monthly/yearly)")
            print("   - recurrence_end_date (when recurring stops)")
            print("\n   todo_event_links:")
            print("   - Many-to-many relationship table")
            
            print("\n💡 Next step: Run init_db.py to seed sample data")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
            db.session.rollback()


def main():
    print("\n" + "="*60)
    print("🗄️  Second Brain - Calendar Migration")
    print("="*60 + "\n")
    
    # Check if DATABASE_URL is set
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("   Please create a .env file with your database URL")
        return
    
    migrate_database()
    
    print("\n" + "="*60)
    print("✅ Migration process complete!")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()