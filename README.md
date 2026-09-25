# HTH077GA33
A modern web-based personal finance management application built with React, TypeScript, and Vite. The application helps users manage and analyze their finances through an interactive dashboard, transaction tracking, budgeting, financial reports, data visualization, and AI-powered financial assistance.
An AI-powered financial advisor that analyzes actual transaction history to identify spending patterns, recurring expenses, unusual spending, and budget violations — then uses Generative AI to transform those findings into personalized and actionable financial recommendations.

---

## 🚨 Problem Statement

Most personal finance applications and traditional financial advice provide generic recommendations such as:

> "Reduce unnecessary expenses and save more."

The problem is that this advice does not explain:

- Where the user is overspending
- How much they are overspending
- Which expenses are recurring
- What spending behavior has changed
- Which budget limits have been violated
- What specific action the user should take

For example, if a user spends ₹11,000 on food while their monthly food budget is ₹8,000, generic advice would simply suggest reducing expenses.

Our system provides evidence:

> *Food spending: ₹11,000*  
> *Food budget: ₹8,000*  
> *Overspending: ₹3,000*

The system then uses GenAI to convert this evidence into understandable and personalized recommendations.

---

# 💡 Our Solution

We are building an *Evidence-Based Personal & SME Finance Advisor* that combines financial data analysis with Generative AI.

The system analyzes actual transaction data and identifies meaningful financial patterns before generating recommendations.

### Core Pipeline

```text
Transaction Data
       ↓
Data Processing
       ↓
Financial Analysis
       ↓
Pattern Detection
       ↓
Evidence Generation
       ↓
Generative AI
       ↓
Personalized Financial Advice
       ↓
Prioritized Action Plan
