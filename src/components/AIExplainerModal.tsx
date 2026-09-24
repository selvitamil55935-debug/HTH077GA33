import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Sparkles, CheckCircle2, Copy, Check, Info } from 'lucide-react';

export const AIExplainerModal: React.FC = () => {
  const { explainerOpen, explainerData, closeChartExplainer, mode } = useFinance();
  const [copied, setCopied] = useState(false);

  if (!explainerOpen) return null;

  const handleCopy = () => {
    if (!explainerData) return;
    const text = `${explainerData.title}\n\n${explainerData.explanation}\n\nKey Takeaways:\n${explainerData.keyTakeaways.map((t) => `• ${t}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeChartExplainer();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeChartExplainer}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close explainer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 id="explainer-title" className="text-base font-bold text-slate-900 dark:text-white">
              {explainerData?.title || 'AI Transaction Intelligence'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instant interpretation • {mode === 'personal' ? 'Personal Finance' : 'SME Business'}
            </p>
          </div>
        </div>

        {/* Content */}
        {!explainerData ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Synthesizing chart data points...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {explainerData.explanation}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Key Analytical Takeaways</span>
              </h3>
              <ul className="space-y-2">
                {explainerData.keyTakeaways.map((takeaway, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> Grounded in actual ledger records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={closeChartExplainer}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
