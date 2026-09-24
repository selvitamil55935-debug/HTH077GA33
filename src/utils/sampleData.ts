import { Budget, Transaction } from '../types';

export const PERSONAL_BUDGETS: Budget[] = [
  { id: 'b1', userId: 'demo_user', category: 'Food & Dining', limit: 8000, period: 'monthly', isBusiness: false },
  { id: 'b2', userId: 'demo_user', category: 'Groceries', limit: 12000, period: 'monthly', isBusiness: false },
  { id: 'b3', userId: 'demo_user', category: 'Shopping', limit: 6000, period: 'monthly', isBusiness: false },
  { id: 'b4', userId: 'demo_user', category: 'Transport', limit: 4500, period: 'monthly', isBusiness: false },
  { id: 'b5', userId: 'demo_user', category: 'Subscriptions', limit: 2500, period: 'monthly', isBusiness: false },
  { id: 'b6', userId: 'demo_user', category: 'Utilities', limit: 3500, period: 'monthly', isBusiness: false },
  { id: 'b7', userId: 'demo_user', category: 'Rent & Housing', limit: 20000, period: 'monthly', isBusiness: false },
  { id: 'b8', userId: 'demo_user', category: 'Entertainment', limit: 4000, period: 'monthly', isBusiness: false },
];

export const SME_BUDGETS: Budget[] = [
  { id: 'sb1', userId: 'demo_sme', category: 'Payroll & Salaries', limit: 120000, period: 'monthly', isBusiness: true },
  { id: 'sb2', userId: 'demo_sme', category: 'Office Rent & Utilities', limit: 35000, period: 'monthly', isBusiness: true },
  { id: 'sb3', userId: 'demo_sme', category: 'Cloud & IT Hosting', limit: 8000, period: 'monthly', isBusiness: true },
  { id: 'sb4', userId: 'demo_sme', category: 'Software & SaaS Tools', limit: 6000, period: 'monthly', isBusiness: true },
  { id: 'sb5', userId: 'demo_sme', category: 'Supplier & Inventory', limit: 30000, period: 'monthly', isBusiness: true },
  { id: 'sb6', userId: 'demo_sme', category: 'Marketing & Ads', limit: 18000, period: 'monthly', isBusiness: true },
  { id: 'sb7', userId: 'demo_sme', category: 'Logistics & Shipping', limit: 6000, period: 'monthly', isBusiness: true },
];

export const generatePersonalTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  let idCounter = 1;

  // Generate 6 months of data: April 2026 to September 2026
  const months = [
    { year: 2026, month: 4, name: '04' },
    { year: 2026, month: 5, name: '05' },
    { year: 2026, month: 6, name: '06' },
    { year: 2026, month: 7, name: '07' },
    { year: 2026, month: 8, name: '08' },
    { year: 2026, month: 9, name: '09' },
  ];

  months.forEach((m, idx) => {
    const y = m.year;
    const mo = m.name;

    // 1. Regular Monthly Salary
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-01`,
      description: 'Monthly Corporate Salary',
      amount: 68000,
      type: 'Income',
      category: 'Salary',
      notes: 'Direct bank deposit',
      isBusiness: false,
    });

    // Freelance bonus in June and August
    if (idx === 2 || idx === 4) {
      transactions.push({
        id: `pt-${idCounter++}`,
        userId: 'demo_user',
        date: `${y}-${mo}-18`,
        description: 'Design Consulting Gig',
        amount: 18500,
        type: 'Income',
        category: 'Freelance',
        notes: 'UI/UX sprint retainer',
        isBusiness: false,
      });
    }

    // 2. Fixed Housing Rent
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-02`,
      description: 'Apartment Monthly Rent',
      amount: 18000,
      type: 'Expense',
      category: 'Rent & Housing',
      notes: 'NEFT transfer to landlord',
      isBusiness: false,
    });

    // 3. Subscriptions (Consistent recurring evidence)
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-03`,
      description: 'Netflix Premium Subscription',
      amount: 649,
      type: 'Expense',
      category: 'Subscriptions',
      notes: 'Auto-debit recurring 4K Plan',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-05`,
      description: 'Spotify Family Plan',
      amount: 199,
      type: 'Expense',
      category: 'Subscriptions',
      notes: 'Music streaming auto-debit',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-07`,
      description: 'Cult.Fit Gym Membership',
      amount: 1499,
      type: 'Expense',
      category: 'Subscriptions',
      notes: 'Fitness center recurring plan',
      isBusiness: false,
    });

    // 4. Utilities
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-08`,
      description: 'State Electricity Board',
      amount: 1850 + (idx * 90),
      type: 'Expense',
      category: 'Utilities',
      notes: 'Power bill payment',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-11`,
      description: 'Broadband Fiber Internet',
      amount: 999,
      type: 'Expense',
      category: 'Utilities',
      notes: '300 Mbps unlimited plan',
      isBusiness: false,
    });

    // 5. Groceries
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-04`,
      description: 'Nature Supermarket Weekly Groceries',
      amount: 2850,
      type: 'Expense',
      category: 'Groceries',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-15`,
      description: 'Nature Supermarket Bi-Weekly Stock',
      amount: 3200,
      type: 'Expense',
      category: 'Groceries',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-24`,
      description: 'Fresh Fruits & Vegetables Depot',
      amount: 2150,
      type: 'Expense',
      category: 'Groceries',
      isBusiness: false,
    });

    // 6. Food & Dining
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-09`,
      description: 'Swiggy Weekend Dinner Order',
      amount: 880,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-19`,
      description: 'Artisan Bistro Dinner with Friends',
      amount: 1950,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });

    // 7. Transport
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-12`,
      description: 'Metro Smart Card Recharge',
      amount: 800,
      type: 'Expense',
      category: 'Transport',
      isBusiness: false,
    });

    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-21`,
      description: 'Fuel Station Petrol Refill',
      amount: 2400,
      type: 'Expense',
      category: 'Transport',
      isBusiness: false,
    });

    // 8. Repeated small expenses (Coffee, Quick snacks: micro transactions)
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-06`,
      description: 'Blue Tokai Morning Cappuccino',
      amount: 190,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-13`,
      description: 'Blue Tokai Morning Cappuccino',
      amount: 190,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-20`,
      description: 'Blue Tokai Morning Cappuccino',
      amount: 190,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });
    transactions.push({
      id: `pt-${idCounter++}`,
      userId: 'demo_user',
      date: `${y}-${mo}-27`,
      description: 'Blue Tokai Morning Cappuccino',
      amount: 190,
      type: 'Expense',
      category: 'Food & Dining',
      isBusiness: false,
    });

    // 9. Shopping
    if (idx === 4) {
      // Unusual Spending Anomaly in August: A large ₹19,800 tech gadget purchase!
      transactions.push({
        id: `pt-${idCounter++}`,
        userId: 'demo_user',
        date: `2026-08-16`,
        description: 'Apple Store Flagship - Noise Cancelling Headphones',
        amount: 19800,
        type: 'Expense',
        category: 'Shopping',
        notes: 'Unusual discretionary spending outlier',
        isBusiness: false,
      });
    } else {
      transactions.push({
        id: `pt-${idCounter++}`,
        userId: 'demo_user',
        date: `${y}-${mo}-16`,
        description: 'Amazon Retail Order - Apparel & Essentials',
        amount: 2800 + (idx % 2 === 0 ? 1100 : 400),
        type: 'Expense',
        category: 'Shopping',
        isBusiness: false,
      });
    }

    // Budget overage in Food & Dining in September (Current month)
    if (idx === 5) {
      transactions.push({
        id: `pt-${idCounter++}`,
        userId: 'demo_user',
        date: `2026-09-14`,
        description: 'Celebration Family Feast - Grand Hyatt',
        amount: 5400,
        type: 'Expense',
        category: 'Food & Dining',
        notes: 'Birthday dinner banquet',
        isBusiness: false,
      });
    }
  });

  return transactions;
};

export const generateSMETransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  let idCounter = 1;

  const months = [
    { year: 2026, month: 4, name: '04' },
    { year: 2026, month: 5, name: '05' },
    { year: 2026, month: 6, name: '06' },
    { year: 2026, month: 7, name: '07' },
    { year: 2026, month: 8, name: '08' },
    { year: 2026, month: 9, name: '09' },
  ];

  months.forEach((m, idx) => {
    const y = m.year;
    const mo = m.name;

    // 1. Core Client Invoices
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-02`,
      description: 'Apex Retail Tech - Monthly Retainer',
      amount: 145000,
      type: 'Income',
      category: 'Client Invoices',
      notes: 'Contract #INV-2026-089',
      isBusiness: true,
    });

    // Secondary client invoice (Irregular pattern: missing in June!)
    if (idx !== 2) {
      transactions.push({
        id: `st-${idCounter++}`,
        userId: 'demo_sme',
        date: `${y}-${mo}-15`,
        description: 'Horizon Logistics - Milestone Payout',
        amount: 72000,
        type: 'Income',
        category: 'Client Invoices',
        notes: 'Milestone 2 API integration',
        isBusiness: true,
      });
    } else {
      // In June: irregular delay notice
      transactions.push({
        id: `st-${idCounter++}`,
        userId: 'demo_sme',
        date: `${y}-${mo}-29`,
        description: 'Horizon Logistics - Delayed Partial Payment',
        amount: 25000,
        type: 'Income',
        category: 'Client Invoices',
        notes: 'Partial payment received due to client audit delay',
        isBusiness: true,
      });
    }

    // 2. Product Sales / Consulting
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-22`,
      description: 'B2B Software License Add-ons',
      amount: 38000 + (idx * 2500),
      type: 'Income',
      category: 'Product Sales',
      isBusiness: true,
    });

    // 3. Payroll (Core operational expense)
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-28`,
      description: 'Engineering & Ops Staff Payroll Batch',
      amount: 114000,
      type: 'Expense',
      category: 'Payroll & Salaries',
      notes: '7 team members salary disbursement',
      isBusiness: true,
    });

    // 4. Commercial Lease
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-03`,
      description: 'WeWork Office Space Lease (Floor 3)',
      amount: 32000,
      type: 'Expense',
      category: 'Office Rent & Utilities',
      notes: 'Monthly co-working lease & power',
      isBusiness: true,
    });

    // 5. Cloud Hosting (AWS) - Recurring cost
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-04`,
      description: 'Amazon Web Services Cloud Infrastructure',
      amount: 6200,
      type: 'Expense',
      category: 'Cloud & IT Hosting',
      notes: 'ECS, RDS database & S3 storage',
      isBusiness: true,
    });

    // 6. SaaS Tools (Slack, Workspace, GitHub) - Recurring
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-06`,
      description: 'Google Workspace & Slack Enterprise Bundle',
      amount: 4400,
      type: 'Expense',
      category: 'Software & SaaS Tools',
      notes: 'Per-seat communication license',
      isBusiness: true,
    });

    // 7. Supplier & Inventory
    if (idx === 3) {
      // Unusual spending spike in July: ₹54,000 for unexpected server hardware replacement
      transactions.push({
        id: `st-${idCounter++}`,
        userId: 'demo_sme',
        date: `2026-07-17`,
        description: 'Vanguard Hardware - Emergency Edge Server Cluster',
        amount: 54000,
        type: 'Expense',
        category: 'Supplier & Inventory',
        notes: 'Unplanned replacement for burnt backup nodes',
        isBusiness: true,
      });
    } else {
      transactions.push({
        id: `st-${idCounter++}`,
        userId: 'demo_sme',
        date: `${y}-${mo}-12`,
        description: 'TechSupply Distribution - Inventory Components',
        amount: 24000 + (idx % 2 === 0 ? 3000 : 0),
        type: 'Expense',
        category: 'Supplier & Inventory',
        isBusiness: true,
      });
    }

    // 8. Marketing & Ads
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-19`,
      description: 'Google & LinkedIn Paid Growth Ads',
      amount: 14500,
      type: 'Expense',
      category: 'Marketing & Ads',
      notes: 'Customer acquisition campaigns',
      isBusiness: true,
    });

    // 9. Logistics & Couriers
    transactions.push({
      id: `st-${idCounter++}`,
      userId: 'demo_sme',
      date: `${y}-${mo}-24`,
      description: 'BlueDart Express Client Sample Shipments',
      amount: 3800,
      type: 'Expense',
      category: 'Logistics & Shipping',
      isBusiness: true,
    });
  });

  return transactions;
};
