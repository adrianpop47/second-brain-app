import React from 'react';
import TransactionItem from './TransactionItem';

const TransactionList = ({ 
  transactions, 
  visibleCount, 
  setVisibleCount, 
  totalCount 
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
      <div className="space-y-2.5 overflow-hidden">
        {transactions.slice(0, visibleCount).map((transaction, index) => (
          <TransactionItem 
            key={`${transaction.id}-${visibleCount}`}
            transaction={transaction} 
            index={index}
          />
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        {visibleCount < totalCount && (
          <button
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="flex-1 py-2.5 bg-slate-100/50 hover:bg-slate-200/50 text-slate-700 rounded-lg transition-all font-medium text-sm"
          >
            Show More
          </button>
        )}
        {visibleCount > 5 && (
          <button
            onClick={() => setVisibleCount(5)}
            className="flex-1 py-2.5 bg-slate-100/50 hover:bg-slate-200/50 text-slate-700 rounded-lg transition-all font-medium text-sm"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionList;