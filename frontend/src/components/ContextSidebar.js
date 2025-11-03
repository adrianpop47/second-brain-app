import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Plus } from 'lucide-react';

const ContextSidebar = ({ 
  contexts, 
  activeView,
  setActiveView,
  setSidebarOpen,
  onAddContext,
}) => {
  const [expandedContexts, setExpandedContexts] = useState({});

  const toggleContext = (contextId) => {
    setExpandedContexts(prev => ({
      ...prev,
      [contextId]: !prev[contextId]
    }));
  };

  const contextApps = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'finances', name: 'Finances', icon: '💰' },
    { id: 'todos', name: 'Todos', icon: '✅' },
    { id: 'ideas', name: 'Ideas', icon: '💡' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  const handleNavigation = (view) => {
    setActiveView(view);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div className="p-5 border-b border-slate-200/50 flex justify-between items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-800 whitespace-nowrap">Second Brain</h1>
          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">Context Management</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          <X size={20} className="text-slate-600" />
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Home */}
        <button
          onClick={() => handleNavigation({ type: 'home' })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
            activeView.type === 'home'
              ? 'bg-indigo-500/90 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <span>🏠</span>
          <span className="font-medium whitespace-nowrap">Home</span>
        </button>

        {/* Insights */}
        <button
          onClick={() => handleNavigation({ type: 'insights' })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
            activeView.type === 'insights'
              ? 'bg-indigo-500/90 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <span>📊</span>
          <span className="font-medium whitespace-nowrap">Insights</span>
        </button>

        {/* Divider */}
        <div className="py-2">
          <p className="text-xs font-semibold text-slate-400 px-3">CONTEXTS</p>
        </div>

        {/* Contexts */}
        {contexts.map(context => {
          const isExpanded = expandedContexts[context.id];
          const isActive = activeView.type === 'context' && activeView.contextId === context.id;

          return (
            <div key={context.id} className="space-y-0.5">
              <button
                onClick={() => {
                  toggleContext(context.id);
                  if (!isExpanded) {
                    handleNavigation({ type: 'context', contextId: context.id, app: 'overview' });
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  isActive && !expandedContexts[context.id]
                    ? 'bg-indigo-500/90 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="flex-shrink-0" />
                )}
                <span className="text-base">{context.emoji}</span>
                <span className="font-medium whitespace-nowrap flex-1 text-left">{context.name}</span>
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: context.color }}
                ></div>
              </button>

              {/* Context Apps */}
              {isExpanded && (
                <div className="ml-6 space-y-0.5">
                  {contextApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleNavigation({ 
                        type: 'context', 
                        contextId: context.id, 
                        app: app.id 
                      })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs ${
                        isActive && activeView.app === app.id
                          ? 'bg-indigo-500/90 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="text-sm">{app.icon}</span>
                      <span className="font-medium whitespace-nowrap">{app.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Context */}
        <button
          onClick={onAddContext}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm text-indigo-600 hover:bg-indigo-50 border-2 border-dashed border-indigo-200 hover:border-indigo-300 mt-2"
        >
          <Plus size={16} />
          <span className="font-medium whitespace-nowrap">Add New Context</span>
        </button>
      </nav>
    </>
  );
};

export default ContextSidebar;