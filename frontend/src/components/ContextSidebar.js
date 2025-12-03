import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Plus, Briefcase, Heart, Home, Book, Music, Coffee, Camera, Plane, ShoppingBag, Dumbbell, GraduationCap, Palette, Code, Zap, Target, Sparkles, Sun, Moon, Star, Gift, BarChart3, Wallet, CheckSquare, Lightbulb, Calendar, Settings } from 'lucide-react';

const ContextSidebar = ({ 
  contexts, 
  activeView,
  setActiveView,
  setSidebarOpen,
  onAddContext,
}) => {
  const [expandedContexts, setExpandedContexts] = useState({});

  // Icon mapping for context emojis
  const iconMap = {
    'Briefcase': Briefcase,
    'Heart': Heart,
    'Dumbbell': Dumbbell,
    'Home': Home,
    'Book': Book,
    'GraduationCap': GraduationCap,
    'Music': Music,
    'Coffee': Coffee,
    'Camera': Camera,
    'Palette': Palette,
    'Plane': Plane,
    'ShoppingBag': ShoppingBag,
    'Code': Code,
    'Zap': Zap,
    'Target': Target,
    'Sparkles': Sparkles,
    'Sun': Sun,
    'Moon': Moon,
    'Star': Star,
    'Gift': Gift,
  };

  const toggleContext = (contextId) => {
    setExpandedContexts(prev => {
      // Create new state object
      const newState = {};
      
      // If clicking on an already expanded context, just close it
      if (prev[contextId]) {
        return newState; // Close all (including this one)
      }
      
      // Otherwise, close all others and open this one
      newState[contextId] = true;
      return newState;
    });
  };

  // Context apps with Lucide outlined icons - consistent style
  const contextApps = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'finances', name: 'Finances', icon: Wallet },
    { id: 'todos', name: 'Todos', icon: CheckSquare },
    { id: 'notes', name: 'Notes', icon: Lightbulb },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  // Detect if we're on mobile
  const isMobile = () => window.innerWidth < 768;

  const handleNavigation = (view) => {
    setActiveView(view);
    // Only close sidebar on mobile
    if (isMobile()) {
      setSidebarOpen(false);
    }
  };

  const handleContextClick = (contextId) => {
    const isExpanded = expandedContexts[contextId];
    
    if (isMobile()) {
      // MOBILE: Tap once to expand, tap app to navigate
      if (!isExpanded) {
        // First tap: just expand, don't navigate
        toggleContext(contextId);
      } else {
        // Already expanded, toggle it closed
        toggleContext(contextId);
      }
    } else {
      // DESKTOP: Normal behavior - toggle and navigate
      toggleContext(contextId);
      if (!isExpanded) {
        handleNavigation({ type: 'context', contextId: contextId, app: 'overview' });
      }
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-slate-100">
      <div className="sticky top-0 z-10 px-5 py-4 flex justify-between items-center bg-slate-100">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-800 whitespace-nowrap">Second Brain</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden h-10 w-10 flex items-center justify-center flex-shrink-0 ml-2 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={22} strokeWidth={2.25} />
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Home */}
        <button
          onClick={() => handleNavigation({ type: 'home' })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
            activeView.type === 'home'
              ? 'bg-indigo-500/90 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/70'
          }`}
        >
          <Home size={18} />
          <span className="font-medium whitespace-nowrap">Home</span>
        </button>

        {/* Divider */}
        <div className="py-2">
          <p className="text-xs font-semibold text-slate-400 px-3">FIELDS</p>
        </div>

        {/* Contexts */}
        {contexts.map(context => {
          const isExpanded = expandedContexts[context.id];
          const isActive = activeView.type === 'context' && activeView.contextId === context.id;
          
          // Get the icon component for this context
          const IconComponent = iconMap[context.emoji] || Briefcase;

          return (
            <div key={context.id} className="space-y-0.5">
              <button
                onClick={() => handleContextClick(context.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive && !expandedContexts[context.id]
                    ? 'bg-indigo-500/90 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <IconComponent size={18} className="flex-shrink-0" />
                <span className="font-medium whitespace-nowrap flex-1 text-left">{context.name}</span>
                {isExpanded ? (
                  <ChevronDown size={16} className="ml-auto flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="ml-auto flex-shrink-0" />
                )}
              </button>

              {/* Context Apps - All with Lucide icons */}
              {isExpanded && (
                <div className="ml-6 space-y-0.5">
                  {contextApps.map(app => {
                    const AppIcon = app.icon;
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleNavigation({ 
                          type: 'context', 
                          contextId: context.id, 
                          app: app.id 
                        })}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs ${
                          isActive && activeView.app === app.id
                            ? 'bg-indigo-500/90 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white/70'
                        }`}
                      >
                        <AppIcon size={16} />
                        <span className="font-medium whitespace-nowrap">{app.name}</span>
                      </button>
                    );
                  })}
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
          <span className="font-medium whitespace-nowrap">Add New Field</span>
        </button>
      </nav>
    </div>
  );
};

export default ContextSidebar;
