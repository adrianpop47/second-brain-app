#!/usr/bin/env python3
"""
Database Migration - Add Calendar Features (FIXED with CASCADE)
Properly handles existing foreign key constraints
"""

import os
from app import app
from models import db
from sqlalchemy import text

def migrate_database():
    """Run database migration with proper cascade"""
    with app.app_context():
        print("🔄 Running database migration...")
        print("   Adding new fields for calendar integration...")
        
        try:
            print("\n⚠️  WARNING: This will delete all existing data!")
            
            print("\n📊 Dropping existing tables with CASCADE...")
            
            # Drop tables manually with CASCADE to handle foreign key dependencies
            try:
                db.session.execute(text('DROP TABLE IF EXISTS todo_event_links CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS todos CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS events CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS transactions CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS ideas CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS contexts CASCADE'))
                db.session.commit()
                print("   ✓ Old tables dropped successfully")
            except Exception as e:
                print(f"   ⚠️  Warning during drop: {e}")
                db.session.rollback()
            
            print("\n📊 Creating new tables with updated schema...")
            db.create_all()
            db.session.commit()
            
            print("\n✅ Migration completed successfully!")
            print("\n📝 New schema includes:")
            print("\n   Contexts Table:")
            print("   - id, name, emoji, color, created_at")
            
            print("\n   Todos Table:")
            print("   - id, context_id, title, description, status, priority")
            print("   - due_date, due_time ← NEW!")
            print("   - tags, created_at, updated_at")
            
            print("\n   Events Table (NEW):")
            print("   - id, context_id, title, description")
            print("   - start_date, end_date, all_day")
            print("   - completed, recurring, recurrence_type, recurrence_end_date")
            print("   - tags, created_at")
            
            print("\n   todo_event_links Table (NEW - Many-to-Many):")
            print("   - todo_id, event_id, created_at")
            
            print("\n   Transactions Table:")
            print("   - id, context_id, type, amount, description, tags, date, created_at")
            
            print("\n   Ideas Table:")
            print("   - id, context_id, title, description, tags, created_at, updated_at")
            
            print("\n💡 Next step: Run init_db.py to seed sample data")
            print("   Command: python init_db.py")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
            db.session.rollback()
            raise


def main():
    print("\n" + "="*60)
    print("🗄️  Second Brain - Calendar Migration (Fixed)")
    print("="*60 + "\n")
    
    # Check if DATABASE_URL is set
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("   Please create a .env file with your database URL")
        return
    
    try:
        migrate_database()
        
        print("\n" + "="*60)
        print("✅ Migration process complete!")
        print("="*60 + "\n")
        
    except Exception as e:
        print("\n" + "="*60)
        print("❌ Migration failed!")
        print("="*60)
        print(f"\nError: {str(e)}\n")


if __name__ == '__main__':
    main()