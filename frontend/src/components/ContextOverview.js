import { TrendingUp, TrendingDown, CheckSquare, Lightbulb, Calendar } from 'lucide-react';

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
        <span className="text-4xl">{context.emoji}</span>
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{context.name}</h2>
          <p className="text-sm text-slate-500">Context Overview</p>
        </div>
      </div>

      {/* Stats Cards */}
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
            <div className="p-2 bg-blue-100/80 rounded-lg">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Todos</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.todo_count || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Coming soon</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-100/80 rounded-lg">
              <Lightbulb size={18} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Ideas</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.idea_count || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Finances */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>💰</span> Recent Finances
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
            <span>✅</span> Active Todos
          </h3>
          <div className="text-center py-8">
            <CheckSquare size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Todos coming soon</p>
          </div>
        </div>

        {/* Recent Ideas */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>💡</span> Recent Ideas
          </h3>
          <div className="text-center py-8">
            <Lightbulb size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Ideas coming soon</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>📅</span> Upcoming Events
          </h3>
          <div className="text-center py-8">
            <Calendar size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Calendar coming soon</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button className="bg-gradient-to-br from-blue-500/90 to-cyan-500/90 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow">
          <p className="text-sm font-medium">Add Transaction</p>
        </button>
        <button className="bg-gradient-to-br from-emerald-500/90 to-teal-500/90 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow opacity-50 cursor-not-allowed">
          <p className="text-sm font-medium">Add Todo</p>
          <p className="text-xs mt-1 opacity-75">Soon</p>
        </button>
        <button className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow opacity-50 cursor-not-allowed">
          <p className="text-sm font-medium">Add Idea</p>
          <p className="text-xs mt-1 opacity-75">Soon</p>
        </button>
        <button className="bg-gradient-to-br from-orange-500/90 to-red-500/90 hover:from-orange-600 hover:to-red-600 text-white rounded-lg p-4 text-left transition-all shadow-sm hover:shadow opacity-50 cursor-not-allowed">
          <p className="text-sm font-medium">Add Event</p>
          <p className="text-xs mt-1 opacity-75">Soon</p>
        </button>
      </div>
    </div>
  );
};

export default ContextOverview;