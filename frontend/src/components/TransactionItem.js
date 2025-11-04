import { useState } from 'react';
import { TrendingUp, TrendingDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const TransactionItem = ({ transaction, index, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-all animate-slideIn group relative"
      style={{ 
        animationDelay: `${(index % 5) * 50}ms`,
        animationFillMode: 'both'
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
          transaction.type === 'income' ? 'bg-emerald-100/80' : 'bg-rose-100/80'
        }`}>
          {transaction.type === 'income' ? (
            <TrendingUp size={14} className="text-emerald-600 sm:w-4 sm:h-4" />
          ) : (
            <TrendingDown size={14} className="text-rose-600 sm:w-4 sm:h-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
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
      <div className="flex items-center gap-2">
        <p className={`text-sm sm:text-base font-semibold flex-shrink-0 ${
          transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
        </p>
        
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-200 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} className="text-slate-500" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit(transaction);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left text-sm text-slate-700"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(transaction.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-sm text-red-600"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;