import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisReport, Transaction } from '../types';

export interface ExportOptions {
  includeSummary?: boolean;
  includeFindings?: boolean;
  includeActions?: boolean;
  includeBudgets?: boolean;
  includeRecurring?: boolean;
  includeTransactions?: boolean;
  dateRangeFilter?: 'all' | '30' | '90' | '180';
  customFileName?: string;
}

/**
 * Filter transactions based on date range filter
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  filter: 'all' | '30' | '90' | '180' = 'all'
): Transaction[] {
  if (filter === 'all') return transactions;

  const now = new Date();
  const days = filter === '30' ? 30 : filter === '90' ? 90 : 180;
  const cutoffTime = now.getTime() - days * 24 * 60 * 60 * 1000;

  return transactions.filter((tx) => {
    const txTime = new Date(tx.date).getTime();
    return !isNaN(txTime) && txTime >= cutoffTime;
  });
}

/**
 * Export financial data and analyzed insights to Excel (.xlsx) with multiple structured sheets
 */
export function exportToExcel(
  report: AnalysisReport,
  transactions: Transaction[],
  currency: string = '₹',
  options: ExportOptions = {}
): string {
  const {
    includeSummary = true,
    includeFindings = true,
    includeActions = true,
    includeBudgets = true,
    includeRecurring = true,
    includeTransactions = true,
    dateRangeFilter = 'all',
  } = options;

  const filteredTransactions = filterTransactionsByDate(transactions, dateRangeFilter);
  const wb = XLSX.utils.book_new();
  const safeMode = report.mode === 'sme' ? 'SME Business' : 'Personal Household';

  // 1. Executive Summary & KPIs Sheet
  if (includeSummary) {
    const summaryRows: any[][] = [
      ['FINADVISOR - EVIDENCE-BASED FINANCIAL AUDIT'],
      ['Portfolio Mode', safeMode],
      ['Generated Date', new Date(report.generatedAt).toLocaleString()],
      ['Transactions Evaluated', report.summary.transactionCount],
      ['Audit Date Range', `${report.summary.dateRange.start} to ${report.summary.dateRange.end}`],
      ['Financial Health Score', `${report.summary.financialHealthScore} / 100`],
      [],
      ['CORE FINANCIAL METRICS', 'AMOUNT / VALUE'],
      ['Total Recorded Inflow (Income/Revenue)', report.summary.totalIncome],
      ['Total Recorded Outflows (Expenses)', report.summary.totalExpenses],
      ['Net Surplus / Cash Flow Balance', report.summary.balance],
      ['Average Monthly Inflow', report.summary.averageMonthlyIncome || 0],
      ['Average Monthly Outflow', report.summary.averageMonthlySpend || 0],
      [
        'Savings Rate / Retained %',
        `${report.summary.savingsRate}%`,
      ],
      [
        'Top Expense Category',
        `${report.summary.highestSpendingCategory.category} (${report.summary.highestSpendingCategory.percentage}%)`,
      ],
    ];

    if (report.mode === 'sme') {
      summaryRows.push(
        ['Estimated Operating Runway', `${report.summary.runwayMonths || 'N/A'} months`],
        ['Monthly Net Burn / Retained Rate', report.summary.netBurnRate || 0]
      );
    }

    summaryRows.push(
      [],
      ['EXECUTIVE SYNTHESIS'],
      [report.executiveSummary],
      [],
      ['AUDIT DISCLAIMER'],
      ['This record is generated for transaction tracking and educational record-keeping. Not a substitute for certified financial or tax advice.']
    );

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');
  }

  // 2. Key Findings & Evidence Sheet
  if (includeFindings && report.keyFindings && report.keyFindings.length > 0) {
    const findingsHeader = [
      'Finding ID',
      'Priority',
      'Core Finding Observation',
      'Strict Ledger Evidence (Dates, Merch, Amounts)',
      'Financial Impact Quantified',
      'Suggested Tactical Action',
    ];
    const findingsRows = report.keyFindings.map((f) => [
      f.id,
      f.priority,
      f.finding,
      f.evidence,
      f.impact,
      f.suggestedAction,
    ]);

    const wsFindings = XLSX.utils.aoa_to_sheet([findingsHeader, ...findingsRows]);
    wsFindings['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 35 },
      { wch: 45 },
      { wch: 35 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsFindings, 'Key Findings & Evidence');
  }

  // 3. Prioritized Action Plan Sheet
  if (includeActions && report.prioritizedActions && report.prioritizedActions.length > 0) {
    const actionsHeader = [
      'Action ID',
      'Priority Level',
      'Action Title',
      'Target Category',
      'Actionable Recommendation',
      'Underlying Transaction Evidence',
      'Est. Monthly Gains / Savings',
    ];
    const actionsRows = report.prioritizedActions.map((a) => [
      a.id,
      a.priority,
      a.title,
      a.category || 'General',
      a.recommendation,
      a.evidence,
      a.estimatedMonthlySavings,
    ]);

    const wsActions = XLSX.utils.aoa_to_sheet([actionsHeader, ...actionsRows]);
    wsActions['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
      { wch: 20 },
      { wch: 45 },
      { wch: 45 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsActions, 'Tactical Action Plan');
  }

  // 4. Budget Performance Sheet
  if (includeBudgets && report.budgetStatus && report.budgetStatus.length > 0) {
    const budgetHeader = [
      'Category',
      'Monthly Budget Limit',
      'Actual Current Spend',
      'Remaining Buffer',
      '% Utilized',
      'Health Status',
    ];
    const budgetRows = report.budgetStatus.map((b) => [
      b.category,
      b.limit,
      b.spent,
      b.remaining,
      `${b.percentage}%`,
      b.status.toUpperCase(),
    ]);

    const wsBudgets = XLSX.utils.aoa_to_sheet([budgetHeader, ...budgetRows]);
    wsBudgets['!cols'] = [
      { wch: 26 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budget Guardrails');
  }

  // 5. Recurring Subscriptions & Outliers Sheet
  if (includeRecurring) {
    const recurringHeader = [
      'Merchant / Description',
      'Category',
      'Payment Cadence',
      'Average Monthly Amount',
      'Total Historical Paid',
      'Payment Count',
      'Evidence Trail',
    ];
    const recurringRows = (report.recurringExpenses || []).map((r) => [
      r.description,
      r.category,
      r.frequency,
      r.avgAmount,
      r.totalPaid,
      r.count,
      r.evidence,
    ]);

    const wsRecurring = XLSX.utils.aoa_to_sheet([recurringHeader, ...recurringRows]);
    wsRecurring['!cols'] = [
      { wch: 26 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRecurring, 'Recurring Expenses');

    // Unusual Outliers Sheet
    if (report.unusualSpending && report.unusualSpending.length > 0) {
      const outliersHeader = [
        'Outlier ID',
        'Date',
        'Description',
        'Category',
        'Amount',
        'Detection Reason',
        'Ledger Evidence',
      ];
      const outlierRows = report.unusualSpending.map((u) => [
        u.id,
        u.date,
        u.description,
        u.category,
        u.amount,
        u.reason,
        u.evidence,
      ]);
      const wsOutliers = XLSX.utils.aoa_to_sheet([outliersHeader, ...outlierRows]);
      wsOutliers['!cols'] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 },
        { wch: 30 },
        { wch: 45 },
      ];
      XLSX.utils.book_append_sheet(wb, wsOutliers, 'Unusual Outliers');
    }
  }

  // 6. Full Transaction Ledger Sheet
  if (includeTransactions && filteredTransactions.length > 0) {
    const txHeader = [
      'Transaction ID',
      'Date (YYYY-MM-DD)',
      'Description / Merchant',
      'Category',
      'Flow Type',
      'Amount',
      'Notes / Details',
    ];
    const txRows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.description,
      tx.category,
      tx.type,
      tx.amount,
      tx.notes || '',
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
    wsTx['!cols'] = [
      { wch: 16 },
      { wch: 16 },
      { wch: 32 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 36 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transaction Ledger');
  }

  // Generate filename and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultName = `FinAdvisor_${report.mode.toUpperCase()}_Audit_${dateStr}.xlsx`;
  const fileName = options.customFileName || defaultName;

  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Export comprehensive financial analysis report and transaction evidence to PDF
 */
export function exportToPdf(
  report: AnalysisReport,
  transactions: Transaction[],
  currency: string = '₹',
  options: ExportOptions = {}
): string {
  const {
    includeSummary = true,
    includeFindings = true,
    includeActions = true,
    includeBudgets = true,
    includeRecurring = true,
    includeTransactions = true,
    dateRangeFilter = 'all',
  } = options;

  const filteredTransactions = filterTransactionsByDate(transactions, dateRangeFilter);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const safeMode = report.mode === 'sme' ? 'SME Business Portfolio' : 'Personal Household Portfolio';

  // Helper for footer
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    const footerText =
      'FinAdvisor Record-Keeping Audit • Transaction-Grounded Educational Insights • Not Certified Financial Advice';
    doc.text(footerText, margin, pageHeight - 20);
    const pageNumStr = `Page ${pageNumber} of ${totalPages}`;
    doc.text(pageNumStr, pageWidth - margin - doc.getTextWidth(pageNumStr), pageHeight - 20);
  };

  let currentY = margin;

  // 1. Document Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, contentWidth, 54, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FINADVISOR FINANCIAL AUDIT & RECORD-KEEPING', margin + 14, currentY + 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  const dateFormatted = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(
    `Scope: ${safeMode} • Date: ${dateFormatted} • Ledger Count: ${report.summary.transactionCount} entries`,
    margin + 14,
    currentY + 42
  );

  currentY += 68;

  // 2. Financial Health Score & Executive Summary Card
  if (includeSummary) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, currentY, contentWidth, 75, 6, 6, 'FD');

    // Score badge
    doc.setFillColor(37, 99, 235); // blue-600
    doc.roundedRect(margin + 12, currentY + 12, 105, 50, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.summary.financialHealthScore}/100`, margin + 24, currentY + 36);
    doc.setFontSize(7.5);
    doc.text('HEALTH INDEX', margin + 24, currentY + 50);

    // Executive summary text
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EXECUTIVE SYNTHESIS:', margin + 128, currentY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitSummary = doc.splitTextToSize(report.executiveSummary, contentWidth - 140);
    doc.text(splitSummary.slice(0, 3), margin + 128, currentY + 36);

    currentY += 88;

    // KPI Summary Table
    const kpiData = [
      [
        'Total Inflow',
        `${currency}${report.summary.totalIncome.toLocaleString('en-IN')}`,
        'Total Outflow',
        `${currency}${report.summary.totalExpenses.toLocaleString('en-IN')}`,
      ],
      [
        'Net Surplus / Balance',
        `${currency}${report.summary.balance.toLocaleString('en-IN')}`,
        report.mode === 'sme' ? 'Runway Reserve' : 'Savings Rate',
        report.mode === 'sme'
          ? `${report.summary.runwayMonths || 'N/A'} Months`
          : `${report.summary.savingsRate}%`,
      ],
      [
        'Avg Monthly Inflow',
        `${currency}${(report.summary.averageMonthlyIncome || 0).toLocaleString('en-IN')}`,
        'Top Expense Category',
        `${report.summary.highestSpendingCategory.category} (${report.summary.highestSpendingCategory.percentage}%)`,
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value', 'Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 120 },
        1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 135 },
        2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 120 },
        3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 140 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // 3. Key Findings & Transaction Evidence Table
  if (includeFindings && report.keyFindings && report.keyFindings.length > 0) {
    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. KEY FINDINGS & STRICT TRANSACTION EVIDENCE', margin, currentY);
    currentY += 6;

    const findingsRows = report.keyFindings.map((f) => [
      f.priority,
      f.finding,
      f.evidence,
      f.impact,
      f.suggestedAction,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Priority', 'Core Observation', 'Ledger Evidence Trail', 'Impact', 'Tactical Action']],
      body: findingsRows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 110, fontStyle: 'bold' },
        2: { cellWidth: 155 },
        3: { cellWidth: 95 },
        4: { cellWidth: 105 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'HIGH') {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (data.cell.raw === 'MEDIUM') {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [37, 99, 235];
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // 4. Prioritized Tactical Action Plan Table
  if (includeActions && report.prioritizedActions && report.prioritizedActions.length > 0) {
    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. PRIORITIZED TACTICAL ACTION PLAN', margin, currentY);
    currentY += 6;

    const actionRows = report.prioritizedActions.map((a) => [
      a.priority,
      a.title,
      a.recommendation,
      a.evidence,
      a.estimatedMonthlySavings > 0
        ? `+${currency}${a.estimatedMonthlySavings.toLocaleString('en-IN')}/mo`
        : 'Optimized',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Priority', 'Action Title', 'Recommendation Details', 'Evidence Citation', 'Est. Monthly Impact']],
      body: actionRows,
      theme: 'striped',
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 115, fontStyle: 'bold' },
        2: { cellWidth: 160 },
        3: { cellWidth: 110 },
        4: { cellWidth: 80, fontStyle: 'bold', halign: 'right' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // 5. Budget Guardrails Performance Table
  if (includeBudgets && report.budgetStatus && report.budgetStatus.length > 0) {
    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. BUDGET GUARDRAILS STATUS', margin, currentY);
    currentY += 6;

    const budgetRows = report.budgetStatus.map((b) => [
      b.category,
      `${currency}${b.limit.toLocaleString('en-IN')}`,
      `${currency}${b.spent.toLocaleString('en-IN')}`,
      `${currency}${b.remaining.toLocaleString('en-IN')}`,
      `${b.percentage}%`,
      b.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Category', 'Monthly Limit', 'Current Spend', 'Buffer Remaining', 'Utilization', 'Status']],
      body: budgetRows,
      theme: 'striped',
      headStyles: {
        fillColor: [124, 58, 237], // violet-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'right' },
        2: { cellWidth: 80, halign: 'right' },
        3: { cellWidth: 85, halign: 'right' },
        4: { cellWidth: 70, halign: 'center' },
        5: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // 6. Recurring Commitments & Subscriptions Table
  if (includeRecurring && report.recurringExpenses && report.recurringExpenses.length > 0) {
    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. RECURRING SUBSCRIPTIONS & FIXED EXPENSES', margin, currentY);
    currentY += 6;

    const recurringRows = report.recurringExpenses.map((r) => [
      r.description,
      r.category,
      r.frequency,
      `${currency}${r.avgAmount.toLocaleString('en-IN')}`,
      `${currency}${r.totalPaid.toLocaleString('en-IN')}`,
      r.evidence,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Merchant / Service', 'Category', 'Cadence', 'Avg Monthly', 'Total Paid', 'Evidence Trail']],
      body: recurringRows,
      theme: 'striped',
      headStyles: {
        fillColor: [13, 148, 136], // teal-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        1: { cellWidth: 85 },
        2: { cellWidth: 60, halign: 'center' },
        3: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 75, halign: 'right' },
        5: { cellWidth: 110 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // 7. Recent Transactions Ledger Appendix
  if (includeTransactions && filteredTransactions.length > 0) {
    if (currentY > pageHeight - 140) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `5. ANALYZED TRANSACTIONS LEDGER (${filteredTransactions.length} records)`,
      margin,
      currentY
    );
    currentY += 6;

    // Show up to 40 transactions in PDF appendix
    const sampleTx = filteredTransactions.slice(0, 40);
    const txRows = sampleTx.map((tx) => [
      tx.date,
      tx.description,
      tx.category,
      tx.type,
      `${tx.type === 'Income' ? '+' : '-'}${currency}${tx.amount.toLocaleString('en-IN')}`,
      tx.notes || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Date', 'Description / Merchant', 'Category', 'Type', 'Amount', 'Notes']],
      body: txRows,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 140, fontStyle: 'bold' },
        2: { cellWidth: 95 },
        3: { cellWidth: 55, halign: 'center' },
        4: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 95 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    if (filteredTransactions.length > 40) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `* Note: Displaying top 40 of ${filteredTransactions.length} transactions. For complete records, download the accompanying Excel workbook (.xlsx).`,
        margin,
        currentY
      );
    }
  }

  // Add footers with total page numbers
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const defaultName = `FinAdvisor_${report.mode.toUpperCase()}_Audit_Report_${dateStr}.pdf`;
  const fileName = options.customFileName || defaultName;

  doc.save(fileName);
  return fileName;
}
