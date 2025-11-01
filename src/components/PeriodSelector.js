import React from 'react';

const PeriodSelector = ({ value, onChange }) => {
  return (
    <>
      {/* Desktop version */}
      <div className="relative hidden md:block md:w-48 lg:w-52">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent cursor-pointer shadow-sm w-full transition-all duration-300 ease-in-out"
        >
          <option value="week">7 Days</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="all">All</option>
        </select>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none transition-transform duration-200">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Mobile version */}
      <div className="relative md:hidden">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent cursor-pointer shadow-sm w-full transition-all duration-300 ease-in-out"
        >
          <option value="week">7 Days</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="all">All</option>
        </select>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none transition-transform duration-200">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default PeriodSelector;