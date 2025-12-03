import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';
import IncomeExpenseChart from './IncomeExpenseChart';
import TransactionList from './TransactionList';
import AddTransactionModal from './AddTransactionModal';
import PeriodSelector from './PeriodSelector';
import apiService from '../services/apiService';
import { showAppAlert } from '../utils/alertService';
import { confirmAction } from '../utils/confirmService';

const ContextFinances = ({ context, dateRange, setDateRange }) => {
  const [transactions, setTransactions] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0
  });
  const [tagData, setTagData] = useState([]);
  const [dailyChartData, setDailyChartData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    tags: [],
    description: '',
    date: new Date().toISOString().split('T')[0],
    contextId: context.id
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContextData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id, dateRange]);

  const fetchContextData = async () => {
    try {
      setLoading(true);

      const [
        transactionsRes,
        summaryRes,
        tagRes,
        dailyRes
      ] = await Promise.all([
        apiService.getContextTransactions(context.id, dateRange),
        apiService.getSummaryStats(dateRange, context.id),
        apiService.getStatsByTag(dateRange, context.id),
        apiService.getDailyStats(dateRange, context.id)
      ]);

      setTransactions(transactionsRes.data);
      setSummaryStats(summaryRes.data);
      setTagData(tagRes.data);
      setDailyChartData(dailyRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching context data:', err);
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount) {
      showAppAlert('Amount is required');
      return;
    }
    
    try {
      const transactionToAdd = {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        tags: Array.isArray(newTransaction.tags) ? newTransaction.tags : [],
        date: newTransaction.date,
        contextId: context.id
      };

      if (editingTransaction) {
        // Update existing transaction - use updateTransaction endpoint
        await apiService.updateTransaction(editingTransaction.id, transactionToAdd);
      } else {
        // Add new transaction
        await apiService.addTransaction(transactionToAdd);
      }

      // Refresh all data
      await fetchContextData();
      
      // Reset form and close modal
      setNewTransaction({
        type: 'expense',
        amount: '',
        tags: [],
        description: '',
        date: new Date().toISOString().split('T')[0],
        contextId: context.id
      });
      setEditingTransaction(null);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error saving transaction:', err);
      showAppAlert('Failed to save transaction: ' + err.message);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      amount: transaction.amount.toString(),
      tags: transaction.tags || [],
      description: transaction.description,
      date: transaction.date,
      contextId: context.id
    });
    setShowAddModal(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = await confirmAction({
      title: 'Delete transaction?',
      message: 'This transaction will be permanently removed.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.deleteTransaction(transactionId);
      await fetchContextData();
      showAppAlert('Transaction deleted', { type: 'info' });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      showAppAlert('Failed to delete transaction');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
    setNewTransaction({
      type: 'expense',
      amount: '',
      tags: [],
      description: '',
      date: new Date().toISOString().split('T')[0],
      contextId: context.id
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="my-4 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Finances</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track this field’s income, expenses, and running balance in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={dateRange} onChange={setDateRange} compact />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors bg-indigo-500 hover:bg-indigo-600"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>
        <div className="mt-4 h-px bg-slate-100" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          icon={TrendingUp}
          label="Income"
          value={`$${summaryStats.total_income?.toFixed(2) || '0.00'}`}
          variant="income"
        />
        
        <StatCard 
          icon={TrendingDown}
          label="Expenses"
          value={`$${summaryStats.total_expenses?.toFixed(2) || '0.00'}`}
          variant="expense"
        />
        
        <StatCard 
          icon={Wallet}
          label="Balance"
          value={`$${summaryStats.balance?.toFixed(2) || '0.00'}`}
          variant="balance"
        />

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={tagData} title="Expenses by Tag" />
        <IncomeExpenseChart data={dailyChartData} />
      </div>

      {/* Transactions */}
      <TransactionList 
        transactions={transactions}
        visibleCount={visibleTransactions}
        setVisibleCount={setVisibleTransactions}
        totalCount={transactions.length}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal 
        showModal={showAddModal}
        setShowModal={handleCloseModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onAdd={addTransaction}
        contextId={context.id}
        isEditing={!!editingTransaction}
      />
    </div>
  );
};

export default ContextFinances;
