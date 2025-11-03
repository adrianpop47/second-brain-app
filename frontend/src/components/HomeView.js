import { Wallet, TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar } from 'lucide-react';
import StatCard from './StatCard';
import ExpenseChart from './ExpenseChart';

const HomeView = ({ 
  summaryStats, 
  contextData,
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
      </div>

      {/* Stats Cards - All white with colored icon backgrounds */}
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
          label="Total Balance"
          value={`$${summaryStats.balance?.toFixed(2) || '0.00'}`}
          variant="balance"
        />

        <StatCard 
          icon={CheckSquare}
          label="Active Todos"
          value="0"
          variant="todos"
          comingSoon={true}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Context */}
        <ExpenseChart data={contextData} title="Expenses by Context" />
        
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Getting Started</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Create Contexts</p>
                <p className="text-xs text-slate-600 mt-0.5">Organize your life into different areas (Work, Health, Personal, etc.)</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Track Your Finances</p>
                <p className="text-xs text-slate-600 mt-0.5">Add income and expenses to each context with custom tags</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Stay Organized</p>
                <p className="text-xs text-slate-600 mt-0.5">Use tags to categorize transactions and track spending patterns</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={16} className="text-blue-600" />
                <p className="text-sm font-semibold text-slate-800">Pro Tip</p>
              </div>
              <p className="text-xs text-slate-600">Click on a context in the sidebar to see detailed stats, finances, and more. Todos, Ideas, and Calendar are coming soon!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Preview */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-6 border border-slate-200/50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center border border-slate-200/50">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <CheckSquare size={24} className="text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Todos</h4>
            <p className="text-xs text-slate-600">Kanban board with drag & drop</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center border border-slate-200/50">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <Lightbulb size={24} className="text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Ideas</h4>
            <p className="text-xs text-slate-600">Capture and organize thoughts</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center border border-slate-200/50">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <Calendar size={24} className="text-orange-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Calendar</h4>
            <p className="text-xs text-slate-600">Schedule events and deadlines</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;