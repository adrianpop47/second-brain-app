import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const AddTransactionModal = ({ 
  showModal, 
  setShowModal, 
  newTransaction, 
  setNewTransaction, 
  onAdd,
  contextId,
  contexts = []
}) => {
  const [tagInput, setTagInput] = useState('');
  const [showNegativeWarning, setShowNegativeWarning] = useState(false);

  useEffect(() => {
    if (showModal && !newTransaction.tags) {
      setNewTransaction(prev => ({
        ...prev,
        tags: []
      }));
    }
  }, [showModal, newTransaction.tags, setNewTransaction]);

  if (!showModal) return null;

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    // Check if negative
    if (numValue < 0) {
      setShowNegativeWarning(true);
      // Convert to positive
      setNewTransaction(prev => ({ ...prev, amount: Math.abs(numValue).toString() }));
      // Hide warning after 3 seconds
      setTimeout(() => setShowNegativeWarning(false), 3000);
    } else {
      setShowNegativeWarning(false);
      setNewTransaction(prev => ({ ...prev, amount: value }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
      
      if (tag) {
        const currentTags = newTransaction.tags || [];
        if (!currentTags.includes(tag)) {
          setNewTransaction(prev => ({
            ...prev,
            tags: [...currentTags, tag]
          }));
        }
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = newTransaction.tags || [];
    setNewTransaction(prev => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation: ensure amount is positive
    const amount = parseFloat(newTransaction.amount);
    if (amount < 0) {
      setNewTransaction(prev => ({ ...prev, amount: Math.abs(amount).toString() }));
    }
    
    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Add Transaction</h3>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Context Selector */}
          {!contextId && contexts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Context</label>
              <select
                value={newTransaction.contextId || ''}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, contextId: parseInt(e.target.value) }))}
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
                type="button"
                onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                className={`flex-1 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  newTransaction.type === 'expense'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
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
              step="0.01"
              min="0"
              value={newTransaction.amount}
              onChange={handleAmountChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="0.00"
              required
            />
            {showNegativeWarning && (
              <div className="flex items-center gap-2 mt-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertCircle size={14} />
                <span>Amount converted to positive. Use the Type selector above for income/expense.</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={newTransaction.description || ''}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Enter title"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {(newTransaction.tags || []).length > 0 ? (
                (newTransaction.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 py-1">No tags added yet</span>
              )}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Type tag and press Enter (e.g., groceries, monthly)"
            />
            <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add a tag</p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;