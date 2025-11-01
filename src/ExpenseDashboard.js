import React, { useState } from 'react';
import { Wallet, CheckSquare, Target, Bot, Plus, TrendingUp, TrendingDown, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import ExpenseChart from './components/ExpenseChart';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import PeriodSelector from './components/PeriodSelector';

const ExpenseDashboard = () => {
  const [activeApp, setActiveApp] = useState('expenses');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'expense', amount: 45.50, category: 'Food', description: 'Grocery shopping', date: '2025-10-25' },
    { id: 2, type: 'income', amount: 2500, category: 'Salary', description: 'Monthly salary', date: '2025-10-24' },
    { id: 3, type: 'expense', amount: 120, category: 'Transport', description: 'Gas', date: '2025-10-23' },
    { id: 4, type: 'expense', amount: 85, category: 'Entertainment', description: 'Cinema tickets', date: '2025-10-22' },
    { id: 5, type: 'income', amount: 200, category: 'Freelance', description: 'Web design project', date: '2025-10-21' },
    { id: 6, type: 'expense', amount: 60, category: 'Food', description: 'Restaurant', date: '2025-10-20' },
    { id: 7, type: 'expense', amount: 150, category: 'Shopping', description: 'Clothes', date: '2025-10-19' },
    { id: 8, type: 'income', amount: 500, category: 'Freelance', description: 'Design project', date: '2025-10-18' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [dateRange, setDateRange] = useState('month');

  const defaultCategories = {
    expense: ['Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Education', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other']
  };

  const apps = [
    { id: 'expenses', name: 'Expense Tracker', icon: Wallet },
    { id: 'todo', name: 'Todo List', icon: CheckSquare, disabled: true },
    { id: 'habits', name: 'Habit Tracker', icon: Target, disabled: true },
    { id: 'assistant', name: 'AI Assistant', icon: Bot, disabled: true },
  ];

  const getFilteredTransactions = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch(dateRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }
    
    return transactions.filter(t => new Date(t.date) >= cutoffDate);
  };

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;
    
    setTransactions([
      {
        id: Date.now(),
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      },
      ...transactions
    ]);
    
    setNewTransaction({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
  };

  const filteredTransactions = getFilteredTransactions();
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const allCategories = [...new Set(transactions.map(t => t.category))];
  
  const categoryData = allCategories
    .map(cat => ({
      name: cat,
      value: filteredTransactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const dailyData = {};
  filteredTransactions.forEach(t => {
    const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, expenses: 0, income: 0 };
    }
    if (t.type === 'expense') {
      dailyData[dateKey].expenses += t.amount;
    } else {
      dailyData[dateKey].income += t.amount;
    }
  });
  
  const dailyChartData = Object.values(dailyData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 overflow-hidden">
      <div className="flex h-full">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <aside className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/50 flex flex-col shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar 
            apps={apps}
            activeApp={activeApp}
            setActiveApp={setActiveApp}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isDesktop={false}
          />
        </aside>
        
        <aside className={`hidden md:block bg-white/70 backdrop-blur-md flex-col shadow-sm flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 border-r border-slate-200/50' : 'w-0'
        }`}>
          <div className={`h-full flex flex-col ${sidebarOpen ? '' : 'invisible'}`}>
            <Sidebar 
              apps={apps}
              activeApp={activeApp}
              setActiveApp={setActiveApp}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isDesktop={true}
            />
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3 md:mb-0">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors md:hidden"
                  >
                    <Menu size={20} className="text-slate-600" />
                  </button>
                  {!sidebarOpen && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors hidden md:block"
                    >
                      <Menu size={20} className="text-slate-600" />
                    </button>
                  )}
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 flex-1">Financial Overview</h2>
                  
                  <PeriodSelector value={dateRange} onChange={setDateRange} />
                </div>
                
                <div className="relative md:hidden">
                  <PeriodSelector value={dateRange} onChange={setDateRange} />
                </div>
              </div>

              <div className="mb-6">
                <style>{`
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateX(-20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                  
                  .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                  }
                  
                  .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 1.5rem;
                  }
                  @media (min-width: 640px) {
                    .stats-grid {
                      grid-template-columns: repeat(2, 1fr);
                    }
                  }
                  @media (min-width: 768px) {
                    .stats-grid {
                      grid-template-columns: repeat(4, 1fr);
                    }
                  }
                  .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 1.5rem;
                  }
                  @media (min-width: 768px) {
                    .charts-grid {
                      grid-template-columns: repeat(2, 1fr);
                    }
                  }
                  
                  /* Adjustments when sidebar is open on desktop */
                  ${sidebarOpen ? `
                    @media (min-width: 768px) and (max-width: 1100px) {
                      .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                      }
                    }
                    @media (min-width: 1100px) {
                      .stats-grid {
                        grid-template-columns: repeat(4, 1fr);
                      }
                    }
                    @media (min-width: 768px) and (max-width: 1100px) {
                      .charts-grid {
                        grid-template-columns: repeat(1, 1fr);
                      }
                    }
                    @media (min-width: 1100px) {
                      .charts-grid {
                        grid-template-columns: repeat(2, 1fr);
                      }
                    }
                  ` : ''}
                `}</style>
                <div className="stats-grid mb-6">
                  <StatCard 
                    icon={TrendingUp}
                    label="Income"
                    value={`$${totalIncome.toFixed(2)}`}
                    variant="income"
                  />
                  
                  <StatCard 
                    icon={TrendingDown}
                    label="Expenses"
                    value={`$${totalExpenses.toFixed(2)}`}
                    variant="expense"
                  />
                  
                  <StatCard 
                    icon={Wallet}
                    label="Balance"
                    value={`$${balance.toFixed(2)}`}
                    variant="balance"
                  />

                  <StatCard 
                    icon={Plus}
                    label="Action"
                    value="Add Transaction"
                    variant="action"
                    onClick={() => setShowAddModal(true)}
                  />
                </div>
              </div>

              <div className="charts-grid mb-6">
                <ExpenseChart data={categoryData} />
                <IncomeExpenseChart data={dailyChartData} />
              </div>

              <TransactionList 
                transactions={filteredTransactions}
                visibleCount={visibleTransactions}
                setVisibleCount={setVisibleTransactions}
                totalCount={filteredTransactions.length}
              />
            </div>
          </div>
        </div>
      </div>

      <AddTransactionModal 
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onAdd={addTransaction}
        defaultCategories={defaultCategories}
      />
    </div>
  );
};

export default ExpenseDashboard;