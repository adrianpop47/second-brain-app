import { useState } from 'react';
import { X } from 'lucide-react';

const AddTransactionModal = ({ 
  showModal, 
  setShowModal, 
  newTransaction, 
  setNewTransaction, 
  onAdd,
  contextId, // If provided, transaction is for specific context
  contexts = [] // For selecting context if not in a specific context
}) => {
  const [tagInput, setTagInput] = useState('');

  if (!showModal) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, ''); // Remove # if user typed it
      if (tag && !newTransaction.tags?.includes(tag)) {
        setNewTransaction({
          ...newTransaction,
          tags: [...(newTransaction.tags || []), tag]
        });
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setNewTransaction({
      ...newTransaction,
      tags: newTransaction.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Add Transaction</h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Context Selector (only if not in a specific context) */}
          {!contextId && contexts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Context</label>
              <select
                value={newTransaction.contextId || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, contextId: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              >
                <option value="">Select context</option>
                {contexts.map(ctx => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.emoji} {ctx.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                className={`flex-1 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  newTransaction.type === 'expense'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                className={`flex-1 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  newTransaction.type === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
            <input
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newTransaction.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Type tag and press Enter (e.g., software, monthly)"
            />
            <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add a tag</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <input
              type="text"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Enter description"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          <button
            onClick={onAdd}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;