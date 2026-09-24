import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import {
  TrendingUp,
  Building2,
  User,
  Sun,
  Moon,
  RefreshCw,
  FileText,
  BarChart3,
  Sliders,
  CreditCard,
  Target,
  Menu,
  X,
  LogOut,
  Sparkles,
  Info,
  ArrowDownToLine,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    user,
    mode,
    setMode,
    darkMode,
    setDarkMode,
    activeTab,
    setActiveTab,
    loadDemoData,
    logout,
    openExportModal,
    toasts,
    triggerAIAnalysis,
    isAnalyzing,
  } = useFinance();
  const { t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'transactions', label: t('nav.transactions'), icon: CreditCard },
    { id: 'budgets', label: t('nav.budgets'), icon: Target },
    { id: 'report', label: t('nav.report'), icon: FileText },
    { id: 'simulator', label: t('nav.simulator'), icon: Sliders },
    { id: 'ai-studio', label: t('nav.aiStudio'), icon: Sparkles, badge: 'Gemini' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
              aria-label="Evidence-Based Finance Advisor Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  FinAdvisor <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Evidence AI</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Personal &amp; SME Transaction Analysis
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Mode Toggle, Demo Button, Dark Mode, Profile */}
          <div className="flex items-center gap-2">
            {/* Personal Mode | SME Mode Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                onClick={() => setMode('personal')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'personal'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-pressed={mode === 'personal'}
                title="Switch to Personal Finance Mode"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.personal')}</span>
              </button>
              <button
                onClick={() => setMode('sme')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'sme'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-pressed={mode === 'sme'}
                title="Switch to SME Business Finance Mode"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.sme')}</span>
              </button>
            </div>

            {/* Export Data & Report Button */}
            <button
              onClick={() => openExportModal('excel')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
              title="Export financial analysis to Excel (.xlsx) or PDF"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('common.exportPdfExcel')}</span>
            </button>

            {/* Load Demo Data Button */}
            <button
              onClick={() => loadDemoData()}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
              title="Reload realistic 6-month synthetic dataset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('nav.loadDemoData')}</span>
            </button>

            {/* Real-time Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-lg transition-colors relative ${
                  notificationsOpen
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Notification alerts"
                title="Real-time alerts and activity"
              >
                <Bell className="w-4 h-4" />
                {toasts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {/* Notification Drawer Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Live Alerts &amp; Activities
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Real-time Active
                    </span>
                  </div>

                  <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                    {toasts.length === 0 ? (
                      <div className="text-center py-6 px-4">
                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          All caught up!
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Real-time toast notifications pop up automatically whenever you upload transactions or when Gemini finishes a health report.
                        </p>
                      </div>
                    ) : (
                      toasts.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-slate-400">active</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            {t.message}
                          </p>
                          {t.action && (
                            <button
                              type="button"
                              onClick={() => {
                                t.action?.onClick();
                                setNotificationsOpen(false);
                              }}
                              className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {t.action.label} &rarr;
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => {
                        triggerAIAnalysis();
                        setNotificationsOpen(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAnalyzing ? 'Analyzing with AI...' : 'Run New AI Analysis'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-blue-500"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="hidden sm:flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                  title={`Signed in as ${user.email}`}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                {t('nav.signIn')}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                openExportModal('excel');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{t('common.exportPdfExcel')}</span>
            </button>
            <button
              onClick={() => {
                loadDemoData();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('nav.loadDemoData')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('landing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-xs text-slate-500 hover:underline"
            >
              {t('nav.landingPage')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
