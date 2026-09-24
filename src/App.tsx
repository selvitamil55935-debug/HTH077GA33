/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SummaryCards } from './components/SummaryCards';
import { RecurringExpensesCard } from './components/RecurringExpensesCard';
import { FinancialCharts } from './components/FinancialCharts';
import { DashboardAlerts } from './components/DashboardAlerts';
import { TransactionTable } from './components/TransactionTable';
import { BudgetManager } from './components/BudgetManager';
import { FinancialReport } from './components/FinancialReport';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AISuiteHub } from './components/AISuiteHub';
import { AuthModal } from './components/AuthModal';
import { AIExplainerModal } from './components/AIExplainerModal';
import { ExportModal } from './components/ExportModal';
import { LoginPage } from './components/LoginPage';
import { ToastContainer } from './components/ToastContainer';
import {
  Sparkles,
  BarChart3,
  CreditCard,
  Target,
  FileText,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Building2,
  User,
  HelpCircle,
  ArrowDownToLine,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    mode,
    setMode,
    loadDemoData,
    triggerAIAnalysis,
    isAnalyzing,
    user,
    exportModalOpen,
    exportDefaultFormat,
    openExportModal,
    closeExportModal,
  } = useFinance();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Authentication Gate: Only when logged in does the website open
  if (!user) {
    return <LoginPage />;
  }

  // If user explicitly navigated to landing page showcase
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <Navbar onOpenAuth={() => setAuthModalOpen(true)} />
        <main id="main-content">
          <LandingPage onOpenAuth={() => setAuthModalOpen(true)} />
        </main>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <AIExplainerModal />
        <ExportModal
          isOpen={exportModalOpen}
          onClose={closeExportModal}
          defaultFormat={exportDefaultFormat}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-blue-500 selection:text-white">
      {/* Skip to Main Content Link for Screen Readers & Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg"
      >
        Skip to main content
      </a>

      {/* Main Top Navigation */}
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sub-Header Banner with Mode Context & Quick Switch */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Evidence-Based Finance Advisor</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {mode === 'personal' ? 'Personal' : 'SME Business'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strictly grounded transaction intelligence • Zero generic advice • Gemini AI
            </p>
          </div>

          {/* Quick Actions in Sub-header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={triggerAIAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
              title="Run deep evidence-based Gemini analysis"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
            </button>

            <button
              onClick={() => loadDemoData()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Reset with 6-month synthetic dataset"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Reload Demo Data</span>
            </button>

            <button
              onClick={() => openExportModal('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
              title="Export financial analysis to Excel or PDF format"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export PDF / Excel</span>
            </button>
          </div>
        </div>

        {/* Tab View Switching */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <SummaryCards />
            <RecurringExpensesCard />
            <FinancialCharts />
            <DashboardAlerts />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <TransactionTable />
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <BudgetManager />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <FinancialReport />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <WhatIfSimulator />
          </div>
        )}

        {activeTab === 'ai-studio' && (
          <div className="space-y-6">
            <AISuiteHub />
          </div>
        )}
      </main>

      {/* Footer Notice */}
      <footer className="no-print mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs text-center text-xs text-slate-500 dark:text-slate-400 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-left text-[11px] max-w-xl">
            &quot;This application provides transaction analysis and educational financial insights. It is not a substitute for professional financial advice.&quot;
          </p>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Landing Page
            </button>
            <span>•</span>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Account / Switch
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AIExplainerModal />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={closeExportModal}
        defaultFormat={exportDefaultFormat}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
      <ToastContainer />
    </FinanceProvider>
  );
}
