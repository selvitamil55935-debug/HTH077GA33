import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  AlertTriangle,
  Repeat,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Calendar,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export const DashboardAlerts: React.FC = () => {
  const { currentReport, transactions, currency, setActiveTab } = useFinance();

  if (!currentReport) return null;

  const { budgetStatus, recurringExpenses, unusualSpending } = currentReport;
  const overBudgets = budgetStatus.filter((b) => b.status === 'over');
  const nearBudgets = budgetStatus.filter((b) => b.status === 'near');
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Budget Alerts & Unusual Spending */}
      <div className="space-y-4">
        {/* Budget Overages Alert */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Budget Health Alerts</span>
            </h3>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {overBudgets.length === 0 && nearBudgets.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>All active spending categories are within allocated limits this cycle!</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overBudgets.map((b) => (
                <div
                  key={b.category}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-red-700 dark:text-red-300">
                    <span>{b.category}</span>
                    <span>{b.percentage}% Limit</span>
                  </div>
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                    Spent {currency}{b.spent.toLocaleString('en-IN')} of {currency}{b.limit.toLocaleString('en-IN')} ({currency}{(b.spent - b.limit).toLocaleString('en-IN')} over budget)
                  </p>
                </div>
              ))}
              {nearBudgets.map((b) => (
                <div
                  key={b.category}
                  className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                    <span>{b.category}</span>
                    <span>{b.percentage}% Approaching</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                    {currency}{b.remaining.toLocaleString('en-IN')} remaining buffer
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unusual Spending Alert Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span>Unusual Spending Detected</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
              {unusualSpending.length} flagged
            </span>
          </div>

          {unusualSpending.length === 0 ? (
            <p className="text-xs text-slate-500">No anomalous spending spikes detected.</p>
          ) : (
            <div className="space-y-2">
              {unusualSpending.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span className="truncate max-w-[150px]">{item.description}</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      {currency}{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {item.evidence}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Recurring Expenses Detected */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-500" />
              <span>Recurring Subscriptions &amp; Costs</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
              {recurringExpenses.length} detected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Identified monthly fixed commitments and digital subscriptions.
          </p>

          <div className="space-y-2">
            {recurringExpenses.slice(0, 4).map((rec) => (
              <div
                key={rec.description}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {rec.description}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {rec.count} payments • {rec.frequency}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900 dark:text-white font-mono">
                    {currency}{rec.avgAmount.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tot: {currency}{rec.totalPaid.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('report')}
          className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>View Detailed Audit in Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Column 3: Recent Transactions Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Recent Transactions</span>
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {tx.description}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span>{tx.category}</span>
                  </div>
                </div>
                <div
                  className={`font-mono font-bold text-xs flex-shrink-0 ${
                    tx.type === 'Income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'Income' ? '+' : '-'}{currency}{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('transactions')}
          className="mt-4 w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Manage / Upload Statement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
