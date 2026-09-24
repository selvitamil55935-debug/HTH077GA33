import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { exportToExcel, exportToPdf, ExportOptions, filterTransactionsByDate } from '../utils/exportUtils';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowDownToLine,
  SlidersHorizontal,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: 'excel' | 'pdf';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  defaultFormat = 'excel',
}) => {
  const { currentReport, transactions, currency, mode } = useFinance();

  const [format, setFormat] = useState<'excel' | 'pdf'>(defaultFormat);
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '90' | '180'>('all');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeFindings, setIncludeFindings] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !currentReport) return null;

  const filteredTx = filterTransactionsByDate(transactions, dateFilter);

  const handleExport = (chosenFormat: 'excel' | 'pdf' = format) => {
    setIsExporting(true);
    setSuccessMessage('');

    try {
      const options: ExportOptions = {
        includeSummary,
        includeFindings,
        includeActions,
        includeBudgets,
        includeRecurring,
        includeTransactions,
        dateRangeFilter: dateFilter,
      };

      if (chosenFormat === 'excel') {
        const fileName = exportToExcel(currentReport, transactions, currency, options);
        setSuccessMessage(`Successfully exported ${fileName}`);
      } else {
        const fileName = exportToPdf(currentReport, transactions, currency, options);
        setSuccessMessage(`Successfully exported ${fileName}`);
      }

      setTimeout(() => {
        setIsExporting(false);
      }, 600);
    } catch (err: any) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close export dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <h2 id="export-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Export Financial Data &amp; Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate structured audit-ready Excel spreadsheet or formal PDF report
            </p>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Format Selector: Excel vs PDF */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Select Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Excel Option */}
            <button
              type="button"
              onClick={() => setFormat('excel')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                format === 'excel'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                {format === 'excel' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Excel Workbook</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  .XLSX • Multi-sheet workbook for accounting, tax prep &amp; data analysis
                </div>
              </div>
            </button>

            {/* PDF Option */}
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                format === 'pdf'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-4 h-4" />
                </div>
                {format === 'pdf' && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Audit PDF Report</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  .PDF • Formatted document with Health Score, KPIs &amp; evidence tables
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Scope & Date Filter */}
        <div className="mb-5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Audit Period Scope</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {filteredTx.length} of {transactions.length} transactions included
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: '30', label: 'Last 30D' },
                { id: '90', label: 'Last 90D' },
                { id: '180', label: 'Last 6M' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDateFilter(t.id)}
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  dateFilter === t.id
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Checkboxes */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Include in Export
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Executive Synthesis &amp; Health Score
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeFindings}
                onChange={(e) => setIncludeFindings(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Key Findings &amp; Ledger Evidence
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeActions}
                onChange={(e) => setIncludeActions(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Tactical Action Plan with Est. Savings
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeBudgets}
                onChange={(e) => setIncludeBudgets(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Budget Guardrails Performance
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeRecurring}
                onChange={(e) => setIncludeRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Recurring Subscriptions &amp; Outliers
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Full Transaction Ledger ({filteredTx.length})
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Strictly grounded record-keeping export</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {/* Quick Export Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport(format)}
              className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                format === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating {format.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  {format === 'excel' ? (
                    <FileSpreadsheet className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>Download {format === 'excel' ? 'Excel (.xlsx)' : 'PDF Report'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
