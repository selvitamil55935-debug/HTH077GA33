export type TransactionType = 'Income' | 'Expense';

export type PersonalCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Food & Dining'
  | 'Groceries'
  | 'Shopping'
  | 'Transport'
  | 'Utilities'
  | 'Rent & Housing'
  | 'Subscriptions'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Other';

export type SMECategory =
  | 'Client Invoices'
  | 'Product Sales'
  | 'Consulting Revenue'
  | 'Grants & Funding'
  | 'Payroll & Salaries'
  | 'Office Rent & Utilities'
  | 'Software & SaaS Tools'
  | 'Cloud & IT Hosting'
  | 'Supplier & Inventory'
  | 'Marketing & Ads'
  | 'Logistics & Shipping'
  | 'Legal & Professional'
  | 'Tax & Compliance'
  | 'Travel & Client Expense'
  | 'Other Business Expense';

export type Category = PersonalCategory | SMECategory | string;

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  notes?: string;
  isBusiness?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: Category;
  limit: number;
  period: 'monthly';
  isBusiness?: boolean;
}

export interface BudgetStatus {
  category: Category;
  spent: number;
  limit: number;
  percentage: number;
  status: 'within' | 'near' | 'over';
  remaining: number;
}

export interface RecurringExpense {
  description: string;
  category: Category;
  avgAmount: number;
  totalPaid: number;
  count: number;
  lastDate: string;
  frequency: 'Monthly' | 'Weekly' | 'Bi-Weekly';
  evidence: string;
}

export interface UnusualSpending {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  reason: string;
  baselineAvg: number;
  evidence: string;
}

export interface RepeatedSmallExpense {
  category: Category;
  count: number;
  totalAmount: number;
  averageAmount: number;
  evidence: string;
}

export interface KeyFinding {
  id: string;
  finding: string;
  evidence: string;
  impact: string;
  suggestedAction: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
}

export interface PrioritizedAction {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  evidence: string;
  recommendation: string;
  estimatedMonthlySavings: number;
  category?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number; // percentage
  averageMonthlyIncome: number;
  averageMonthlySpend: number;
  highestSpendingCategory: { category: string; amount: number; percentage: number };
  financialHealthScore: number; // 0 - 100
  runwayMonths?: number; // for SME
  netBurnRate?: number; // for SME
  transactionCount: number;
  dateRange: { start: string; end: string };
}

export interface AnalysisReport {
  id: string;
  generatedAt: string;
  summary: FinancialSummary;
  keyFindings: KeyFinding[];
  recurringExpenses: RecurringExpense[];
  unusualSpending: UnusualSpending[];
  repeatedSmallExpenses: RepeatedSmallExpense[];
  budgetStatus: BudgetStatus[];
  prioritizedActions: PrioritizedAction[];
  executiveSummary: string;
  mode: 'personal' | 'sme';
}

export interface User {
  userId: string;
  name: string;
  email: string;
  mode: 'personal' | 'sme';
  currency: string;
}

export type ToastType = 'success' | 'info' | 'ai' | 'warning' | 'error';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ExtractedReceiptItem {
  description: string;
  amount: number;
}

export interface ExtractedReceiptData {
  merchant: string;
  date: string;
  totalAmount: number;
  currency?: string;
  category?: string;
  taxAmount?: number;
  paymentMethod?: string;
  confidence?: 'High' | 'Medium' | 'Low' | string;
  summary?: string;
  lineItems?: ExtractedReceiptItem[];
}

export interface ScanReceiptResponse {
  success: boolean;
  extracted: ExtractedReceiptData;
  rawText?: string;
}

