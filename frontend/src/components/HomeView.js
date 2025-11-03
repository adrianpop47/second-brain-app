
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';

const HomeView = ({ 
  summaryStats, 
  contextData,
  onQuickAdd,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Home</h2>
          <p className="text-sm text-slate-500">All contexts overview</p>
        </div>
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow"
        >
          <Plus size={18} />
          <span className="font-medium">Quick Add</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={TrendingUp}
          label="Total Income"
          value={`$${summaryStats.total_income?.toFixed(2) || '0.00'}`}
          variant="income"
        />
        
        <StatCard 
          icon={TrendingDown}
          label="Total Expenses"
          value={`$${summaryStats.total_expenses?.toFixed(2) || '0.00'}`}
          variant="expense"
        />
        
        <StatCard 
          icon={Wallet}
          label="Balance"
          value={`$${summaryStats.balance?.toFixed(2) || '0.00'}`}
          variant="balance"
        />

        <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Plus size={14} className="text-white sm:w-4 sm:h-4" />
            </div>
            <span className="text-xs font-medium text-white/90">Todos</span>
          </div>
          <p className="text-lg sm:text-2xl font-semibold text-white">0</p>
          <p className="text-xs text-white/75 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Expenses by Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={contextData} title="Expenses by Context" />
        
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">• Create your first context to get started</p>
            <p className="text-sm text-slate-600">• Add transactions to track your finances</p>
            <p className="text-sm text-slate-600">• Organize everything by context</p>
            <p className="text-sm text-slate-600 mt-4 text-indigo-600 font-medium">💡 Tip: Use tags to categorize your transactions!</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-semibold text-slate-800 mb-1">Todos</h3>
          <p className="text-xs text-slate-500">Kanban board coming soon</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50 text-center">
          <div className="text-4xl mb-2">💡</div>
          <h3 className="font-semibold text-slate-800 mb-1">Ideas</h3>
          <p className="text-xs text-slate-500">Capture your thoughts</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50 text-center">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="font-semibold text-slate-800 mb-1">Calendar</h3>
          <p className="text-xs text-slate-500">Schedule your events</p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;