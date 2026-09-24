import { GoogleGenAI } from '@google/genai';
import { IncomingMessage, ServerResponse } from 'http';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// In-memory backend storage for demonstration
let storedTransactions: any[] = [];
let storedBudgets: any[] = [];
let latestReport: any = null;

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return false;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  try {
    // 1. POST /api/analyze
    if (url === '/api/analyze' && req.method === 'POST') {
      const { transactions, budgets, mode, baseline } = await parseJsonBody(req);
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && baseline) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are a Senior Evidence-Based Financial Advisor for ${
            mode === 'sme' ? 'Small Businesses (SME)' : 'Personal Household'
          }.
Analyze this dataset.
REQUIREMENT:
- NO generic advice like "save more" or "spend less".
- Every finding, risk, and action MUST cite exact transaction details (dates, merchant names, amounts, counts).
- Return valid JSON matching:
{
  "executiveSummary": "Concise summary citing total figures",
  "keyFindings": [
    {
      "id": "f-ai-1",
      "finding": "Specific observation",
      "evidence": "Evidence string with dates and amounts",
      "impact": "Financial impact quantified",
      "suggestedAction": "Concrete tactical action",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "prioritizedActions": [
    {
      "id": "act-ai-1",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "title": "Action title",
      "evidence": "Transaction evidence",
      "recommendation": "Step-by-step recommendation",
      "estimatedMonthlySavings": number
    }
  ]
}

DATASET SUMMARY:
Total Inflow: ₹${baseline.summary?.totalIncome}
Total Outflow: ₹${baseline.summary?.totalExpenses}
Net Balance: ₹${baseline.summary?.balance}
Highest Spend Category: ${baseline.summary?.highestSpendingCategory?.category} (₹${baseline.summary?.highestSpendingCategory?.amount})
Recurring Items:
${JSON.stringify((baseline.recurringExpenses || []).slice(0, 5))}
Unusual Outliers:
${JSON.stringify((baseline.unusualSpending || []).slice(0, 5))}
Budget Status:
${JSON.stringify(baseline.budgetStatus || [])}
`;

          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const responseText = result.text?.trim();
          if (responseText) {
            const parsed = JSON.parse(responseText);
            const mergedReport = {
              ...baseline,
              executiveSummary: parsed.executiveSummary || baseline.executiveSummary,
              keyFindings: parsed.keyFindings || baseline.keyFindings,
              prioritizedActions: parsed.prioritizedActions || baseline.prioritizedActions,
            };
            latestReport = mergedReport;
            sendJson(res, 200, { success: true, report: mergedReport });
            return true;
          }
        } catch (geminiError: any) {
          console.warn('Gemini API call failed, using baseline evidence report:', geminiError?.message);
        }
      }

      latestReport = baseline;
      sendJson(res, 200, { success: true, report: baseline });
      return true;
    }

    // 2. POST /api/explain-chart
    if (url === '/api/explain-chart' && req.method === 'POST') {
      const { chartType, chartData, mode } = await parseJsonBody(req);
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are an AI Financial Copilot. Provide an instant, crisp 2-sentence explanation of this chart for a ${mode} user, plus 3 bullet takeaways.
Chart type: ${chartType}
Chart data: ${JSON.stringify(chartData)}
Format response as JSON:
{
  "title": "string",
  "explanation": "string",
  "keyTakeaways": ["string", "string", "string"]
}`;

          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });

          const text = result.text?.trim();
          if (text) {
            sendJson(res, 200, JSON.parse(text));
            return true;
          }
        } catch (e) {
          // Fall through to default explanation
        }
      }

      sendJson(res, 200, {
        title: 'Analytical Chart Interpretation',
        explanation: 'This chart illustrates the historical distribution and velocity of your transactions across monitored categories.',
        keyTakeaways: [
          'Monitor highest category peaks to avoid unexpected cash crunches.',
          'Compare actual outflow lines against established budget benchmarks.',
          'Automate savings allocations immediately upon receiving inflows.',
        ],
      });
      return true;
    }

    // 3. GET /api/report
    if (url === '/api/report' && req.method === 'GET') {
      sendJson(res, 200, { report: latestReport });
      return true;
    }

    // 4. POST /api/what-if
    if (url === '/api/what-if' && req.method === 'POST') {
      const { currentSpend, newSpend } = await parseJsonBody(req);
      const diffMonthly = Math.round((currentSpend || 0) - (newSpend || 0));
      const diffYearly = diffMonthly * 12;
      sendJson(res, 200, {
        differenceMonthly: diffMonthly,
        differenceYearly: diffYearly,
        disclaimer: 'Estimates based on historical assumptions; not guaranteed financial outcomes.',
      });
      return true;
    }

    // 5. GET & POST /api/transactions
    if (url === '/api/transactions') {
      if (req.method === 'GET') {
        sendJson(res, 200, { transactions: storedTransactions });
        return true;
      }
      if (req.method === 'POST') {
        const tx = await parseJsonBody(req);
        if (!tx.description || !tx.amount) {
          sendJson(res, 400, { error: 'Description and positive amount are required.' });
          return true;
        }
        storedTransactions.unshift(tx);
        sendJson(res, 201, { success: true, transaction: tx });
        return true;
      }
    }

    // 6. GET & POST /api/budget
    if (url === '/api/budget') {
      if (req.method === 'GET') {
        sendJson(res, 200, { budgets: storedBudgets });
        return true;
      }
      if (req.method === 'POST') {
        const b = await parseJsonBody(req);
        storedBudgets.push(b);
        sendJson(res, 201, { success: true, budget: b });
        return true;
      }
    }

    // Default 404 for unknown api routes
    sendJson(res, 404, { error: 'API endpoint not found' });
    return true;
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    return true;
  }
}
