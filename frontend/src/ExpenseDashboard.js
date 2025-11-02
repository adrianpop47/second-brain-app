import { useState, useEffect } from 'react';
import { Wallet, CheckSquare, Target, Bot, Plus, TrendingUp, TrendingDown, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import ExpenseChart from './components/ExpenseChart';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import PeriodSelector from './components/PeriodSelector';
import apiService from './services/apiService';

const ExpenseDashboard = () => {
  const [activeApp, setActiveApp] = useState('expenses');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
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
  const [summaryStats, setSummaryStats] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0
  });
  const [categoryData, setCategoryData] = useState([]);
  const [dailyChartData, setDailyChartData] = useState([]);
  const [defaultCategories, setDefaultCategories] = useState({
    expense: [],
    income: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apps = [
    { id: 'expenses', name: 'Expense Tracker', icon: Wallet },
    { id: 'todo', name: 'Todo List', icon: CheckSquare, disabled: true },
    { id: 'habits', name: 'Habit Tracker', icon: Target, disabled: true },
    { id: 'assistant', name: 'AI Assistant', icon: Bot, disabled: true },
  ];

  // Fetch all data when component mounts or dateRange changes
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]); 

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        transactionsRes,
        summaryRes,
        categoryRes,
        dailyRes,
        categoriesRes
      ] = await Promise.all([
        apiService.getTransactions(dateRange),
        apiService.getSummaryStats(dateRange),
        apiService.getCategoryStats(dateRange),
        apiService.getDailyStats(dateRange),
        apiService.getCategories()
      ]);

      setTransactions(transactionsRes.data);
      setSummaryStats(summaryRes.data);
      setCategoryData(categoryRes.data);
      setDailyChartData(dailyRes.data);
      setDefaultCategories(categoriesRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please make sure the backend is running.');
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) return;
    
    try {
      await apiService.addTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      });

      // Refresh all data after adding
      await fetchAllData();
      
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Failed to add transaction');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-lg max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-800">Connection Error</h3>
          </div>
          <p className="text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                    value={`$${summaryStats.total_income.toFixed(2)}`}
                    variant="income"
                  />
                  
                  <StatCard 
                    icon={TrendingDown}
                    label="Expenses"
                    value={`$${summaryStats.total_expenses.toFixed(2)}`}
                    variant="expense"
                  />
                  
                  <StatCard 
                    icon={Wallet}
                    label="Balance"
                    value={`$${summaryStats.balance.toFixed(2)}`}
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
                transactions={transactions}
                visibleCount={visibleTransactions}
                setVisibleCount={setVisibleTransactions}
                totalCount={transactions.length}
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