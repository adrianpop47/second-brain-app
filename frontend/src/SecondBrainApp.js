import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ContextSidebar from './components/ContextSidebar';
import ContextSettingsModal from './components/ContextSettingsModal';
import ContextOverview from './components/ContextOverview';
import HomeView from './components/HomeView';
import ContextFinances from './components/ContextFinances';
import ContextTodos from './components/ContextTodos';
import ContextCalendar from './components/ContextCalendar';
import ContextNotes from './components/ContextNotes';
import AppAlert from './components/AppAlert';
import ConfirmDialog from './components/ConfirmDialog';
import { showAppAlert } from './utils/alertService';
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
  const [viewBeforeSettings, setViewBeforeSettings] = useState(null);
  
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

  // Cross-navigation focus
  const [calendarFocus, setCalendarFocus] = useState(null); // { contextId, eventId }
  const [todoFocus, setTodoFocus] = useState(null); // { contextId, todoId }

  // Fetch contexts on mount
  useEffect(() => {
    fetchContexts();
  }, []);

  // Fetch home data when dateRange changes OR when returning to home
  useEffect(() => {
    if (activeView.type === 'home') {
      fetchHomeData();
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, activeView.type]);

  // Fetch context overview when navigating to a context or changing date range
  useEffect(() => {
    if (activeView.type === 'context' && activeView.app === 'overview') {
      fetchContextOverview(activeView.contextId, dateRange);
    }
  }, [activeView, dateRange]);

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

  const fetchContextOverview = async (contextId, range = dateRange) => {
    try {
      setOverviewLoading(true);
      const response = await apiService.getContextOverview(contextId, range);
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
    // Save the current view before opening settings
    setViewBeforeSettings(activeView);
    setSelectedContext(context);
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    setShowAddContextModal(false);
    // Restore the view we were on before opening settings
    if (viewBeforeSettings) {
      setActiveView(viewBeforeSettings);
      setViewBeforeSettings(null);
    }
  };

  const handleSaveContext = async (contextData) => {
    try {
      const payload = {
        name: contextData.name,
        emoji: contextData.emoji,
        fieldType: contextData.fieldType
      };
      if (contextData.id) {
        await apiService.updateContext(contextData.id, payload);
      } else {
        await apiService.createContext(payload);
      }
      
      await fetchContexts();
      handleCloseSettings();
    } catch (err) {
      console.error('Error saving context:', err);
      showAppAlert('Failed to save context');
    }
  };

  const handleDeleteContext = async (contextId) => {
    try {
      await apiService.deleteContext(contextId);
      await fetchContexts();
      handleCloseSettings();
      
      // Navigate to home if we deleted the current context
      if (activeView.type === 'context' && activeView.contextId === contextId) {
        setActiveView({ type: 'home' });
      }
    } catch (err) {
      console.error('Error deleting context:', err);
      showAppAlert('Failed to delete context');
    }
  };

  const handleNavigation = (view) => {
    // If navigating to settings, save current view and open modal
    if (view.type === 'context' && view.app === 'settings') {
      const context = contexts.find(c => c.id === view.contextId);
      setViewBeforeSettings({ type: 'context', contextId: view.contextId, app: 'overview' });
      handleContextSettings(context);
    } else {
      setActiveView(view);
    }
  };

  // Handler for when data is updated in ContextOverview - REFRESH EVERYTHING
  const handleContextDataUpdate = async () => {
    // Refresh context overview data
    if (activeView.type === 'context' && activeView.contextId) {
      await fetchContextOverview(activeView.contextId, dateRange);
    }
    
    // ALSO refresh home data so it shows in Home view
    await fetchHomeData();
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
  const handleViewCalendarEventFromTodo = (contextId, eventId) => {
    setActiveView({ type: 'context', contextId, app: 'calendar' });
    setCalendarFocus({ contextId, eventId });
  };

  const handleViewTodoFromEvent = (contextId, todoId) => {
    setActiveView({ type: 'context', contextId, app: 'todos' });
    setTodoFocus({ contextId, todoId });
  };

  const renderMainContent = () => {
    if (activeView.type === 'home') {
      const handleOpenNoteFromHome = (contextId) => {
        if (!contextId) return;
        setActiveView({ type: 'context', contextId, app: 'notes' });
      };
      return (
        <HomeView
          summaryStats={homeStats}
          contextData={contextData}
          loading={loading}
          dateRange={dateRange}
          onChangeDateRange={setDateRange}
          onRequestViewCalendarEvent={handleViewCalendarEventFromTodo}
          onRequestViewLinkedTodo={handleViewTodoFromEvent}
          onOpenNote={handleOpenNoteFromHome}
        />
      );
    }

    if (activeView.type === 'context' && currentContext) {
      const openNotesView = () => {
        setActiveView({ type: 'context', contextId: currentContext.id, app: 'notes' });
      };

      if (activeView.app === 'overview') {
        return (
          <ContextOverview
            context={currentContext}
            stats={contextOverview?.stats || {}}
            recentTransactions={contextOverview?.recent_transactions || []}
            loading={overviewLoading}
            dateRange={dateRange}
            onChangeDateRange={setDateRange}
            onDataUpdate={handleContextDataUpdate}
            onRequestViewCalendarEvent={handleViewCalendarEventFromTodo}
            onRequestViewLinkedTodo={handleViewTodoFromEvent}
            onOpenNotes={openNotesView}
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
          <ContextTodos
            context={currentContext}
            focusedTodoId={todoFocus?.contextId === currentContext.id ? todoFocus.todoId : null}
            onClearFocus={() => setTodoFocus(null)}
            onRequestViewCalendarEvent={handleViewCalendarEventFromTodo}
          />
        );
      }

      if (activeView.app === 'notes') {
        return <ContextNotes context={currentContext} />;
      }

      if (activeView.app === 'calendar') {
        return (
          <ContextCalendar
            context={currentContext}
            focusedEventId={calendarFocus?.contextId === currentContext.id ? calendarFocus.eventId : null}
            onClearFocus={() => setCalendarFocus(null)}
            onViewLinkedTodo={handleViewTodoFromEvent}
          />
        );
      }
    }

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Nothing Selected</h2>
        <p className="text-slate-600">Select a field or view from the sidebar</p>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-100 overflow-hidden">
      <AppAlert />
      <ConfirmDialog />
      <div className="flex h-full relative">
        {/* Settings Overlay - Grays out the background */}
        {(showSettingsModal || showAddContextModal) && (
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 pointer-events-none" />
        )}

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Mobile sidebar */}
        <aside className={`md:hidden fixed left-0 top-0 h-full w-64 bg-slate-100 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
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
        <aside className={`hidden md:block bg-slate-100 flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}>
          <div className={`h-full flex flex-col ${sidebarOpen ? '' : 'invisible'}`}>
            <ContextSidebar 
              contexts={contexts}
              activeView={viewBeforeSettings || activeView}
              setActiveView={handleNavigation}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onAddContext={handleAddContext}
              onContextSettings={handleContextSettings}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${(showSettingsModal || showAddContextModal) ? 'pointer-events-none' : ''}`}>
          {/* Sticky header with menu button */}
          <div className={`sticky top-0 z-30 bg-slate-100 transition-opacity duration-200 ${sidebarOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100 pointer-events-auto'}`}>
            <div className="px-6 sm:px-8 md:px-10 py-3 flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={`h-10 w-10 rounded-lg transition-colors items-center justify-center hover:bg-white/60 text-slate-600 ${sidebarOpen ? 'hidden' : 'flex'}`}
                aria-label="Toggle sidebar"
              >
                <Menu size={24} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`hidden md:flex h-10 w-10 rounded-lg transition-colors items-center justify-center hover:bg-white/60 text-slate-600 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-label="Close sidebar"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Scrollable main content */}
          <div className="flex-1 overflow-auto bg-slate-100">
            <div className="min-h-full bg-white rounded-3xl mx-0 sm:mx-2 md:mx-4 mt-3 mb-6 px-3 sm:px-4 pb-8">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Context Settings Modal */}
      <ContextSettingsModal
        context={selectedContext}
        show={showSettingsModal}
        onClose={handleCloseSettings}
        onSave={handleSaveContext}
        onDelete={handleDeleteContext}
      />

      {/* Add Context Modal (reuse settings modal with no context) */}
      <ContextSettingsModal
        context={{ name: '', emoji: 'Briefcase', fieldType: 'Revenue' }}
        show={showAddContextModal}
        onClose={handleCloseSettings}
        onSave={handleSaveContext}
        onDelete={() => {}}
      />
    </div>
  );
};

export default SecondBrainApp;
