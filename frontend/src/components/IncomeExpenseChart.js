import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IncomeExpenseChart = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '11px' }} />
          <YAxis stroke="#94A3B8" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#EF4444" 
            strokeWidth={2.5}
            name="Expenses"
            dot={{ fill: '#EF4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10B981" 
            strokeWidth={2.5}
            name="Income"
            dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-emerald-500"></div>
          <span className="text-xs text-slate-600 font-medium">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-red-500"></div>
          <span className="text-xs text-slate-600 font-medium">Expenses</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
