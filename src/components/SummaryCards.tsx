import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  ArrowDownToLine,
} from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { currentReport, mode, currency, openChartExplainer, openExportModal } = useFinance();
  const { t } = useLanguage();

  if (!currentReport) return null;

  const { summary } = currentReport;
  const isSurplus = summary.balance >= 0;

  const handleExplainSummary = () => {
    openChartExplainer('income_vs_expense', summary);
  };

  const handleExplainHealth = () => {
    openChartExplainer('financial_health', summary);
  };

  return (
    <div className="space-y-4">
      {/* Header bar with Mode badge and AI Explainer helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'personal' ? t('common.personalSmeAnalysis') : 'SME Cash Flow & Operating Overview'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                mode === 'personal'
                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {mode === 'personal' ? t('nav.personal') : t('nav.sme')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Covering {summary.transactionCount} transactions from {summary.dateRange.start} to {summary.dateRange.end}
          </p>
        </div>

        {/* AI Explain Summary & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExplainHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            title="Ask AI to interpret Financial Health Score"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Health Score: <strong className="text-blue-600 dark:text-blue-400 font-bold">{summary.financialHealthScore}/100</strong></span>
          </button>

          <button
            onClick={handleExplainSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
            title="Ask AI to analyze top financial metrics"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Explain Cash Flow AI</span>
          </button>

          <button
            onClick={() => openExportModal('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
            title="Export full financial records & insights as Excel or PDF"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('export.button')}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income / Business Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {mode === 'personal' ? 'Total Inflow / Salary' : 'Total Business Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency}{summary.totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-emerald-600 dark:text-emerald-400 mr-1.5">
              ~{currency}{summary.averageMonthlyIncome.toLocaleString('en-IN')}/mo
            </span>
            <span>monthly average</span>
          </div>
        </div>

        {/* Total Expenses / Operating Outflows */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-red-300 dark:hover:border-red-900 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {mode === 'personal' ? 'Total Expenses' : 'Total Operating Costs'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency}{summary.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-red-600 dark:text-red-400 mr-1.5">
              ~{currency}{summary.averageMonthlySpend.toLocaleString('en-IN')}/mo
            </span>
            <span>monthly average</span>
          </div>
        </div>

        {/* Current Balance / Net Cash Flow */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {mode === 'personal' ? 'Current Balance / Net' : 'Net Cash Flow'}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isSurplus
                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight ${
              isSurplus ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isSurplus ? '' : '-'}{currency}{Math.abs(summary.balance).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className={`font-semibold mr-1.5 ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isSurplus ? 'Surplus' : 'Deficit'}
            </span>
            <span>cumulative total</span>
          </div>
        </div>

        {/* Savings Rate or SME Runway */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {mode === 'personal' ? 'Savings Margin' : 'Operating Runway'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {mode === 'personal' ? <PiggyBank className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {mode === 'personal' ? `${summary.savingsRate}%` : `${summary.runwayMonths ?? 4.2} mo`}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'personal' ? (
              <span>Target: 20%+ recommended</span>
            ) : (
              <span>Based on trailing monthly burn</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
