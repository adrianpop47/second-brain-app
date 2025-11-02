#!/usr/bin/env python3
"""
API Test Script
Tests all Flask API endpoints to verify they're working correctly
"""

import requests
import json
from datetime import datetime
import os

BASE_URL = os.getenv("API_URL", "http://localhost:5000/api")

def print_test(name, passed, message=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if message:
        print(f"   {message}")
    print()

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()
        passed = response.status_code == 200 and data.get('status') == 'healthy'
        print_test("Health Check", passed, f"Status: {data.get('status')}")
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False

def test_get_transactions():
    """Test getting all transactions"""
    try:
        response = requests.get(f"{BASE_URL}/transactions")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        count = data.get('count', 0)
        print_test("Get Transactions", passed, f"Retrieved {count} transactions")
        return passed
    except Exception as e:
        print_test("Get Transactions", False, str(e))
        return False

def test_get_transactions_with_range():
    """Test getting transactions with date range filter"""
    try:
        response = requests.get(f"{BASE_URL}/transactions?range=week")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        count = data.get('count', 0)
        print_test("Get Transactions (Week Range)", passed, f"Retrieved {count} transactions")
        return passed
    except Exception as e:
        print_test("Get Transactions (Week Range)", False, str(e))
        return False

def test_add_transaction():
    """Test adding a new transaction"""
    try:
        new_transaction = {
            "type": "expense",
            "amount": 25.99,
            "category": "Food",
            "description": "Test transaction",
            "date": datetime.now().strftime('%Y-%m-%d')
        }
        
        response = requests.post(
            f"{BASE_URL}/transactions",
            json=new_transaction,
            headers={'Content-Type': 'application/json'}
        )
        data = response.json()
        passed = response.status_code == 201 and data.get('success') == True
        transaction_id = data.get('data', {}).get('id', 'N/A')
        print_test("Add Transaction", passed, f"Transaction ID: {transaction_id}")
        return passed, transaction_id if passed else None
    except Exception as e:
        print_test("Add Transaction", False, str(e))
        return False, None

def test_get_summary_stats():
    """Test getting summary statistics"""
    try:
        response = requests.get(f"{BASE_URL}/stats/summary")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        stats = data.get('data', {})
        print_test(
            "Get Summary Stats", 
            passed, 
            f"Income: ${stats.get('total_income', 0)}, Expenses: ${stats.get('total_expenses', 0)}, Balance: ${stats.get('balance', 0)}"
        )
        return passed
    except Exception as e:
        print_test("Get Summary Stats", False, str(e))
        return False

def test_get_category_stats():
    """Test getting category statistics"""
    try:
        response = requests.get(f"{BASE_URL}/stats/categories")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        categories = len(data.get('data', []))
        print_test("Get Category Stats", passed, f"Found {categories} categories")
        return passed
    except Exception as e:
        print_test("Get Category Stats", False, str(e))
        return False

def test_get_daily_stats():
    """Test getting daily statistics"""
    try:
        response = requests.get(f"{BASE_URL}/stats/daily")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        days = len(data.get('data', []))
        print_test("Get Daily Stats", passed, f"Retrieved {days} days of data")
        return passed
    except Exception as e:
        print_test("Get Daily Stats", False, str(e))
        return False

def test_get_categories():
    """Test getting available categories"""
    try:
        response = requests.get(f"{BASE_URL}/categories")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        categories = data.get('data', {})
        expense_count = len(categories.get('expense', []))
        income_count = len(categories.get('income', []))
        print_test(
            "Get Categories", 
            passed, 
            f"Expense: {expense_count}, Income: {income_count}"
        )
        return passed
    except Exception as e:
        print_test("Get Categories", False, str(e))
        return False

def test_delete_transaction(transaction_id):
    """Test deleting a transaction"""
    if not transaction_id:
        print_test("Delete Transaction", False, "No transaction ID provided (skipped)")
        return False
    
    try:
        response = requests.delete(f"{BASE_URL}/transactions/{transaction_id}")
        data = response.json()
        passed = response.status_code == 200 and data.get('success') == True
        print_test("Delete Transaction", passed, f"Deleted transaction {transaction_id}")
        return passed
    except Exception as e:
        print_test("Delete Transaction", False, str(e))
        return False

def main():
    print("\n" + "="*50)
    print("🧪 Testing Flask API Endpoints")
    print("="*50 + "\n")
    
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/health", timeout=2)
    except:
        print("❌ Cannot connect to Flask server!")
        print("   Make sure the server is running on http://localhost:5000")
        print("   Run: python app.py")
        return
    
    results = []
    
    # Run all tests
    print("Running tests...\n")
    
    results.append(test_health_check())
    results.append(test_get_transactions())
    results.append(test_get_transactions_with_range())
    
    add_passed, transaction_id = test_add_transaction()
    results.append(add_passed)
    
    results.append(test_get_summary_stats())
    results.append(test_get_category_stats())
    results.append(test_get_daily_stats())
    results.append(test_get_categories())
    
    # Test delete with the transaction we just created
    if add_passed and transaction_id:
        results.append(test_delete_transaction(transaction_id))
    
    # Print summary
    print("="*50)
    passed_count = sum(results)
    total_count = len(results)
    percentage = (passed_count / total_count * 100) if total_count > 0 else 0
    
    print(f"📊 Test Summary: {passed_count}/{total_count} passed ({percentage:.1f}%)")
    
    if passed_count == total_count:
        print("✅ All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    print("="*50 + "\n")

if __name__ == "__main__":
    main()