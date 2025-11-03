import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#94A3B8'];

const ExpenseChart = ({ data, title = 'Expenses by Tag' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-slate-500 text-sm">No expenses yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/50">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
          />
        </RePieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.slice(0, 8).map((cat, idx) => (
          <div key={cat.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
            <span className="text-xs text-slate-600 truncate">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseChart;