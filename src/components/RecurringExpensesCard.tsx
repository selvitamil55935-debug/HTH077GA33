import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  CreditCard,
  Tv,
  Server,
  Zap,
  Building,
  Wifi,
  Shield,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface DetailedRecurringItem {
  id: string;
  name: string;
  category: string;
  frequency: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Quarterly';
  currentAmount: number;
  averageAmount: number;
  historicalPayments: { date: string; monthLabel: string; amount: number }[];
  priceChangePercent: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastPaidDate: string;
  nextDueDate: string;
  daysUntilDue: number;
  isSubscription: boolean;
}

export const RecurringExpensesCard: React.FC = () => {
  const { transactions, currency, mode, addToast } = useFinance();
  const { t } = useLanguage();

  const [filterType, setFilterType] = useState<'all' | 'increasing' | 'subscriptions' | 'utilities'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'change'>('dueDate');
  const [flaggedItems, setFlaggedItems] = useState<Record<string, boolean>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Compute rich recurring expense tracking data
  const recurringItems: DetailedRecurringItem[] = useMemo(() => {
    const expenseTxs = transactions.filter((t) => t.type === 'Expense');
    const groupMap: Record<string, typeof transactions> = {};

    expenseTxs.forEach((tx) => {
      // Normalize description to identify repeat billing
      const norm = tx.description
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 3)
        .join(' ');

      if (!groupMap[norm]) {
        groupMap[norm] = [];
      }
      groupMap[norm].push(tx);
    });

    const items: DetailedRecurringItem[] = [];
    const today = new Date();

    Object.entries(groupMap).forEach(([key, txs]) => {
      // Must have occurred at least 2 times to establish recurring pattern
      if (txs.length >= 2) {
        // Chronological order
        const sorted = [...txs].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const amounts = sorted.map((t) => t.amount);
        const firstAmount = amounts[0];
        const latestAmount = amounts[amounts.length - 1];
        const avgAmount = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);

        // Price trajectory
        const priceDiff = latestAmount - firstAmount;
        const percentChange = firstAmount > 0 ? Math.round((priceDiff / firstAmount) * 100) : 0;

        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (percentChange >= 4) {
          trend = 'increasing';
        } else if (percentChange <= -4) {
          trend = 'decreasing';
        }

        // Interval calculation
        let dayDiffSum = 0;
        for (let i = 1; i < sorted.length; i++) {
          const d1 = new Date(sorted[i - 1].date).getTime();
          const d2 = new Date(sorted[i].date).getTime();
          dayDiffSum += (d2 - d1) / (1000 * 60 * 60 * 24);
        }
        const avgDays = dayDiffSum / (sorted.length - 1);

        let freq: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Quarterly' = 'Monthly';
        let cycleDays = 30;
        if (avgDays <= 9) {
          freq = 'Weekly';
          cycleDays = 7;
        } else if (avgDays <= 18) {
          freq = 'Bi-Weekly';
          cycleDays = 14;
        } else if (avgDays >= 75) {
          freq = 'Quarterly';
          cycleDays = 90;
        }

        const lastDateObj = new Date(sorted[sorted.length - 1].date);
        // Project next due date forward to future
        let nextDateObj = new Date(lastDateObj);
        nextDateObj.setDate(nextDateObj.getDate() + cycleDays);

        // If next date has already passed, advance cycles until in future
        while (nextDateObj.getTime() < today.getTime()) {
          nextDateObj.setDate(nextDateObj.getDate() + cycleDays);
        }

        const diffTime = nextDateObj.getTime() - today.getTime();
        const daysUntilDue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // Category & Subscription classification
        const sampleDesc = sorted[0].description;
        const lowerDesc = sampleDesc.toLowerCase();
        const isSub =
          lowerDesc.includes('netflix') ||
          lowerDesc.includes('spotify') ||
          lowerDesc.includes('prime') ||
          lowerDesc.includes('cloud') ||
          lowerDesc.includes('aws') ||
          lowerDesc.includes('hosting') ||
          lowerDesc.includes('saas') ||
          lowerDesc.includes('github') ||
          lowerDesc.includes('software') ||
          lowerDesc.includes('subscription') ||
          lowerDesc.includes('gym');

        // Historical series for trend sparkline
        const historySeries = sorted.map((t) => {
          const d = new Date(t.date);
          return {
            date: t.date,
            monthLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: t.amount,
          };
        });

        items.push({
          id: `rec_${key.replace(/\s+/g, '_')}`,
          name: sorted[sorted.length - 1].description,
          category: sorted[0].category,
          frequency: freq,
          currentAmount: latestAmount,
          averageAmount: avgAmount,
          historicalPayments: historySeries,
          priceChangePercent: percentChange,
          trend,
          lastPaidDate: sorted[sorted.length - 1].date,
          nextDueDate: nextDateObj.toISOString().split('T')[0],
          daysUntilDue,
          isSubscription: isSub,
        });
      }
    });

    return items;
  }, [transactions]);

  // Filtered & Sorted items
  const displayItems = useMemo(() => {
    let filtered = recurringItems;

    if (filterType === 'increasing') {
      filtered = filtered.filter((i) => i.trend === 'increasing');
    } else if (filterType === 'subscriptions') {
      filtered = filtered.filter((i) => i.isSubscription);
    } else if (filterType === 'utilities') {
      filtered = filtered.filter((i) => !i.isSubscription);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'dueDate') {
        return a.daysUntilDue - b.daysUntilDue;
      }
      if (sortBy === 'amount') {
        return b.currentAmount - a.currentAmount;
      }
      if (sortBy === 'change') {
        return b.priceChangePercent - a.priceChangePercent;
      }
      return 0;
    });
  }, [recurringItems, filterType, sortBy]);

  // Aggregate Metrics
  const totalMonthlyRunRate = useMemo(() => {
    return recurringItems.reduce((sum, item) => {
      let multiplier = 1;
      if (item.frequency === 'Weekly') multiplier = 4.33;
      else if (item.frequency === 'Bi-Weekly') multiplier = 2.16;
      else if (item.frequency === 'Quarterly') multiplier = 0.33;
      return sum + item.currentAmount * multiplier;
    }, 0);
  }, [recurringItems]);

  const increasingCount = useMemo(() => {
    return recurringItems.filter((i) => i.trend === 'increasing').length;
  }, [recurringItems]);

  const toggleFlag = (id: string, name: string) => {
    const isNowFlagged = !flaggedItems[id];
    setFlaggedItems((prev) => ({ ...prev, [id]: isNowFlagged }));

    if (isNowFlagged) {
      addToast({
        type: 'warning',
        title: 'Subscription Flagged for Review',
        message: `"${name}" added to cancellation & renegotiation audit list.`,
      });
    }
  };

  // Helper for Category Icon
  const getCategoryIcon = (category: string, name: string) => {
    const lower = (category + ' ' + name).toLowerCase();
    if (lower.includes('netflix') || lower.includes('prime') || lower.includes('entertainment')) {
      return <Tv className="w-4 h-4 text-purple-500" />;
    }
    if (lower.includes('aws') || lower.includes('cloud') || lower.includes('hosting')) {
      return <Server className="w-4 h-4 text-sky-500" />;
    }
    if (lower.includes('utility') || lower.includes('electric') || lower.includes('power')) {
      return <Zap className="w-4 h-4 text-amber-500" />;
    }
    if (lower.includes('rent') || lower.includes('lease') || lower.includes('office')) {
      return <Building className="w-4 h-4 text-blue-500" />;
    }
    if (lower.includes('internet') || lower.includes('wifi') || lower.includes('telecom')) {
      return <Wifi className="w-4 h-4 text-emerald-500" />;
    }
    return <CreditCard className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-blue-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t('recurring.title')}
                {increasingCount > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {increasingCount} {t('recurring.priceIncreasesDetected')}
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('recurring.subtitle')} {mode === 'sme' ? t('recurring.subtitleSme') : t('recurring.subtitlePersonal')}.
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t('recurring.monthlyRunRate')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {currency}
                {Math.round(totalMonthlyRunRate).toLocaleString()}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t('recurring.trackedServices')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                {recurringItems.length} {t('common.active')}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t('recurring.annualCommitment')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300">
                {currency}
                {Math.round(totalMonthlyRunRate * 12).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Sorting Controls */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3" /> {t('common.filter')}:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t('recurring.filterAll')} ({recurringItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('increasing')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'increasing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t('recurring.filterPriceIncreases')} ({increasingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('subscriptions')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'subscriptions'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t('recurring.filterSubscriptions')}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('utilities')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'utilities'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t('recurring.filterUtilities')}
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
              <ArrowUpDown className="w-3 h-3" /> {t('common.sort')}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="dueDate">{t('recurring.sortSoonest')}</option>
              <option value="amount">{t('recurring.sortHighest')}</option>
              <option value="change">{t('recurring.sortChange')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Recurring List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {displayItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">{t('recurring.noRecurringMatched')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('recurring.tryAll')}</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const isFlagged = flaggedItems[item.id];
            const isExpanded = expandedItem === item.id;

            // Trend gradient colors
            const strokeColor =
              item.trend === 'increasing'
                ? '#e11d48'
                : item.trend === 'decreasing'
                ? '#10b981'
                : '#3b82f6';
            const gradientId = `grad_${item.id.replace(/[^a-zA-Z0-9]/g, '')}`;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50 ${
                  isFlagged ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Service Details & Frequency */}
                  <div className="flex items-start gap-3 min-w-[260px]">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getCategoryIcon(item.category, item.name)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </h4>
                        {isFlagged && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                            {t('recurring.flaggedForReview')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[11px] text-slate-600 dark:text-slate-300">
                          {item.frequency}
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.historicalPayments.length} {t('recurring.recordedPayments')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Next Due Date & Urgency Badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                        item.daysUntilDue <= 3
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                          : item.daysUntilDue <= 10
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                          : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <div>
                        <span className="block text-[10px] uppercase font-bold tracking-wider opacity-75">
                          {t('recurring.nextDue')}
                        </span>
                        <span>
                          {item.daysUntilDue === 0
                            ? t('recurring.dueToday')
                            : item.daysUntilDue === 1
                            ? t('recurring.dueTomorrow')
                            : t('recurring.inDays', {
                                days: item.daysUntilDue,
                                date: new Date(item.nextDueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                }),
                              })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center-Right: Sparkline Trend Line */}
                  <div className="w-full lg:w-44 h-12 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>{t('recurring.costTrend')}</span>
                      <span
                        className={`font-bold flex items-center gap-0.5 ${
                          item.trend === 'increasing'
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.trend === 'decreasing'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.trend === 'increasing' && <TrendingUp className="w-3 h-3" />}
                        {item.trend === 'decreasing' && <TrendingDown className="w-3 h-3" />}
                        {item.priceChangePercent > 0 ? `+${item.priceChangePercent}%` : item.priceChangePercent < 0 ? `${item.priceChangePercent}%` : t('recurring.stable')}
                      </span>
                    </div>

                    <div className="w-full h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={item.historicalPayments} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md font-mono">
                                    {data.monthLabel}: {currency}{data.amount.toLocaleString()}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Current Billing Amount & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 min-w-[170px]">
                    <div className="text-left lg:text-right">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block">
                        {currency}
                        {item.currentAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {t('recurring.avgMonth', {
                          currency,
                          amount: item.averageAmount.toLocaleString(),
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleFlag(item.id, item.name)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isFlagged
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                        title="Flag for cancellation or renegotiation review"
                      >
                        {isFlagged ? t('recurring.flaggedBtn') : t('recurring.auditBtn')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Toggle historical breakdown"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        {t('recurring.billingAudit')}
                      </span>
                      <span className="text-slate-500">
                        {t('recurring.firstBilled', {
                          date: item.historicalPayments[0]?.date,
                          lastDate: item.lastPaidDate,
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {item.historicalPayments.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                        >
                          <span className="text-slate-500">{p.monthLabel}</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {currency}{p.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {item.trend === 'increasing' && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                        <span>
                          {t('recurring.priceCreepAlert', {
                            percent: item.priceChangePercent,
                            currency,
                            firstAmount: item.historicalPayments[0]?.amount,
                            currentAmount: item.currentAmount,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
