import { TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar, Wallet, Plus } from 'lucide-react';

const ContextOverview = ({ context, stats, recentTransactions, loading }) => {
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
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{context.name}</h2>
          <p className="text-sm text-slate-500">Context Overview</p>
        </div>
      </div>

      {/* Stats Cards - All white with consistent styling like Home */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100/80 rounded-lg">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Income</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_income?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-rose-100/80 rounded-lg">
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Expenses</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.total_expenses?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-100/80 rounded-lg">
              <Wallet size={18} className="text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Balance</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">${stats.balance?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100/80 rounded-lg">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Todos</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.todo_count || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Finances */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-slate-700" />
            Recent Finances
          </h3>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      transaction.type === 'income' ? 'bg-emerald-100/80' : 'bg-rose-100/80'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={14} className="text-emerald-600" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{transaction.description}</p>
                      <p className="text-xs text-slate-500">
                        {transaction.tags?.map(tag => `#${tag}`).join(' ')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ml-2 ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No transactions yet</p>
          )}
        </div>

        {/* Recent Todos */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare size={20} className="text-slate-700" />
            Active Todos
          </h3>
          <div className="text-center py-8">
            <CheckSquare size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Todos coming soon</p>
          </div>
        </div>

        {/* Recent Ideas */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-slate-700" />
            Recent Ideas
          </h3>
          <div className="text-center py-8">
            <Lightbulb size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Ideas coming soon</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-slate-700" />
            Upcoming Events
          </h3>
          <div className="text-center py-8">
            <Calendar size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Calendar coming soon</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Consistent button colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Primary action button - indigo */}
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow">
          <Plus size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Transaction</p>
        </button>
        
        {/* Disabled buttons - consistent gray style */}
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <CheckSquare size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Todo</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
        
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <Lightbulb size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Idea</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
        
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg p-4 text-left transition-all shadow-sm cursor-not-allowed" disabled>
          <Calendar size={20} className="mb-2" />
          <p className="text-sm font-medium">Add Event</p>
          <p className="text-xs mt-1">Soon</p>
        </button>
      </div>
    </div>
  );
};

export default ContextOverview;