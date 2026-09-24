import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Sliders,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Calendar,
  Check,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const { currentReport, transactions, currency, mode } = useFinance();

  // Calculate actual baseline monthly averages per category
  const baselineCategorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    const monthSet = new Set<string>();

    transactions
      .filter((t) => t.type === 'Expense')
      .forEach((t) => {
        monthSet.add(t.date.substring(0, 7));
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    const monthsCount = Math.max(1, monthSet.size);
    const result: Record<string, number> = {};
    Object.entries(map).forEach(([cat, total]) => {
      result[cat] = Math.round(total / monthsCount);
    });
    return result;
  }, [transactions]);

  // Categories to simulate based on mode
  const simulationCategories = useMemo(() => {
    if (mode === 'personal') {
      return ['Shopping', 'Food & Dining', 'Subscriptions', 'Transport', 'Utilities', 'Groceries'];
    } else {
      return [
        'Software & SaaS Tools',
        'Cloud & IT Hosting',
        'Marketing & Ads',
        'Supplier & Inventory',
        'Logistics & Shipping',
      ];
    }
  }, [mode]);

  // State for user's target monthly spend per category
  const [adjustedSpend, setAdjustedSpend] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    simulationCategories.forEach((cat) => {
      initial[cat] = baselineCategorySpend[cat] || (mode === 'personal' ? 4000 : 15000);
    });
    return initial;
  });

  // Reset to current actual baselines
  const handleReset = () => {
    const resetValues: Record<string, number> = {};
    simulationCategories.forEach((cat) => {
      resetValues[cat] = baselineCategorySpend[cat] || (mode === 'personal' ? 4000 : 15000);
    });
    setAdjustedSpend(resetValues);
  };

  const handleSliderChange = (cat: string, value: number) => {
    setAdjustedSpend((prev) => ({
      ...prev,
      [cat]: value,
    }));
  };

  // Calculations
  const simulationResults = useMemo(() => {
    let totalBaselineSimulated = 0;
    let totalAdjustedSimulated = 0;

    const breakdown = simulationCategories.map((cat) => {
      const current = baselineCategorySpend[cat] || 0;
      const target = adjustedSpend[cat] ?? current;
      const monthlyDelta = current - target;
      const yearlyDelta = monthlyDelta * 12;

      totalBaselineSimulated += current;
      totalAdjustedSimulated += target;

      return {
        category: cat,
        current,
        target,
        monthlyDelta,
        yearlyDelta,
      };
    });

    const totalMonthlySavings = totalBaselineSimulated - totalAdjustedSimulated;
    const totalYearlySavings = totalMonthlySavings * 12;

    const currentSurplus = currentReport?.summary.averageMonthlyIncome
      ? currentReport.summary.averageMonthlyIncome - (currentReport.summary.averageMonthlySpend || 0)
      : 0;
    const projectedNewSurplus = currentSurplus + totalMonthlySavings;

    return {
      breakdown,
      totalMonthlySavings,
      totalYearlySavings,
      currentSurplus,
      projectedNewSurplus,
    };
  }, [baselineCategorySpend, adjustedSpend, simulationCategories, currentReport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Financial &quot;What-If&quot; Scenario Simulator
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Interactive Forecast
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate reductions or increases across discretionary categories to forecast monthly and yearly cash flow impact.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Actuals</span>
        </button>
      </div>

      {/* Primary Potential Savings Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Difference */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Potential Monthly Difference
          </span>
          <div
            className={`text-2xl font-black mt-2 font-mono ${
              simulationResults.totalMonthlySavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600'
            }`}
          >
            {simulationResults.totalMonthlySavings >= 0 ? '+' : ''}
            {currency}
            {simulationResults.totalMonthlySavings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            per month cash flow variance
          </p>
        </div>

        {/* Yearly Difference */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Potential Yearly Difference
          </span>
          <div
            className={`text-2xl font-black mt-2 font-mono ${
              simulationResults.totalYearlySavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600'
            }`}
          >
            {simulationResults.totalYearlySavings >= 0 ? '+' : ''}
            {currency}
            {simulationResults.totalYearlySavings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            annualized compound liquidity
          </p>
        </div>

        {/* Projected Monthly Surplus */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Projected Monthly Net Surplus
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">
            {currency}
            {simulationResults.projectedNewSurplus.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            from current {currency}{simulationResults.currentSurplus.toLocaleString('en-IN')}
          </p>
        </div>

        {/* 5-Year Wealth Impact */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            5-Year Accumulated Horizon
          </span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2 font-mono">
            {currency}
            {(simulationResults.totalYearlySavings * 5).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            uninvested liquidity reserve
          </p>
        </div>
      </div>

      {/* Interactive Category Sliders */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Adjust Monthly Category Spend Budgets
        </h3>

        <div className="space-y-6">
          {simulationResults.breakdown.map((item) => {
            const maxRange = Math.max(item.current * 2, 10000);
            return (
              <div
                key={item.category}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.category}
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Current Monthly Baseline:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">
                        {currency}{item.current.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Simulated Spend</span>
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        {currency}{item.target.toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    <div className="pl-3 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase block">Yearly Impact</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          item.yearlyDelta >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500'
                        }`}
                      >
                        {item.yearlyDelta >= 0 ? '+' : ''}{currency}
                        {item.yearlyDelta.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slider and Number input */}
                <div className="flex items-center gap-4 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={maxRange}
                    step={100}
                    value={item.target}
                    onChange={(e) => handleSliderChange(item.category, parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label={`Adjust spend for ${item.category}`}
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">
                      {currency}
                    </span>
                    <input
                      type="number"
                      value={item.target}
                      onChange={(e) =>
                        handleSliderChange(item.category, Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold">Simulation Disclaimer:</span> All calculations in the What-If Simulator are educational mathematical estimates based on linear historical extrapolation, not guaranteed financial returns or investment advice.
        </div>
      </div>
    </div>
  );
};
