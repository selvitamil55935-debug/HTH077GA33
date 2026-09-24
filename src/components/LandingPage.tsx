import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  TrendingUp,
  ShieldCheck,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Building2,
  UserCheck,
  Zap,
  Lock,
  PieChart,
  Target,
  Sparkles,
  BarChart4,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { setActiveTab, setMode, loadDemoData } = useFinance();

  const handleLaunchPersonal = () => {
    setMode('personal');
    loadDemoData('personal');
    setActiveTab('dashboard');
  };

  const handleLaunchSME = () => {
    setMode('sme');
    loadDemoData('sme');
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Evidence-Based Transaction Intelligence • Gemini AI</span>
          </div>

          {/* Title & Tagline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Turn your transactions into{' '}
            <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              actionable financial insights.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop receiving generic financial platitudes like &quot;save more money&quot;. FinAdvisor connects every single recommendation to concrete transaction receipts, pinpointing hidden subscriptions, outlier spikes, and budget leaks for individuals and SMEs.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLaunchPersonal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] focus:ring-4 focus:ring-blue-300"
            >
              <UserCheck className="w-4 h-4" />
              <span>Launch Personal Demo</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={handleLaunchSME}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300"
            >
              <Building2 className="w-4 h-4" />
              <span>Launch SME Business Demo</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              Sign In / Register
            </button>
          </div>

          {/* Evidence Guarantee Banner */}
          <div className="mt-10 max-w-xl mx-auto p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">Zero-Generic Advice Rule:</span> Every finding is strictly anchored to transaction dates, frequencies, and rupee amounts extracted from your ledger.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Engineered for Genuine Financial Transparency
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Transform messy raw statement feeds into clean categorical patterns and mathematical insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Automated Pattern Detection
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Identifies recurring monthly subscriptions (Netflix, Spotify, SaaS tools), micro-drain habits (daily coffee runs), and sudden expenditure spikes with statistical outlier detection.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Evidence-Grounded AI Report
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Powered by Gemini API. Synthesizes full datasets into an executive financial health report featuring High, Medium, and Low prioritized tactical action items with proof.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Dynamic &quot;What-If&quot; Simulator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Interact with spending category sliders to preview immediate monthly and compound annual cash flow adjustments before committing to behavioral shifts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              How FinAdvisor Works
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              From statement raw data to verified action plan in 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Upload or Sync Ledger
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Drag and drop your bank CSV statements or enter transactions manually. FinAdvisor supports standard multi-column formats.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Statistical &amp; Pattern Audit
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Our analysis engine calculates cash flow velocity, identifies recurring commitments, and flags anomalous spending requiring review.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Evidence-Based Action Report
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Receive prioritized recommendations directly connected to transaction line items with quantified potential annual savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
            Privacy &amp; Data Security First
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-6">
            Your financial ledger data stays under your control. We never store personal bank credentials, and data is processed locally and via secure, zero-retention AI analysis channels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Bank Logins
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload CSV exports directly; no bank credentials or third-party screen scraping required.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Non-Judgmental Terminology
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ethical labeling: Flags items purely as &quot;Unusual transaction&quot; or &quot;Spending requiring review&quot;.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evidence Grounding
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI outputs are strictly constrained to factual patterns detected from your ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 px-4">
        <p className="max-w-2xl mx-auto">
          &quot;This application provides transaction analysis and educational financial insights. It is not a substitute for professional financial advice.&quot;
        </p>
        <p className="mt-2 text-slate-400">
          Evidence-Based Personal &amp; SME Finance Advisor • Hackathon Edition
        </p>
      </footer>
    </div>
  );
};
