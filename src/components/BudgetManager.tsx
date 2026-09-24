import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Category } from '../types';

export const BudgetManager: React.FC = () => {
  const { budgets, currentReport, updateBudget, currency, mode, openChartExplainer } = useFinance();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  if (!currentReport) return null;

  const { budgetStatus } = currentReport;

  const handleEditClick = (category: Category, currentLimit: number) => {
    setEditingCategory(category);
    setLimitInput(String(currentLimit));
  };

  const handleSaveBudget = (category: Category) => {
    const num = parseFloat(limitInput);
    if (!isNaN(num) && num >= 0) {
      updateBudget(category, num);
    }
    setEditingCategory(null);
  };

  const overBudgets = budgetStatus.filter((b) => b.status === 'over');
  const nearBudgets = budgetStatus.filter((b) => b.status === 'near');
  const withinBudgets = budgetStatus.filter((b) => b.status === 'within');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'personal' ? 'Monthly Category Budgets' : 'SME Operating Cost Guardrails'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {mode === 'personal' ? 'Personal' : 'SME Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking current month spending thresholds against established financial targets
          </p>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300">
            {overBudgets.length} Over
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {nearBudgets.length} Warning
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {withinBudgets.length} On Track
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetStatus.map((item) => {
          const isOver = item.status === 'over';
          const isNear = item.status === 'near';
          const isEditing = editingCategory === item.category;

          return (
            <div
              key={item.category}
              className={`p-5 rounded-2xl border transition-all ${
                isOver
                  ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 shadow-xs'
                  : isNear
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isOver
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-300'
                          : isNear
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300'
                      }`}
                    >
                      {isOver ? 'Over Budget' : isNear ? 'Near Limit' : 'Within Budget'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Actual Spent: <strong className="text-slate-900 dark:text-white">{currency}{item.spent.toLocaleString('en-IN')}</strong> of{' '}
                    <span>{currency}{item.limit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(item.category, item.limit)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Adjust monthly limit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Mode Inline Input */}
              {isEditing ? (
                <div className="my-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-300 dark:border-blue-700 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                  <input
                    type="number"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="flex-1 text-xs py-1 px-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    placeholder="New monthly limit"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveBudget(item.category)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Progress Bar */
                <div className="space-y-1.5 my-3">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-red-500'
                          : isNear
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">{item.percentage}% Utilized</span>
                    <span>
                      {isOver
                        ? `Over by ${currency}${(item.spent - item.limit).toLocaleString('en-IN')}`
                        : `${currency}${item.remaining.toLocaleString('en-IN')} remaining`}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Note */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {isOver ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Action required: Pause non-critical spend in {item.category}.
                    </span>
                  </>
                ) : isNear ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-amber-700 dark:text-amber-400">
                      Buffer below 20%. Watch daily rate for remainder of month.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Spending paced healthily within target limits.
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
