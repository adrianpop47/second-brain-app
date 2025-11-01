import React from 'react';
import { X } from 'lucide-react';

const Sidebar = ({ apps, activeApp, setActiveApp, sidebarOpen, setSidebarOpen, isDesktop }) => {
  return (
    <>
      <div className="p-5 border-b border-slate-200/50 flex justify-between items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-800 whitespace-nowrap">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">Financial Management</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          <X size={20} className="text-slate-600" />
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {apps.map(app => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => {
                if (!app.disabled) {
                  setActiveApp(app.id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }
              }}
              disabled={app.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                activeApp === app.id
                  ? 'bg-indigo-500/90 text-white shadow-sm'
                  : app.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium whitespace-nowrap">{app.name}</span>
              {app.disabled && (
                <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded whitespace-nowrap">Soon</span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;