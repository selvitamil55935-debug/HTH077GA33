import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import {
  FileText,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Printer,
  TrendingUp,
  Tag,
  Repeat,
  Zap,
  FileSpreadsheet,
  ArrowDownToLine,
  SlidersHorizontal,
} from 'lucide-react';

export const FinancialReport: React.FC = () => {
  const {
    currentReport,
    transactions,
    isAnalyzing,
    triggerAIAnalysis,
    currency,
    mode,
    openExportModal,
  } = useFinance();

  const [downloadingFormat, setDownloadingFormat] = useState<'excel' | 'pdf' | null>(null);

  if (!currentReport) return null;

  const {
    summary,
    keyFindings,
    recurringExpenses,
    unusualSpending,
    budgetStatus,
    prioritizedActions,
    executiveSummary,
    generatedAt,
  } = currentReport;

  const handlePrint = () => {
    window.print();
  };

  const handleQuickExportExcel = () => {
    setDownloadingFormat('excel');
    try {
      exportToExcel(currentReport, transactions, currency);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 800);
    }
  };

  const handleQuickExportPdf = () => {
    setDownloadingFormat('pdf');
    try {
      exportToPdf(currentReport, transactions, currency);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 800);
    }
  };

  const handleDownloadJson = () => {
    const reportData = JSON.stringify(currentReport, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_health_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highPriorityActions = prioritizedActions.filter((a) => a.priority === 'HIGH');
  const mediumPriorityActions = prioritizedActions.filter((a) => a.priority === 'MEDIUM');
  const lowPriorityActions = prioritizedActions.filter((a) => a.priority === 'LOW');

  return (
    <div className="space-y-6">
      {/* Top Action Header (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Evidence-Based Financial Health Report
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Verified Evidence
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generated on {new Date(generatedAt).toLocaleDateString()} • Zero-generic advice guarantee
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={triggerAIAnalysis}
            disabled={isAnalyzing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{isAnalyzing ? 'Analyzing with Gemini...' : 'Re-Run AI Analysis'}</span>
          </button>

          {/* Quick Export Excel */}
          <button
            onClick={handleQuickExportExcel}
            disabled={downloadingFormat !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
            title="Download multi-sheet Excel workbook (.xlsx)"
          >
            {downloadingFormat === 'excel' ? (
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>Export Excel</span>
          </button>

          {/* Quick Export PDF */}
          <button
            onClick={handleQuickExportPdf}
            disabled={downloadingFormat !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
            title="Download formal Audit PDF Report (.pdf)"
          >
            {downloadingFormat === 'pdf' ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span>Export PDF</span>
          </button>

          {/* Export Options Modal */}
          <button
            onClick={() => openExportModal('excel')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Customize export options, date ranges, and sheets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Options...</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Download raw JSON report"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Printable Report Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        {/* Report Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                FA
              </div>
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                FinAdvisor Executive Report
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit Scope: {summary.transactionCount} transactions ({summary.dateRange.start} to {summary.dateRange.end}) • Mode: {mode.toUpperCase()}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {summary.financialHealthScore}/100
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Financial Health Index
            </div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Executive Synthesis</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {executiveSummary}
          </p>
        </div>

        {/* 1. Overall Summary Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            1. Overall Financial Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Inflow</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {currency}{summary.totalIncome.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Outflows</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {currency}{summary.totalExpenses.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Net Surplus/Balance</span>
              <div className={`text-lg font-bold font-mono mt-0.5 ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {currency}{summary.balance.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Top Spend Category</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                {summary.highestSpendingCategory.category} ({summary.highestSpendingCategory.percentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* 2. Key Findings Section with Strict Evidence */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Key Findings &amp; Transaction Evidence
            </h3>
            <span className="text-xs text-slate-400">Every finding grounded in ledger data</span>
          </div>

          <div className="space-y-3">
            {keyFindings.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.finding}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : item.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                    <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">
                      Evidence from Transactions:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {item.evidence}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Financial Impact:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {item.impact}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                      Suggested Tactical Action:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.suggestedAction}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Recurring Expenses Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Repeat className="w-4 h-4 text-emerald-600" />
            <span>3. Recurring Commitments &amp; Subscription Costs</span>
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Service / Merchant</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Cadence</th>
                  <th className="p-3 text-right">Avg Monthly</th>
                  <th className="p-3 text-right">Total Historical Paid</th>
                  <th className="p-3">Evidence Trail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recurringExpenses.map((rec) => (
                  <tr key={rec.description} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{rec.description}</td>
                    <td className="p-3 text-slate-500">{rec.category}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {rec.frequency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {currency}{rec.avgAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {currency}{rec.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {rec.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Unusual Spending Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span>4. Unusual Spending &amp; Outlier Audit</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unusualSpending.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span>{u.description}</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{currency}{u.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                  <span>Date: {u.date}</span>
                  <span>•</span>
                  <span>Category: {u.category}</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {u.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Prioritized Action List */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>5. Prioritized Tactical Action Plan</span>
          </h3>

          <div className="space-y-4">
            {/* High Priority */}
            {highPriorityActions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>HIGH PRIORITY (Immediate 7-Day Execution)</span>
                </div>
                {highPriorityActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {act.title}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {act.recommendation}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Evidence: {act.evidence}
                      </p>
                    </div>
                    {act.estimatedMonthlySavings > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Est. Monthly Gain</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          +{currency}{act.estimatedMonthlySavings.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Medium Priority */}
            {mediumPriorityActions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>MEDIUM PRIORITY (Next 30 Days)</span>
                </div>
                {mediumPriorityActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {act.title}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {act.recommendation}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Evidence: {act.evidence}
                      </p>
                    </div>
                    {act.estimatedMonthlySavings > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Est. Monthly Gain</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          +{currency}{act.estimatedMonthlySavings.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Low Priority */}
            {lowPriorityActions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>LOW PRIORITY (Ongoing Optimization)</span>
                </div>
                {lowPriorityActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {act.title}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {act.recommendation}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Evidence: {act.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Record-Keeping & Export Archive Section */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record-Keeping &amp; Tax Audit Export
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Audit Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              Export this complete dataset—including Health Index, strict transaction evidence, budget performance, and the full ledger—directly into Microsoft Excel (.xlsx) or formatted PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
            <button
              onClick={handleQuickExportExcel}
              disabled={downloadingFormat !== null}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleQuickExportPdf}
              disabled={downloadingFormat !== null}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={() => openExportModal('excel')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              title="Customize export filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          &quot;This application provides transaction analysis and educational financial insights. It is not a substitute for professional financial advice.&quot;
        </div>
      </div>
    </div>
  );
};
