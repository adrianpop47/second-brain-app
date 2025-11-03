import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import ContextSidebar from './components/ContextSidebar';
import ContextSettingsModal from './components/ContextSettingsModal';
import ContextOverview from './components/ContextOverview';
import HomeView from './components/HomeView';
import ContextFinances from './components/ContextFinances';
import apiService from './services/apiService';

const SecondBrainApp = () => {
  // State management
  const [contexts, setContexts] = useState([]);
  const [activeView, setActiveView] = useState({ type: 'home' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddContextModal, setShowAddContextModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  
  // Home view data
  const [homeStats, setHomeStats] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0
  });
  const [contextData, setContextData] = useState([]);
  
  // Context overview data
  const [contextOverview, setContextOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Fetch contexts on mount
  useEffect(() => {
    fetchContexts();
  }, []);

  // Fetch home data when dateRange changes
  useEffect(() => {
    if (activeView.type === 'home') {
      fetchHomeData();
    }
  }, [dateRange, activeView.type]);

  // Fetch context overview when navigating to a context
  useEffect(() => {
    if (activeView.type === 'context' && activeView.app === 'overview') {
      fetchContextOverview(activeView.contextId);
    }
  }, [activeView]);

  const fetchContexts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContexts();
      setContexts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching contexts:', err);
      setError('Failed to load contexts');
      setLoading(false);
    }
  };

  const fetchHomeData = async () => {
    try {
      const [summaryRes, contextStatsRes] = await Promise.all([
        apiService.getSummaryStats(dateRange),
        apiService.getStatsByContext(dateRange)
      ]);
      
      setHomeStats(summaryRes.data);
      setContextData(contextStatsRes.data);
    } catch (err) {
      console.error('Error fetching home data:', err);
    }
  };

  const fetchContextOverview = async (contextId) => {
    try {
      setOverviewLoading(true);
      const response = await apiService.getContextOverview(contextId);
      setContextOverview(response.data);
      setOverviewLoading(false);
    } catch (err) {
      console.error('Error fetching context overview:', err);
      setOverviewLoading(false);
    }
  };

  const handleAddContext = () => {
    setSelectedContext(null);
    setShowAddContextModal(true);
  };

  const handleContextSettings = (context) => {
    setSelectedContext(context);
    setShowSettingsModal(true);
  };

  const handleSaveContext = async (contextData) => {
    try {
      if (contextData.id) {
        // Update existing context
        await apiService.updateContext(contextData.id, {
          name: contextData.name,
          emoji: contextData.emoji,
          color: contextData.color
        });
      } else {
        // Create new context
        await apiService.createContext({
          name: contextData.name,
          emoji: contextData.emoji,
          color: contextData.color
        });
      }
      
      await fetchContexts();
      setShowSettingsModal(false);
      setShowAddContextModal(false);
    } catch (err) {
      console.error('Error saving context:', err);
      alert('Failed to save context');
    }
  };

  const handleDeleteContext = async (contextId) => {
    try {
      await apiService.deleteContext(contextId);
      await fetchContexts();
      setShowSettingsModal(false);
      
      // Navigate to home if we deleted the current context
      if (activeView.type === 'context' && activeView.contextId === contextId) {
        setActiveView({ type: 'home' });
      }
    } catch (err) {
      console.error('Error deleting context:', err);
      alert('Failed to delete context');
    }
  };

  const handleNavigation = (view) => {
    setActiveView(view);
    
    // Open settings modal if navigating to settings
    if (view.type === 'context' && view.app === 'settings') {
      const context = contexts.find(c => c.id === view.contextId);
      handleContextSettings(context);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your Second Brain...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-lg max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-800">Connection Error</h3>
          </div>
          <p className="text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchContexts}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get current context if viewing a context
  const currentContext = activeView.type === 'context' 
    ? contexts.find(c => c.id === activeView.contextId)
    : null;

  // Render main content based on active view
  const renderMainContent = () => {
    if (activeView.type === 'home') {
      return (
        <HomeView
          summaryStats={homeStats}
          contextData={contextData}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onQuickAdd={() => {/* TODO: Implement quick add modal */}}
          loading={false}
        />
      );
    }

    if (activeView.type === 'insights') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Insights Coming Soon</h2>
          <p className="text-slate-600">Advanced analytics and insights will be available here</p>
        </div>
      );
    }

    if (activeView.type === 'context' && currentContext) {
      if (activeView.app === 'overview') {
        return (
          <ContextOverview
            context={currentContext}
            stats={contextOverview?.stats || {}}
            recentTransactions={contextOverview?.recent_transactions || []}
            loading={overviewLoading}
          />
        );
      }

      if (activeView.app === 'finances') {
        return (
          <ContextFinances
            context={currentContext}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        );
      }

      if (activeView.app === 'todos') {
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Todos Coming Soon</h2>
            <p className="text-slate-600">Task management with Kanban board</p>
          </div>
        );
      }

      if (activeView.app === 'ideas') {
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Ideas Coming Soon</h2>
            <p className="text-slate-600">Capture and organize your ideas</p>
          </div>
        );
      }

      if (activeView.app === 'calendar') {
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Calendar Coming Soon</h2>
            <p className="text-slate-600">Schedule and manage your events</p>
          </div>
        );
      }
    }

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Nothing Selected</h2>
        <p className="text-slate-600">Select a context or view from the sidebar</p>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 overflow-hidden">
      <div className="flex h-full">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <aside className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/50 flex flex-col shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <ContextSidebar 
            contexts={contexts}
            activeView={activeView}
            setActiveView={handleNavigation}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onAddContext={handleAddContext}
            onContextSettings={handleContextSettings}
          />
        </aside>
        
        {/* Desktop sidebar */}
        <aside className={`hidden md:block bg-white/70 backdrop-blur-md flex-col shadow-sm flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 border-r border-slate-200/50' : 'w-0'
        }`}>
          <div className={`h-full flex flex-col ${sidebarOpen ? '' : 'invisible'}`}>
            <ContextSidebar 
              contexts={contexts}
              activeView={activeView}
              setActiveView={handleNavigation}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onAddContext={handleAddContext}
              onContextSettings={handleContextSettings}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header with hamburger menu */}
              {!sidebarOpen && (
                <div className="mb-6">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Menu size={24} className="text-slate-600" />
                  </button>
                </div>
              )}

              {/* Main content area */}
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Context Settings Modal */}
      <ContextSettingsModal
        context={selectedContext}
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveContext}
        onDelete={handleDeleteContext}
      />

      {/* Add Context Modal (reuse settings modal with no context) */}
      <ContextSettingsModal
        context={{ name: '', emoji: '📁', color: '#000000' }}
        show={showAddContextModal}
        onClose={() => setShowAddContextModal(false)}
        onSave={handleSaveContext}
        onDelete={() => {}}
      />
    </div>
  );
};

export default SecondBrainApp;