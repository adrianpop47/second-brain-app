import { TrendingUp, TrendingDown } from 'lucide-react';

const TransactionItem = ({ transaction, index }) => {
  return (
    <div
      className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-all animate-slideIn"
      style={{ 
        animationDelay: `${(index % 5) * 50}ms`,
        animationFillMode: 'both'
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
          transaction.type === 'income' ? 'bg-emerald-100/80' : 'bg-rose-100/80'
        }`}>
          {transaction.type === 'income' ? (
            <TrendingUp size={14} className="text-emerald-600 sm:w-4 sm:h-4" />
          ) : (
            <TrendingDown size={14} className="text-rose-600 sm:w-4 sm:h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 text-xs sm:text-sm truncate">
            {transaction.description || 'Untitled'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {transaction.tags && transaction.tags.length > 0 ? (
              <p className="text-xs text-slate-500">
                {transaction.tags.map(tag => `#${tag}`).join(' ')}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No tags</p>
            )}
            <span className="text-xs text-slate-400">•</span>
            <p className="text-xs text-slate-500">
              {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <p className={`text-sm sm:text-base font-semibold flex-shrink-0 ml-2 ${
        transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
      }`}>
        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
      </p>
    </div>
  );
};

export default TransactionItem;