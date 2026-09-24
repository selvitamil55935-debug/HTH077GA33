import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AnalysisReport, Budget, Category, Transaction, User, ToastNotification } from '../types';
import {
  generatePersonalTransactions,
  generateSMETransactions,
  PERSONAL_BUDGETS,
  SME_BUDGETS,
} from '../utils/sampleData';
import { runAIFinancialAnalysis, explainFinancialChart } from '../services/geminiService';
import { generateEvidenceBasedReport } from '../utils/analysisEngine';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import {
  syncUserProfile,
  subscribeUserTransactions,
  subscribeUserBudgets,
  saveTransactionToFirestore,
  saveBatchTransactionsToFirestore,
  deleteTransactionFromFirestore,
  saveBudgetToFirestore,
} from '../firebase/firestoreService';

export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'report'
  | 'simulator'
  | 'ai-studio';

interface FinanceContextType {
  user: User | null;
  mode: 'personal' | 'sme';
  setMode: (mode: 'personal' | 'sme') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  budgets: Budget[];
  currentReport: AnalysisReport | null;
  isAnalyzing: boolean;
  currency: string;
  announcement: string;
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addTransactionsBatch: (txs: Omit<Transaction, 'id' | 'userId'>[]) => void;
  updateBudget: (category: Category, limit: number) => void;
  loadDemoData: (targetMode?: 'personal' | 'sme') => void;
  triggerAIAnalysis: () => Promise<void>;
  login: (email: string, name?: string, mode?: 'personal' | 'sme', currency?: string) => void;
  loginWithGoogle: (targetMode?: 'personal' | 'sme') => Promise<void>;
  logout: () => void;
  // Real-time Toast Notifications
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  // Chart Explainer Modal
  explainerOpen: boolean;
  explainerData: { title: string; explanation: string; keyTakeaways: string[] } | null;
  openChartExplainer: (type: any, data: any) => Promise<void>;
  closeChartExplainer: () => void;
  // Export Modal State & Handlers
  exportModalOpen: boolean;
  exportDefaultFormat: 'excel' | 'pdf';
  openExportModal: (format?: 'excel' | 'pdf') => void;
  closeExportModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [mode, setModeState] = useState<'personal' | 'sme'>('personal');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('finance_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [personalTransactions, setPersonalTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('personal_txs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generatePersonalTransactions();
  });

  const [smeTransactions, setSmeTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sme_txs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateSMETransactions();
  });

  const [personalBudgets, setPersonalBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('personal_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PERSONAL_BUDGETS;
  });

  const [smeBudgets, setSmeBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('sme_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return SME_BUDGETS;
  });

  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');

  // Real-time toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== newToast.id)].slice(0, 5));
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Explainer modal state
  const [explainerOpen, setExplainerOpen] = useState<boolean>(false);
  const [explainerData, setExplainerData] = useState<{
    title: string;
    explanation: string;
    keyTakeaways: string[];
  } | null>(null);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportDefaultFormat, setExportDefaultFormat] = useState<'excel' | 'pdf'>('excel');

  const openExportModal = (format: 'excel' | 'pdf' = 'excel') => {
    setExportDefaultFormat(format);
    setExportModalOpen(true);
  };

  const closeExportModal = () => {
    setExportModalOpen(false);
  };

  // Sync theme
  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    localStorage.setItem('theme', val ? 'dark' : 'light');
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && !user) {
        const newUser: User = {
          userId: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          mode: 'personal',
          currency: '₹',
        };
        setUser(newUser);
        localStorage.setItem('finance_user', JSON.stringify(newUser));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time changes for transactions & budgets
  useEffect(() => {
    if (!user?.userId) return;

    const unsubscribeTx = subscribeUserTransactions(user.userId, (firestoreTxs) => {
      if (firestoreTxs && firestoreTxs.length > 0) {
        const pTxs = firestoreTxs.filter((t) => !t.isBusiness);
        const sTxs = firestoreTxs.filter((t) => t.isBusiness);
        if (pTxs.length > 0) setPersonalTransactions(pTxs);
        if (sTxs.length > 0) setSmeTransactions(sTxs);
      }
    });

    const unsubscribeBudgets = subscribeUserBudgets(user.userId, (firestoreBudgets) => {
      if (firestoreBudgets && firestoreBudgets.length > 0) {
        const pBudgets = firestoreBudgets.filter((b) => !b.isBusiness);
        const sBudgets = firestoreBudgets.filter((b) => b.isBusiness);
        if (pBudgets.length > 0) setPersonalBudgets(pBudgets);
        if (sBudgets.length > 0) setSmeBudgets(sBudgets);
      }
    });

    return () => {
      unsubscribeTx();
      unsubscribeBudgets();
    };
  }, [user?.userId]);

  // Current transactions based on mode
  const transactions = useMemo(() => {
    return mode === 'personal' ? personalTransactions : smeTransactions;
  }, [mode, personalTransactions, smeTransactions]);

  const budgets = useMemo(() => {
    return mode === 'personal' ? personalBudgets : smeBudgets;
  }, [mode, personalBudgets, smeBudgets]);

  // Re-generate report whenever transactions, budgets, or mode changes
  useEffect(() => {
    if (transactions.length > 0) {
      const rep = generateEvidenceBasedReport(transactions, budgets, mode);
      setCurrentReport(rep);
    }
  }, [transactions, budgets, mode]);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('personal_txs', JSON.stringify(personalTransactions));
  }, [personalTransactions]);

  useEffect(() => {
    localStorage.setItem('sme_txs', JSON.stringify(smeTransactions));
  }, [smeTransactions]);

  useEffect(() => {
    localStorage.setItem('personal_budgets', JSON.stringify(personalBudgets));
  }, [personalBudgets]);

  useEffect(() => {
    localStorage.setItem('sme_budgets', JSON.stringify(smeBudgets));
  }, [smeBudgets]);

  const setMode = (newMode: 'personal' | 'sme') => {
    setModeState(newMode);
    setAnnouncement(`Switched to ${newMode === 'sme' ? 'Small Business (SME)' : 'Personal'} Mode`);
    if (user) {
      const updatedUser = { ...user, mode: newMode };
      setUser(updatedUser);
      localStorage.setItem('finance_user', JSON.stringify(updatedUser));
      syncUserProfile(user.userId, { mode: newMode });
    }
  };

  const login = (
    email: string,
    name: string = 'Demo User',
    userMode: 'personal' | 'sme' = 'personal',
    userCurrency: string = '₹'
  ) => {
    const newUser: User = {
      userId: `user_${Date.now()}`,
      name: name || (email.split('@')[0] ?? 'User'),
      email,
      mode: userMode,
      currency: userCurrency || '₹',
    };
    setUser(newUser);
    setModeState(userMode);
    localStorage.setItem('finance_user', JSON.stringify(newUser));
    setActiveTab('dashboard');
    setAnnouncement(`Welcome, ${newUser.name}. Signed into ${userMode} mode.`);

    syncUserProfile(newUser.userId, {
      name: newUser.name,
      email: newUser.email,
      mode: newUser.mode,
      currency: newUser.currency,
    });
  };

  const loginWithGoogle = async (targetMode: 'personal' | 'sme' = 'personal') => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;
      const newUser: User = {
        userId: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        mode: targetMode,
        currency: '₹',
      };
      setUser(newUser);
      setModeState(targetMode);
      localStorage.setItem('finance_user', JSON.stringify(newUser));
      await syncUserProfile(newUser.userId, {
        name: newUser.name,
        email: newUser.email,
        mode: newUser.mode,
        currency: newUser.currency,
      });
      addToast({
        type: 'success',
        title: 'Google Sign-In Verified',
        message: `Welcome, ${newUser.name}! Connected to Firebase Firestore.`,
      });
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      addToast({
        type: 'error',
        title: 'Google Sign-In Error',
        message: err.message || 'Could not authenticate with Google.',
      });
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('finance_user');
    setActiveTab('dashboard');
    setAnnouncement('Logged out successfully.');
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'userId'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.userId || 'guest',
      isBusiness: mode === 'sme',
    };

    if (mode === 'personal') {
      setPersonalTransactions((prev) => [newTx, ...prev]);
    } else {
      setSmeTransactions((prev) => [newTx, ...prev]);
    }

    if (user?.userId) {
      saveTransactionToFirestore(user.userId, newTx);
    }

    const currSymbol = user?.currency || '₹';
    setAnnouncement(`Added transaction: ${tx.description} of ${currSymbol}${tx.amount}`);
    addToast({
      type: 'success',
      title: 'New Transaction Logged',
      message: `${tx.type === 'Income' ? 'Recorded credit of' : 'Recorded debit of'} ${currSymbol}${Number(tx.amount).toLocaleString()} for "${tx.description}".`,
      action: {
        label: 'View Transactions',
        onClick: () => setActiveTab('transactions'),
      },
    });
  };

  const updateTransaction = (updatedTx: Transaction) => {
    if (mode === 'personal') {
      setPersonalTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    } else {
      setSmeTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    }
    if (user?.userId) {
      saveTransactionToFirestore(user.userId, updatedTx);
    }
    setAnnouncement(`Updated transaction: ${updatedTx.description}`);
  };

  const deleteTransaction = (id: string) => {
    if (mode === 'personal') {
      setPersonalTransactions((prev) => prev.filter((t) => t.id !== id));
    } else {
      setSmeTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    if (user?.userId) {
      deleteTransactionFromFirestore(user.userId, id);
    }
    setAnnouncement('Transaction deleted');
  };

  const addTransactionsBatch = (txs: Omit<Transaction, 'id' | 'userId'>[]) => {
    const newItems: Transaction[] = txs.map((tx, idx) => ({
      ...tx,
      id: `batch_${Date.now()}_${idx}`,
      userId: user?.userId || 'guest',
      isBusiness: mode === 'sme',
    }));

    if (mode === 'personal') {
      setPersonalTransactions((prev) => [...newItems, ...prev]);
    } else {
      setSmeTransactions((prev) => [...newItems, ...prev]);
    }

    if (user?.userId) {
      saveBatchTransactionsToFirestore(user.userId, newItems);
    }

    setAnnouncement(`Imported ${newItems.length} transactions successfully.`);
    addToast({
      type: 'success',
      title: 'Transactions Uploaded',
      message: `Successfully uploaded & processed ${newItems.length} transactions into your ledger.`,
      duration: 7000,
      action: {
        label: 'View Ledger',
        onClick: () => setActiveTab('transactions'),
      },
    });
  };

  const updateBudget = (category: Category, limit: number) => {
    const isBiz = mode === 'sme';
    const newBudget: Budget = {
      id: `b_${category.replace(/\s+/g, '_').toLowerCase()}`,
      userId: user?.userId || 'user',
      category,
      limit,
      period: 'monthly',
      isBusiness: isBiz,
    };

    if (mode === 'personal') {
      setPersonalBudgets((prev) => {
        const existing = prev.find((b) => b.category === category);
        if (existing) {
          return prev.map((b) => (b.category === category ? { ...b, limit } : b));
        }
        return [...prev, newBudget];
      });
    } else {
      setSmeBudgets((prev) => {
        const existing = prev.find((b) => b.category === category);
        if (existing) {
          return prev.map((b) => (b.category === category ? { ...b, limit } : b));
        }
        return [...prev, newBudget];
      });
    }

    if (user?.userId) {
      saveBudgetToFirestore(user.userId, newBudget);
    }

    setAnnouncement(`Budget updated for ${category} to ₹${limit}`);
  };

  const loadDemoData = (targetMode?: 'personal' | 'sme') => {
    const selectedMode = targetMode || mode;
    if (selectedMode === 'personal') {
      const data = generatePersonalTransactions();
      setPersonalTransactions(data);
      setPersonalBudgets(PERSONAL_BUDGETS);
      if (user?.userId) {
        saveBatchTransactionsToFirestore(user.userId, data.slice(0, 30));
      }
    } else {
      const data = generateSMETransactions();
      setSmeTransactions(data);
      setSmeBudgets(SME_BUDGETS);
      if (user?.userId) {
        saveBatchTransactionsToFirestore(user.userId, data.slice(0, 30));
      }
    }
    setAnnouncement(`Loaded 6 months of realistic ${selectedMode} synthetic financial transactions.`);
    addToast({
      type: 'info',
      title: `${selectedMode === 'personal' ? 'Personal' : 'SME Business'} Ledger Loaded`,
      message: `Populated 6 months of realistic transactions and budget limits.`,
      action: {
        label: 'Explore Ledger',
        onClick: () => setActiveTab('transactions'),
      },
    });
  };

  const triggerAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnnouncement('Generating evidence-based AI financial health analysis with Gemini...');
    try {
      const report = await runAIFinancialAnalysis(transactions, budgets, mode);
      setCurrentReport(report);
      setAnnouncement('AI analysis complete. Report updated.');
      addToast({
        type: 'ai',
        title: 'AI Financial Health Report Ready',
        message: `Health Score: ${report.summary.financialHealthScore}/100 with ${report.prioritizedActions.length} evidence-backed action plans ready to view.`,
        duration: 9000,
        action: {
          label: 'Open Report',
          onClick: () => setActiveTab('report'),
        },
      });
    } catch (e: any) {
      console.warn('AI analysis fallback:', e);
      const fallbackReport = generateEvidenceBasedReport(transactions, budgets, mode);
      setCurrentReport(fallbackReport);
      setAnnouncement('AI analysis completed using local evidence engine.');
      addToast({
        type: 'info',
        title: 'Health Report Computed',
        message: `Financial Health Score: ${fallbackReport.summary.financialHealthScore}/100 ready to view.`,
        action: {
          label: 'Open Report',
          onClick: () => setActiveTab('report'),
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openChartExplainer = async (type: any, data: any) => {
    setExplainerOpen(true);
    try {
      const explanation = await explainFinancialChart(type, data, mode);
      setExplainerData(explanation);
    } catch (e) {
      setExplainerData({
        title: 'Chart Analysis',
        explanation:
          'This chart illustrates your monthly transaction distribution. Key anomalies are highlighted based on deviations from your baseline historical trends.',
        keyTakeaways: [
          'Monitor the top 2 expenditure categories',
          'Ensure recurring outlays are within the 50/30/20 guidance',
        ],
      });
    }
  };

  const closeChartExplainer = () => {
    setExplainerOpen(false);
    setExplainerData(null);
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        mode,
        setMode,
        darkMode,
        setDarkMode,
        activeTab,
        setActiveTab,
        transactions,
        filteredTransactions: transactions,
        budgets,
        currentReport,
        isAnalyzing,
        currency: user?.currency || '₹',
        announcement,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTransactionsBatch,
        updateBudget,
        loadDemoData,
        triggerAIAnalysis,
        login,
        loginWithGoogle,
        logout,
        toasts,
        addToast,
        removeToast,
        explainerOpen,
        explainerData,
        openChartExplainer,
        closeChartExplainer,
        exportModalOpen,
        exportDefaultFormat,
        openExportModal,
        closeExportModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
