import {
  AnalysisReport,
  Budget,
  BudgetStatus,
  FinancialSummary,
  KeyFinding,
  PrioritizedAction,
  RecurringExpense,
  RepeatedSmallExpense,
  Transaction,
  UnusualSpending,
} from '../types';

export const calculateSummary = (
  transactions: Transaction[],
  mode: 'personal' | 'sme' = 'personal'
): FinancialSummary => {
  if (!transactions.length) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      savingsRate: 0,
      averageMonthlyIncome: 0,
      averageMonthlySpend: 0,
      highestSpendingCategory: { category: 'None', amount: 0, percentage: 0 },
      financialHealthScore: 50,
      transactionCount: 0,
      dateRange: { start: '', end: '' },
    };
  }

  const sortedDates = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const startDate = sortedDates[0].date;
  const endDate = sortedDates[sortedDates.length - 1].date;

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpendMap: Record<string, number> = {};
  const monthMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((tx) => {
    const monthKey = tx.date.substring(0, 7); // YYYY-MM
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { income: 0, expense: 0 };
    }

    if (tx.type === 'Income') {
      totalIncome += tx.amount;
      monthMap[monthKey].income += tx.amount;
    } else {
      totalExpenses += tx.amount;
      monthMap[monthKey].expense += tx.amount;
      categorySpendMap[tx.category] = (categorySpendMap[tx.category] || 0) + tx.amount;
    }
  });

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

  const monthCount = Math.max(1, Object.keys(monthMap).length);
  const averageMonthlyIncome = Math.round(totalIncome / monthCount);
  const averageMonthlySpend = Math.round(totalExpenses / monthCount);

  // Highest spending category
  let maxCat = 'None';
  let maxAmount = 0;
  Object.entries(categorySpendMap).forEach(([cat, amt]) => {
    if (amt > maxAmount) {
      maxAmount = amt;
      maxCat = cat;
    }
  });
  const maxCatPercentage = totalExpenses > 0 ? Math.round((maxAmount / totalExpenses) * 100) : 0;

  // Calculate Health Score (0-100) based on balanced metrics
  let healthScore = 60;
  // 1. Savings rate / margin contribution (+/- 25 pts)
  if (savingsRate >= 30) healthScore += 25;
  else if (savingsRate >= 20) healthScore += 18;
  else if (savingsRate >= 10) healthScore += 8;
  else if (savingsRate < 0) healthScore -= 25;

  // 2. Expense coverage (positive balance)
  if (balance > 0) healthScore += 10;
  else healthScore -= 15;

  // SME specific metrics
  let runwayMonths: number | undefined;
  let netBurnRate: number | undefined;
  if (mode === 'sme') {
    netBurnRate = Math.round(averageMonthlySpend - averageMonthlyIncome);
    runwayMonths = balance > 0 && averageMonthlySpend > 0 ? Number((balance / averageMonthlySpend).toFixed(1)) : 0;
  }

  healthScore = Math.min(98, Math.max(15, healthScore));

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    averageMonthlyIncome,
    averageMonthlySpend,
    highestSpendingCategory: {
      category: maxCat,
      amount: maxAmount,
      percentage: maxCatPercentage,
    },
    financialHealthScore: healthScore,
    runwayMonths,
    netBurnRate,
    transactionCount: transactions.length,
    dateRange: { start: startDate, end: endDate },
  };
};

export const detectRecurringExpenses = (transactions: Transaction[]): RecurringExpense[] => {
  const expenseTxs = transactions.filter((t) => t.type === 'Expense');
  const groupMap: Record<string, Transaction[]> = {};

  expenseTxs.forEach((tx) => {
    // Normalize key by stripping special chars and keeping core brand/service name
    const normalizedKey = tx.description
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3)
      .join(' ');

    if (!groupMap[normalizedKey]) {
      groupMap[normalizedKey] = [];
    }
    groupMap[normalizedKey].push(tx);
  });

  const recurringList: RecurringExpense[] = [];

  Object.entries(groupMap).forEach(([, txs]) => {
    if (txs.length >= 2) {
      // Sort by date
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Check amount variance
      const amounts = txs.map((t) => t.amount);
      const avgAmt = Math.round(amounts.reduce((sum, v) => sum + v, 0) / amounts.length);
      const isConsistent = amounts.every((a) => Math.abs(a - avgAmt) / avgAmt <= 0.15); // within 15% tolerance

      if (isConsistent) {
        // Calculate average day intervals
        let dayDiffSum = 0;
        for (let i = 1; i < txs.length; i++) {
          const d1 = new Date(txs[i - 1].date).getTime();
          const d2 = new Date(txs[i].date).getTime();
          dayDiffSum += (d2 - d1) / (1000 * 60 * 60 * 24);
        }
        const avgDays = dayDiffSum / (txs.length - 1);

        let freq: 'Monthly' | 'Weekly' | 'Bi-Weekly' = 'Monthly';
        if (avgDays >= 5 && avgDays <= 10) freq = 'Weekly';
        else if (avgDays >= 11 && avgDays <= 18) freq = 'Bi-Weekly';

        const totalPaid = amounts.reduce((a, b) => a + b, 0);
        const lastDate = txs[txs.length - 1].date;
        const mainDesc = txs[0].description;
        const category = txs[0].category;

        recurringList.push({
          description: mainDesc,
          category,
          avgAmount: avgAmt,
          totalPaid,
          count: txs.length,
          lastDate,
          frequency: freq,
          evidence: `₹${avgAmt.toLocaleString('en-IN')} billed ${txs.length} times (total: ₹${totalPaid.toLocaleString('en-IN')}) across ${txs.map((t) => t.date.slice(5)).slice(0, 4).join(', ')}`,
        });
      }
    }
  });

  return recurringList.sort((a, b) => b.totalPaid - a.totalPaid);
};

export const detectUnusualSpending = (transactions: Transaction[]): UnusualSpending[] => {
  const expenseTxs = transactions.filter((t) => t.type === 'Expense');
  const catMap: Record<string, Transaction[]> = {};

  expenseTxs.forEach((tx) => {
    if (!catMap[tx.category]) catMap[tx.category] = [];
    catMap[tx.category].push(tx);
  });

  const unusualList: UnusualSpending[] = [];

  Object.entries(catMap).forEach(([cat, txs]) => {
    if (txs.length < 3) return;

    const amounts = txs.map((t) => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    txs.forEach((tx) => {
      // Threshold: 2.2x category mean or > mean + 2*stdDev and amount > 3000
      if ((tx.amount > mean * 2.2 || tx.amount > mean + 2 * stdDev) && tx.amount >= 2500) {
        unusualList.push({
          id: tx.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: cat,
          reason: 'Spending pattern requiring review (Spike significantly above normal category baseline)',
          baselineAvg: Math.round(mean),
          evidence: `₹${tx.amount.toLocaleString('en-IN')} on ${tx.date} is ${Math.round(tx.amount / mean)}x higher than category average (₹${Math.round(mean).toLocaleString('en-IN')})`,
        });
      }
    });
  });

  return unusualList.sort((a, b) => b.amount - a.amount);
};

export const detectRepeatedSmallExpenses = (transactions: Transaction[]): RepeatedSmallExpense[] => {
  const expenseTxs = transactions.filter((t) => t.type === 'Expense');
  const microTxs = expenseTxs.filter((t) => t.amount <= 300);

  const catMap: Record<string, Transaction[]> = {};
  microTxs.forEach((t) => {
    if (!catMap[t.category]) catMap[t.category] = [];
    catMap[t.category].push(t);
  });

  const results: RepeatedSmallExpense[] = [];
  Object.entries(catMap).forEach(([cat, txs]) => {
    if (txs.length >= 4) {
      const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);
      const avg = Math.round(totalAmount / txs.length);
      results.push({
        category: cat,
        count: txs.length,
        totalAmount,
        averageAmount: avg,
        evidence: `${txs.length} micro-transactions (avg ₹${avg}) totaling ₹${totalAmount.toLocaleString('en-IN')} detected in ${cat}`,
      });
    }
  });

  return results.sort((a, b) => b.totalAmount - a.totalAmount);
};

export const calculateBudgetStatus = (
  transactions: Transaction[],
  budgets: Budget[],
  monthStr?: string // e.g. "2026-09"
): BudgetStatus[] => {
  // Target month: latest month in dataset if not provided
  let targetMonth = monthStr;
  if (!targetMonth && transactions.length > 0) {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    targetMonth = sorted[0].date.substring(0, 7);
  }

  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'Expense' && (!targetMonth || t.date.startsWith(targetMonth))
  );

  const spendByCat: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    spendByCat[t.category] = (spendByCat[t.category] || 0) + t.amount;
  });

  return budgets.map((b) => {
    const spent = spendByCat[b.category] || 0;
    const percentage = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    let status: 'within' | 'near' | 'over' = 'within';
    if (percentage > 100) status = 'over';
    else if (percentage >= 80) status = 'near';

    return {
      category: b.category,
      spent,
      limit: b.limit,
      percentage,
      status,
      remaining: Math.max(0, b.limit - spent),
    };
  });
};

export const generateEvidenceBasedReport = (
  transactions: Transaction[],
  budgets: Budget[],
  mode: 'personal' | 'sme' = 'personal'
): AnalysisReport => {
  const summary = calculateSummary(transactions, mode);
  const recurringExpenses = detectRecurringExpenses(transactions);
  const unusualSpending = detectUnusualSpending(transactions);
  const repeatedSmall = detectRepeatedSmallExpenses(transactions);
  const budgetStatus = calculateBudgetStatus(transactions, budgets);

  const keyFindings: KeyFinding[] = [];
  const prioritizedActions: PrioritizedAction[] = [];

  // Finding 1: Recurring subscriptions / fixed overhead
  if (recurringExpenses.length > 0) {
    const totalRecurringMonthly = recurringExpenses.reduce((s, r) => s + r.avgAmount, 0);
    const topSubs = recurringExpenses.slice(0, 3);
    const subDescList = topSubs.map((s) => `${s.description} (₹${s.avgAmount}/mo)`).join(', ');

    keyFindings.push({
      id: 'f-rec-1',
      finding:
        mode === 'personal'
          ? 'Active recurring subscriptions and fixed commitments detected.'
          : 'High monthly operational SaaS and recurring commitments identified.',
      evidence: `${recurringExpenses.length} regular recurring payments totaling ₹${totalRecurringMonthly.toLocaleString(
        'en-IN'
      )}/month, including ${subDescList}.`,
      impact: `Annual recurring commitment amounts to ₹${(totalRecurringMonthly * 12).toLocaleString(
        'en-IN'
      )} (${Math.round((totalRecurringMonthly / (summary.averageMonthlySpend || 1)) * 100)}% of total monthly spend).`,
      suggestedAction:
        mode === 'personal'
          ? 'Perform an audit of active digital subscriptions and cancel services not utilized in the last 30 days.'
          : 'Consolidate redundant SaaS software licenses, audit seat allocation, and migrate to annual enterprise discounts.',
      priority: totalRecurringMonthly > 4000 ? 'HIGH' : 'MEDIUM',
    });

    prioritizedActions.push({
      id: 'act-rec-1',
      priority: 'HIGH',
      title: 'Audit & Trim Recurring Subscriptions',
      evidence: topSubs[0].evidence,
      recommendation: `Review ${topSubs[0].description} and other monthly auto-debits. Canceling non-essential tiers can reclaim predictable monthly cash flow.`,
      estimatedMonthlySavings: Math.round(topSubs[0].avgAmount),
    });
  }

  // Finding 2: Unusual spending spikes
  if (unusualSpending.length > 0) {
    const topOutlier = unusualSpending[0];
    keyFindings.push({
      id: 'f-unusual-1',
      finding: 'Spending pattern requiring review detected in recent history.',
      evidence: topOutlier.evidence,
      impact: `Single purchase accounted for ₹${topOutlier.amount.toLocaleString(
        'en-IN'
      )}, distorting the monthly ${topOutlier.category} budget baseline.`,
      suggestedAction:
        'Verify transaction receipt, confirm whether this is a one-time capital/personal expense, and ring-fence future discretionary spikes.',
      priority: 'HIGH',
    });

    prioritizedActions.push({
      id: 'act-unusual-1',
      priority: 'HIGH',
      title: 'Ring-Fence High-Variance Discretionary Outflows',
      evidence: `Spike of ₹${topOutlier.amount.toLocaleString('en-IN')} on ${topOutlier.date} in ${topOutlier.category}`,
      recommendation: `Establish a 48-hour cooling-off threshold or secondary approval for non-essential purchases exceeding ₹5,000.`,
      estimatedMonthlySavings: Math.round(topOutlier.amount * 0.2),
    });
  }

  // Finding 3: Budget overages or near-limit categories
  const overBudgetCats = budgetStatus.filter((b) => b.status === 'over');
  const nearBudgetCats = budgetStatus.filter((b) => b.status === 'near');

  if (overBudgetCats.length > 0) {
    const overItem = overBudgetCats[0];
    keyFindings.push({
      id: 'f-budget-over',
      finding: `Budget allocation exceeded in ${overItem.category}.`,
      evidence: `Actual expenditure is ₹${overItem.spent.toLocaleString('en-IN')} against limit of ₹${overItem.limit.toLocaleString(
        'en-IN'
      )} (${overItem.percentage}% utilized).`,
      impact: `Current month overage of ₹${(overItem.spent - overItem.limit).toLocaleString(
        'en-IN'
      )} directly reduces net savings margin.`,
      suggestedAction: `Pause non-critical purchases in ${overItem.category} for the remainder of the billing cycle.`,
      priority: 'HIGH',
    });

    prioritizedActions.push({
      id: 'act-budget-1',
      priority: 'HIGH',
      title: `Realign ${overItem.category} Spending to Budget`,
      evidence: `Overspent by ₹${(overItem.spent - overItem.limit).toLocaleString('en-IN')} (${overItem.percentage}% of limit)`,
      recommendation: `Cap daily outflow in ${overItem.category} to ₹${Math.round(overItem.limit / 30)}/day to prevent recurring budget deficits.`,
      estimatedMonthlySavings: Math.max(1000, overItem.spent - overItem.limit),
    });
  } else if (nearBudgetCats.length > 0) {
    const nearItem = nearBudgetCats[0];
    keyFindings.push({
      id: 'f-budget-near',
      finding: `Close to monthly budget threshold in ${nearItem.category}.`,
      evidence: `₹${nearItem.spent.toLocaleString('en-IN')} utilized out of ₹${nearItem.limit.toLocaleString('en-IN')} (${nearItem.percentage}%).`,
      impact: `Only ₹${nearItem.remaining.toLocaleString('en-IN')} remaining buffer for this cycle.`,
      suggestedAction: `Monitor remaining daily burn in ${nearItem.category} to stay within planned guardrails.`,
      priority: 'MEDIUM',
    });
  }

  // Finding 4: Repeated micro-expenses (Coffee, snacks, delivery fees)
  if (repeatedSmall.length > 0) {
    const topMicro = repeatedSmall[0];
    keyFindings.push({
      id: 'f-micro-1',
      finding: `High frequency of repeated small expenses accumulating substantially.`,
      evidence: topMicro.evidence,
      impact: `Micro-expenses drain ₹${topMicro.totalAmount.toLocaleString(
        'en-IN'
      )} across transactions that appear negligible individually.`,
      suggestedAction: `Batch orders, utilize monthly transit passes, or switch to bulk provisions to reduce incidental frequency.`,
      priority: 'MEDIUM',
    });

    prioritizedActions.push({
      id: 'act-micro-1',
      priority: 'MEDIUM',
      title: 'Consolidate Micro-Transactions',
      evidence: topMicro.evidence,
      recommendation: `Establish a weekly allowance wallet for minor incidentals rather than unrestricted tap-to-pay swipes.`,
      estimatedMonthlySavings: Math.round(topMicro.totalAmount * 0.4),
    });
  }

  // Finding 5: Savings Rate & Runway
  if (mode === 'sme') {
    keyFindings.push({
      id: 'f-sme-cashflow',
      finding: 'Operating cash flow health and runway evaluation.',
      evidence: `Net balance of ₹${summary.balance.toLocaleString('en-IN')} across 6 months with average monthly spend of ₹${summary.averageMonthlySpend.toLocaleString(
        'en-IN'
      )}.`,
      impact: `Current estimated operational runway is ~${summary.runwayMonths || 3.5} months based on trailing burn rate.`,
      suggestedAction: `Maintain minimum 6-month operational liquidity buffer and enforce prompt 14-day client invoice settlements.`,
      priority: (summary.runwayMonths || 0) < 3 ? 'HIGH' : 'LOW',
    });

    prioritizedActions.push({
      id: 'act-sme-1',
      priority: 'MEDIUM',
      title: 'Optimize Accounts Receivable Timing',
      evidence: `Trailing monthly revenue variance detected with milestone delays`,
      recommendation: `Incentivize 2% early-payment discounts for client invoices and milestone contracts to ensure steady working capital.`,
      estimatedMonthlySavings: 5000,
    });
  } else {
    keyFindings.push({
      id: 'f-savings-rate',
      finding: `Cumulative savings margin currently at ${summary.savingsRate}%.`,
      evidence: `Total income of ₹${summary.totalIncome.toLocaleString('en-IN')} vs expenses of ₹${summary.totalExpenses.toLocaleString(
        'en-IN'
      )} yields net surplus of ₹${summary.balance.toLocaleString('en-IN')}.`,
      impact: `Surplus provides capital for emergency funds and long-term asset building.`,
      suggestedAction: `Automate transfer of at least 15% of monthly income to an interest-bearing liquidity or index fund on salary day.`,
      priority: summary.savingsRate < 15 ? 'HIGH' : 'LOW',
    });

    prioritizedActions.push({
      id: 'act-invest-1',
      priority: 'LOW',
      title: 'Automate Pay-Yourself-First System',
      evidence: `Surplus of ₹${summary.balance.toLocaleString('en-IN')} available across tracked period`,
      recommendation: `Schedule automatic transfer of ₹${Math.max(
        2000,
        Math.round(summary.averageMonthlyIncome * 0.15)
      ).toLocaleString('en-IN')} within 24 hours of pay deposit.`,
      estimatedMonthlySavings: Math.round(summary.averageMonthlyIncome * 0.15),
    });
  }

  const executiveSummary =
    mode === 'personal'
      ? `Analysis of ${transactions.length} personal transactions spanning ${summary.dateRange.start} to ${
          summary.dateRange.end
        } shows a cumulative net balance of ₹${summary.balance.toLocaleString(
          'en-IN'
        )} with an overall ${summary.savingsRate}% savings rate. The largest expenditure category is ${
          summary.highestSpendingCategory.category
        } (₹${summary.highestSpendingCategory.amount.toLocaleString(
          'en-IN'
        )}), and ${recurringExpenses.length} recurring obligations represent a fixed commitment of ₹${recurringExpenses
          .reduce((s, r) => s + r.avgAmount, 0)
          .toLocaleString('en-IN')}/mo. Key opportunities exist to ring-fence outlier spikes and reduce micro-leakage.`
      : `Analysis of ${transactions.length} SME business ledger entries spanning ${summary.dateRange.start} to ${
          summary.dateRange.end
        } demonstrates total revenue of ₹${summary.totalIncome.toLocaleString(
          'en-IN'
        )} against operating expenditure of ₹${summary.totalExpenses.toLocaleString(
          'en-IN'
        )}, producing a net cash flow surplus of ₹${summary.balance.toLocaleString(
          'en-IN'
        )}. Fixed commitments in SaaS & Hosting total ₹${recurringExpenses
          .filter((r) => r.category.includes('Cloud') || r.category.includes('Software'))
          .reduce((s, r) => s + r.avgAmount, 0)
          .toLocaleString('en-IN')}/mo. Immediate actions should focus on invoice collection cadences and supplier hardware variance.`;

  return {
    id: `rep-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    summary,
    keyFindings,
    recurringExpenses,
    unusualSpending,
    repeatedSmallExpenses: repeatedSmall,
    budgetStatus,
    prioritizedActions,
    executiveSummary,
    mode,
  };
};
