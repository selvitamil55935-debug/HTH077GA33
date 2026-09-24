import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  SlidersHorizontal,
  History,
  X,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { CsvUploadModal } from './CsvUploadModal';

export const TransactionTable: React.FC = () => {
  const { transactions, deleteTransaction, currency, mode, currentReport, openExportModal } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Search history state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('tx_search_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return mode === 'personal'
      ? ['Salary', 'Netflix', 'Swiggy', 'Amazon', 'Rent', 'Uber']
      : ['AWS', 'Client Invoices', 'Google Workspace', 'Payroll', 'Office Rent', 'Meta Ads'];
  });
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save term to search history
  const handleSaveSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('tx_search_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSelectHistoryItem = (item: string) => {
    setSearchTerm(item);
    setCurrentPage(1);
    setShowSearchHistory(false);
    handleSaveSearch(item);
  };

  const handleRemoveHistoryItem = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem('tx_search_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('tx_search_history');
    } catch (e) {}
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setDateRange('all');
    setCurrentPage(1);
  };

  // Category counts for quick filter chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  // Top common categories sorted by transaction count
  const topCommonCategories = useMemo(() => {
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }, [categoryCounts]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique categories from current transactions
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered and sorted transactions
  const processedTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search filter
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(s);
          const matchCat = t.category.toLowerCase().includes(s);
          const matchNote = t.notes?.toLowerCase().includes(s) || false;
          if (!matchDesc && !matchCat && !matchNote) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && t.category !== selectedCategory) {
          return false;
        }

        // Type filter
        if (selectedType !== 'all' && t.type !== selectedType) {
          return false;
        }

        // Date range filter
        if (dateRange !== 'all') {
          const txDate = new Date(t.date).getTime();
          const now = new Date('2026-09-24').getTime();
          const daysDiff = (now - txDate) / (1000 * 60 * 60 * 24);

          if (dateRange === '30' && daysDiff > 35) return false;
          if (dateRange === '90' && daysDiff > 95) return false;
          if (dateRange === '180' && daysDiff > 185) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const timeA = new Date(a.date).getTime();
          const timeB = new Date(b.date).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        } else {
          return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
      });
  }, [transactions, searchTerm, selectedCategory, selectedType, dateRange, sortField, sortOrder]);

  const totalPages = Math.ceil(processedTransactions.length / pageSize) || 1;
  const paginatedTransactions = processedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCsv = () => {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Notes'];
    const rows = processedTransactions.map((t) => [
      `"${t.date}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'personal' ? 'Personal Transaction Ledger' : 'SME Business Transaction Ledger'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {processedTransactions.length} of {transactions.length} total entries displayed
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
              aria-expanded={exportMenuOpen}
              aria-haspopup="true"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Export Format
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    if (currentReport) {
                      exportToExcel(currentReport, transactions, currency);
                    } else {
                      openExportModal('excel');
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Excel Workbook (.xlsx)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Multi-sheet ledger &amp; AI insights</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    if (currentReport) {
                      exportToPdf(currentReport, transactions, currency);
                    } else {
                      openExportModal('pdf');
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Audit PDF Report (.pdf)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Formal report with Health Score</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportCsv();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Filtered CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Raw table view ({processedTransactions.length} rows)</div>
                  </div>
                </button>

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      openExportModal('excel');
                    }}
                    className="w-full px-2.5 py-1.5 text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>More Export Settings &amp; Filters...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Search History & Quick Category Chips */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search with Search History Dropdown */}
          <div className="relative" ref={searchContainerRef}>
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setShowSearchHistory(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveSearch(searchTerm);
                  setShowSearchHistory(false);
                }
              }}
              onBlur={() => {
                if (searchTerm.trim().length >= 2) {
                  handleSaveSearch(searchTerm);
                }
              }}
              placeholder="Search description, merchant, notes..."
              className="w-full pl-9 pr-14 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Clear Query or History Toggle Icons */}
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSearchHistory(!showSearchHistory)}
                className={`p-1 rounded-md transition-colors ${
                  showSearchHistory
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
                title="Search history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Floating Search History Popup */}
            {showSearchHistory && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>Recent Searches</span>
                  </div>
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-semibold transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No recent searches recorded. Type and press Enter to save.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850">
                    {searchHistory.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 group cursor-pointer transition-colors"
                        onClick={() => handleSelectHistoryItem(item)}
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          <History className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                          <span className="font-medium">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveHistoryItem(item, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 opacity-60 group-hover:opacity-100 transition-all"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-3 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Press &apos;Enter&apos; to search &amp; record</span>
                  <span className="text-slate-400">{searchHistory.length} saved</span>
                </div>
              </div>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories ({transactions.length})</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Flows (In &amp; Out)</option>
              <option value="Income">Income / Inflows Only</option>
              <option value="Expense">Expense / Outflows Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Historical Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
            </select>
          </div>
        </div>

        {/* Quick Search History Chips (Inline Fast-Access) */}
        {searchHistory.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
              <History className="w-3 h-3 text-slate-400" />
              <span>Recent Searches:</span>
            </span>
            {searchHistory.slice(0, 5).map((term) => {
              const isActive = searchTerm.toLowerCase() === term.toLowerCase();
              return (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setSearchTerm('');
                    } else {
                      handleSelectHistoryItem(term);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700'
                  }`}
                  title={`Filter by "${term}"`}
                >
                  <span>{term}</span>
                  {isActive && <Check className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick-Filter Chips for Common Transaction Categories */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Quick Category Filters</span>
              <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                (Click to isolate or toggle off)
              </span>
            </div>

            {/* Clear All Filters Button */}
            {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || dateRange !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                title="Reset all search queries and active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Chips Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* "All" Category Chip */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <span>All Categories</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {transactions.length}
              </span>
            </button>

            {/* Common Category Chips */}
            {topCommonCategories.slice(0, 8).map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'all' : cat);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs ring-2 ring-blue-500/25'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-750 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                  title={`Filter transactions by "${cat}" (${count} entries)`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary Strip */}
        {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || dateRange !== 'all') && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400">Active Filters:</span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                  <span>Query: &quot;{searchTerm}&quot;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="hover:text-blue-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                    className="hover:text-indigo-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-medium">
                  <span>Flow: {selectedType}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('all');
                      setCurrentPage(1);
                    }}
                    className="hover:text-purple-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {dateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                  <span>Period: Last {dateRange} Days</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDateRange('all');
                      setCurrentPage(1);
                    }}
                    className="hover:text-amber-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Matching <span className="font-bold text-slate-800 dark:text-slate-200">{processedTransactions.length}</span> of {transactions.length} records
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" aria-label="Transactions Table">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="py-3 px-4">
                  Description
                </th>
                <th scope="col" className="py-3 px-4">
                  Category
                </th>
                <th scope="col" className="py-3 px-4">
                  Type
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          tx.type === 'Income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                        tx.type === 'Income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'Income' ? '+' : '-'}{currency}{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit transaction"
                          aria-label={`Edit ${tx.description}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete transaction"
                          aria-label={`Delete ${tx.description}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        transactionToEdit={editingTransaction}
      />

      {/* CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />
    </div>
  );
};
