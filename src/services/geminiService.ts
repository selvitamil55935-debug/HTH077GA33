import { GoogleGenAI } from '@google/genai';
import { AnalysisReport, Budget, Transaction } from '../types';
import { generateEvidenceBasedReport } from '../utils/analysisEngine';

/**
 * Calls backend API or direct Gemini SDK to generate deep evidence-based financial insights.
 */
export async function runAIFinancialAnalysis(
  transactions: Transaction[],
  budgets: Budget[],
  mode: 'personal' | 'sme'
): Promise<AnalysisReport> {
  // First calculate baseline ground truth using deterministic analysis engine
  const baselineReport = generateEvidenceBasedReport(transactions, budgets, mode);

  try {
    // Attempt to invoke server endpoint /api/analyze
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions,
        budgets,
        mode,
        baseline: baselineReport,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.report) {
        return data.report;
      }
    }
  } catch (err) {
    console.warn('Backend /api/analyze not available, attempting direct client AI or fallback', err);
  }

  // Fallback: If client has GEMINI_API_KEY via env, run @google/genai
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior Evidence-Based Financial Advisor.
Analyze this structured financial dataset for a ${mode === 'sme' ? 'Small Business (SME)' : 'Personal Household'}.
CRITICAL REQUIREMENT:
- DO NOT provide generic advice like "save more money" or "cut unnecessary costs".
- Every finding, risk, and recommendation MUST cite concrete evidence from the transaction data (dates, amounts, counts, specific merchant names).
- Return a JSON object matching this schema:
{
  "executiveSummary": "string citing exact numbers and dates",
  "keyFindings": [
    {
      "id": "f-1",
      "finding": "Specific observation",
      "evidence": "Exact transactions, dates, and amounts",
      "impact": "Quantified financial outcome",
      "suggestedAction": "Concrete tactical step",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "prioritizedActions": [
    {
      "id": "act-1",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "title": "Clear action title",
      "evidence": "Evidence string",
      "recommendation": "Detailed recommendation citing data",
      "estimatedMonthlySavings": number
    }
  ]
}

DATASET SUMMARY:
Total Income: ₹${baselineReport.summary.totalIncome}
Total Expenses: ₹${baselineReport.summary.totalExpenses}
Net Balance: ₹${baselineReport.summary.balance}
Highest Spending Category: ${baselineReport.summary.highestSpendingCategory.category} (₹${baselineReport.summary.highestSpendingCategory.amount})
Detected Recurring Items:
${JSON.stringify(baselineReport.recurringExpenses.slice(0, 5), null, 2)}
Detected Unusual Outliers:
${JSON.stringify(baselineReport.unusualSpending.slice(0, 5), null, 2)}
Budget Overages / Status:
${JSON.stringify(baselineReport.budgetStatus, null, 2)}
Sample Transactions:
${JSON.stringify(transactions.slice(0, 20), null, 2)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.keyFindings && parsed.prioritizedActions) {
          return {
            ...baselineReport,
            executiveSummary: parsed.executiveSummary || baselineReport.executiveSummary,
            keyFindings: parsed.keyFindings,
            prioritizedActions: parsed.prioritizedActions,
          };
        }
      }
    } catch (clientErr) {
      console.warn('Client Gemini call fell back to deterministic evidence engine', clientErr);
    }
  }

  // Return baseline report with 100% evidence guarantee
  return baselineReport;
}

/**
 * AI Chart Explainer: Explains any chart or summary card instantly based on actual numbers
 */
export async function explainFinancialChart(
  chartType: 'income_vs_expense' | 'spending_by_category' | 'monthly_trend' | 'financial_health' | 'recurring_costs',
  chartData: any,
  mode: 'personal' | 'sme'
): Promise<{ title: string; explanation: string; keyTakeaways: string[] }> {
  try {
    const res = await fetch('/api/explain-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chartType, chartData, mode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.explanation) return data;
    }
  } catch (e) {
    // continue to client fallback
  }

  // Deterministic smart explanation based on actual values
  if (chartType === 'income_vs_expense') {
    const totalIn = chartData.totalIncome || 0;
    const totalOut = chartData.totalExpenses || 0;
    const net = totalIn - totalOut;
    const isSurplus = net >= 0;
    return {
      title: 'Income vs Expense Breakdown Analysis',
      explanation: `Over the selected period, you generated ₹${totalIn.toLocaleString('en-IN')} in total inflows against ₹${totalOut.toLocaleString('en-IN')} in total outflows, resulting in a ${isSurplus ? 'healthy net positive surplus' : 'net operational deficit'} of ₹${Math.abs(net).toLocaleString('en-IN')} (${totalIn > 0 ? Math.round((net / totalIn) * 100) : 0}% net margin).`,
      keyTakeaways: [
        `Cash Flow Status: ${isSurplus ? 'Positive surplus buffer available for savings and buffer' : 'Outflows exceed inflows; immediate spend capping required'}.`,
        `Outflow Efficiency: Expenses consumed ${totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0}% of all recorded incoming cash.`,
        mode === 'sme'
          ? 'Maintain receivables velocity to ensure payroll and supplier coverages.'
          : 'Channel surplus immediately into dedicated emergency reserves to prevent lifestyle creep.',
      ],
    };
  }

  if (chartType === 'spending_by_category') {
    const cats = Array.isArray(chartData) ? chartData : [];
    const topCat = cats[0] || { name: 'Essentials', value: 0 };
    const secondCat = cats[1] || { name: 'Secondary', value: 0 };
    return {
      title: 'Category Spending Distribution Analysis',
      explanation: `Your expenditures are primarily concentrated in "${topCat.name}" at ₹${(topCat.value || 0).toLocaleString('en-IN')}, followed by "${secondCat.name}" at ₹${(secondCat.value || 0).toLocaleString('en-IN')}. Together, these top two categories absorb the majority of your budget.`,
      keyTakeaways: [
        `Primary Drain: "${topCat.name}" is your highest single expenditure category.`,
        `Discretionary vs Fixed: Review whether "${topCat.name}" contains non-essential discretionary items or mandatory overhead.`,
        'Action: Benchmark this category against your target budget limits in the Budget tab.',
      ],
    };
  }

  if (chartType === 'monthly_trend') {
    return {
      title: 'Monthly Cash Flow Trajectory',
      explanation: `This trend tracks your month-over-month income and expense lines. Look for points of convergence or divergence between inflow and outflow peaks across the 6-month historical horizon.`,
      keyTakeaways: [
        'Consistency: Flat expense curves indicate disciplined fixed overhead.',
        'Spike Detection: Sudden month-over-month peaks usually correspond to discretionary purchases or annual insurance/licensing dues.',
        'Buffer Target: Aim for consistent gaps between the top income line and the bottom expense line.',
      ],
    };
  }

  return {
    title: 'Financial Health Score Interpretation',
    explanation: `Your Financial Health Score reflects a synthesis of four key dimensions: savings rate, budget discipline, recurring expense burden, and cash flow consistency.`,
    keyTakeaways: [
      'Score > 75: Excellent stability with strong buffer margins.',
      'Score 50-74: Moderate stability with opportunities to trim recurring overhead.',
      'Score < 50: High vulnerability to cash crunches or single outlier shocks.',
    ],
  };
}
