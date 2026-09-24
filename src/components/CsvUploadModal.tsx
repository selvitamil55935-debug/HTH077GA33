import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  notes?: string;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose }) => {
  const { addTransactionsBatch, currency, mode } = useFinance();
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadSampleCsv = () => {
    const csvContent =
      mode === 'personal'
        ? `Date,Description,Amount,Type,Category,Notes
2026-09-01,Salary,30000,Income,Salary,Monthly direct credit
2026-09-02,Grocery Store,2500,Expense,Food & Dining,Weekly supermarket
2026-09-03,Netflix,649,Expense,Subscriptions,Auto-debit 4K
2026-09-05,Electricity Bill,1800,Expense,Utilities,State power board
2026-09-08,Shopping,4500,Expense,Shopping,Weekend mall retail`
        : `Date,Description,Amount,Type,Category,Notes
2026-09-01,Apex Retail Tech,145000,Income,Client Invoices,Monthly retainer
2026-09-03,Office Space Lease,32000,Expense,Office Rent & Utilities,Co-working floor
2026-09-04,AWS Cloud Infrastructure,6200,Expense,Cloud & IT Hosting,Servers & DB
2026-09-06,Google Workspace & Slack,4400,Expense,Software & SaaS Tools,Team software
2026-09-28,Staff Payroll Batch,114000,Expense,Payroll & Salaries,Engineering salaries`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finadvisor_${mode}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setError('');
    setSuccessMsg('');
    setParsedRows([]);
    setFileName(file.name);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a valid .csv file format.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        setError('The uploaded CSV file is empty.');
        return;
      }

      try {
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setError('CSV must contain a header row and at least one transaction row.');
          return;
        }

        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

        // Identify column indices
        const dateIdx = headers.findIndex((h) => h.includes('date'));
        const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('merchant') || h.includes('narration') || h.includes('title'));
        const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('cost') || h.includes('price') || h.includes('value'));
        const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('credit/debit') || h.includes('flow'));
        const catIdx = headers.findIndex((h) => h.includes('cat'));
        const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('remark'));

        if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
          setError('Could not locate required columns. Ensure headers include Date, Description, and Amount.');
          return;
        }

        const validRows: ParsedRow[] = [];
        const parsingErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          if (!rawLine) continue;

          // Simple comma splitter handling basic quotes
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let c = 0; c < rawLine.length; c++) {
            const char = rawLine[c];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cols.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current.trim());

          const rowDate = cols[dateIdx]?.replace(/^["']|["']$/g, '') || '';
          const rowDesc = cols[descIdx]?.replace(/^["']|["']$/g, '') || '';
          const rawAmount = cols[amountIdx]?.replace(/[^0-9.-]/g, '') || '';
          const numAmount = parseFloat(rawAmount);

          if (!rowDate || !rowDesc) {
            parsingErrors.push(`Row ${i + 1}: Missing date or description.`);
            continue;
          }

          if (isNaN(numAmount) || numAmount <= 0) {
            parsingErrors.push(`Row ${i + 1}: Amount "${cols[amountIdx]}" is invalid or non-positive.`);
            continue;
          }

          // Determine type
          let rowType: TransactionType = 'Expense';
          if (typeIdx !== -1 && cols[typeIdx]) {
            const tVal = cols[typeIdx].toLowerCase();
            if (tVal.includes('in') || tVal.includes('cr') || tVal.includes('deposit')) {
              rowType = 'Income';
            }
          } else {
            // Heuristic by description
            if (rowDesc.toLowerCase().includes('salary') || rowDesc.toLowerCase().includes('invoice') || rowDesc.toLowerCase().includes('revenue')) {
              rowType = 'Income';
            }
          }

          const rowCat = (catIdx !== -1 && cols[catIdx]?.replace(/^["']|["']$/g, '')) || (rowType === 'Income' ? 'Income' : 'Other');
          const rowNotes = notesIdx !== -1 ? cols[notesIdx]?.replace(/^["']|["']$/g, '') : undefined;

          validRows.push({
            date: rowDate,
            description: rowDesc,
            amount: numAmount,
            type: rowType,
            category: rowCat,
            notes: rowNotes,
          });
        }

        if (validRows.length === 0) {
          setError(`No valid transactions found. ${parsingErrors.slice(0, 2).join(' ')}`);
          return;
        }

        setParsedRows(validRows);
        setSuccessMsg(`Successfully parsed ${validRows.length} transactions (${lines.length - 1 - validRows.length} rows skipped).`);
      } catch (err: any) {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    addTransactionsBatch(parsedRows);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 id="csv-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Import Transactions CSV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bulk upload statements into {mode === 'personal' ? 'Personal' : 'SME Business'} mode
            </p>
          </div>
        </div>

        {/* Expected CSV format box */}
        <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Expected Format:</span>
            <button
              onClick={downloadSampleCsv}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <Download className="w-3 h-3" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>
          <code className="block p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
            Date,Description,Amount,Type,Category
            <br />
            2026-09-01,Salary,30000,Income,Salary
            <br />
            2026-09-02,Grocery Store,2500,Expense,Food
            <br />
            2026-09-03,Netflix,649,Expense,Subscription
          </code>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />
          <Upload className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            {fileName ? fileName : 'Click to select CSV or drag and drop file here'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Max 5MB • Standard bank export format
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Preview Table if rows parsed */}
        {parsedRows.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Preview Parsed Rows ({parsedRows.length})
            </h4>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-mono">{row.date}</td>
                      <td className="p-2 truncate max-w-[120px]">{row.description}</td>
                      <td className="p-2">{row.category}</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.type === 'Income'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono font-semibold">
                        {currency}{row.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 5 && (
              <p className="text-[10px] text-slate-400 mt-1">
                + {parsedRows.length - 5} more transactions ready to import
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleImport}
            className={`px-5 py-2 text-xs font-bold rounded-lg text-white shadow-xs flex items-center gap-1.5 transition-all ${
              parsedRows.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Import {parsedRows.length} Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
