import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Sparkles, HelpCircle, TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';

const COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#0284c7', // Sky
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#475569', // Slate
  '#65a30d', // Lime
];

export const FinancialCharts: React.FC = () => {
  const { transactions, currentReport, mode, currency, openChartExplainer, darkMode } = useFinance();

  // Monthly aggregated data for Income vs Expense & Monthly Trend
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { month: string; income: number; expense: number; net: number }> = {};

    transactions.forEach((tx) => {
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      // Format to readable: "Apr 26"
      const dateObj = new Date(tx.date);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: label, income: 0, expense: 0, net: 0 };
      }

      if (tx.type === 'Income') {
        monthMap[monthKey].income += tx.amount;
      } else {
        monthMap[monthKey].expense += tx.amount;
      }
      monthMap[monthKey].net = monthMap[monthKey].income - monthMap[monthKey].expense;
    });

    return Object.keys(monthMap)
      .sort()
      .map((k) => monthMap[k]);
  }, [transactions]);

  // Category breakdown for Expense Donut Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    let totalExp = 0;

    transactions
      .filter((t) => t.type === 'Expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        totalExp += t.amount;
      });

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExp > 0 ? Math.round((value / totalExp) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Monthly Income vs Expense Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Income vs Expense Comparison
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly inflow vs operational outflow
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openChartExplainer('income_vs_expense', currentReport?.summary || {})
            }
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            title="Ask AI to interpret this chart"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Explain Chart</span>
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="income" name="Inflow (Income)" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Outflow (Expense)" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Spending by Category Donut Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Spending by Category
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Expenditure concentration breakdown
              </p>
            </div>
          </div>
          <button
            onClick={() => openChartExplainer('spending_by_category', categoryData)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
            title="Ask AI to interpret this chart"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Explain Chart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-64">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.slice(0, 6)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Mini Category Legend */}
          <div className="space-y-1.5 overflow-y-auto max-h-56 pr-2">
            {categoryData.slice(0, 6).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[100px]" title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                  {cat.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Net Cash Flow & Spending Trajectory (Full width spanning 2 columns) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Spending &amp; Cash Flow Trajectory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                6-month historical curve with buffer gap evaluation
              </p>
            </div>
          </div>
          <button
            onClick={() => openChartExplainer('monthly_trend', monthlyData)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
            title="Ask AI to interpret this chart"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Explain Trend</span>
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="income"
                name="Inflow (Revenue / Salary)"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Total Expenditure"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
