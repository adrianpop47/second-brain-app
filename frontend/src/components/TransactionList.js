import { useState } from 'react';
import { Search, X } from 'lucide-react';
import TransactionItem from './TransactionItem';

const TransactionList = ({ 
  transactions, 
  visibleCount, 
  setVisibleCount,
  onEdit,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    
    // Remove # from search query if user types it
    const query = searchQuery.toLowerCase().replace(/^#/, '');
    const description = (transaction.description || '').toLowerCase();
    const tags = (transaction.tags || []).map(t => t.toLowerCase()).join(' ');
    const amount = transaction.amount.toString();
    const type = transaction.type.toLowerCase();
    
    return description.includes(query) || 
           tags.includes(query) || 
           amount.includes(query) ||
           type.includes(query);
  });

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">All Transactions</h3>
        <span className="text-sm text-slate-500">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, tags, amount... (# optional)"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            {searchQuery ? 'No transactions found matching your search' : 'No transactions yet'}
          </p>
          {searchQuery && (
            <p className="text-slate-400 text-xs mt-1">
              Try searching without the # symbol
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2.5 overflow-hidden">
            {displayedTransactions.map((transaction, index) => (
              <TransactionItem 
                key={`${transaction.id}-${visibleCount}`}
                transaction={transaction} 
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* Show More/Less Buttons */}
          <div className="flex gap-2 mt-4">
            {visibleCount < filteredTransactions.length && (
              <button
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-medium text-sm"
              >
                Show More
              </button>
            )}
            {visibleCount > 5 && (
              <button
                onClick={() => setVisibleCount(5)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-medium text-sm"
              >
                Show Less
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionList;