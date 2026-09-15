'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';

interface ParsedRow {
  name: string;
  phone: string;
  address: string;
  area: string;
  daily_rate: number;
  start_date: string;
  delivery_boy: string;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

const SAMPLE_CSV = `name,phone,address,area,daily_rate,start_date,delivery_boy
Santosh Shinde,9822998877,Plot 34 Adarsh Colony,Shivaji Nagar,5.00,2026-09-01,Ramesh Shinde
Nandkumar Patil,9822998878,Gala 15 Market Yard,Market Area,5.00,2026-09-01,Suresh Patil
Balasaheb Kadam,9822998879,Flat 202 Sai Vihar,Shivaji Nagar,5.00,2026-09-01,Ramesh Shinde`;

export default function DiaryImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob(
      ['name,phone,address,area,daily_rate,start_date,delivery_boy\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'papertrack_diary_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Security Validation
    const allowedExtensions = ['.csv', '.txt'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExtension) {
      alert('Security validation failed: Only .csv or .txt files are permitted.');
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('File size exceeds the 5 MB limit. Please upload a smaller batch.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setHasValidated(false);
      setImportResult(null);
    };
    reader.onerror = () => {
      alert('Failed to read file securely. Please check file permissions.');
    };
    reader.readAsText(file);
  };


  const validateRows = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      alert('CSV must have a header row and at least one data row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const existingPhones = new Set(dataService.customers.map((c) => c.phone.replace(/[^0-9]/g, '')));
    const seenPhonesInBatch = new Set<string>();

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim());
      const name = cols[0] || '';
      const rawPhone = cols[1] || '';
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      const address = cols[2] || '';
      const area = cols[3] || '';
      const daily_rate = parseFloat(cols[4]) || 5.0;
      const start_date = cols[5] || new Date().toISOString().split('T')[0];
      const delivery_boy = cols[6] || '';

      let isValid = true;
      let error = '';
      let isDuplicate = false;

      if (!name) {
        isValid = false;
        error = 'Missing customer name';
      } else if (!cleanPhone || cleanPhone.length < 10) {
        isValid = false;
        error = 'Invalid phone number (must be 10 digits)';
      } else if (existingPhones.has(cleanPhone)) {
        isValid = false;
        isDuplicate = true;
        error = 'Duplicate phone: customer already exists in agency database';
      } else if (seenPhonesInBatch.has(cleanPhone)) {
        isValid = false;
        isDuplicate = true;
        error = 'Duplicate phone within import batch';
      } else if (!address) {
        isValid = false;
        error = 'Missing delivery address';
      } else if (!area) {
        isValid = false;
        error = 'Missing area';
      }

      if (cleanPhone) {
        seenPhonesInBatch.add(cleanPhone);
      }

      rows.push({
        name,
        phone: rawPhone.startsWith('+91') ? rawPhone : `+91 ${cleanPhone}`,
        address,
        area,
        daily_rate,
        start_date,
        delivery_boy,
        isValid,
        error,
        isDuplicate,
      });
    }

    setParsedRows(rows);
    setHasValidated(true);
    setImportResult(null);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows to import.');
      return;
    }

    const deliveryBoys = dataService.getDeliveryBoys();

    let count = 0;
    for (const row of validRows) {
      // Find matching delivery boy by name if possible
      const matchedBoy = deliveryBoys.find(
        (b) => b.name.toLowerCase() === row.delivery_boy.toLowerCase()
      );

      dataService.createCustomer({
        name: row.name,
        phone: row.phone,
        address: row.address,
        area: row.area,
        delivery_boy_id: matchedBoy ? matchedBoy.id : null,
        status: 'ACTIVE',
        start_date: row.start_date,
        advance_balance: 0.0,
        initial_daily_rate: row.daily_rate || 5.0,
      });
      count++;
    }

    setImportResult({
      imported: count,
      failed: parsedRows.length - count,
    });
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Digitize Handwritten Diary (CSV Assisted Import)
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Migrate handwritten diary subscriber lists into PaperTrack with duplicate detection and preview verification.
        </p>
      </div>

      {/* Guide Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">Assisted Diary Data Migration Workflow</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Because diary records are written by hand, automated optical scanning can make billing errors.
              The agency administrator can type subscriber details into Excel or Google Sheets, export to CSV,
              and PaperTrack will validate phone uniqueness, addresses, and daily rate (₹5) before adding them to the live database.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Diary CSV Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload & Raw Text Editor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Upload CSV File or Paste Diary Data
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>Choose CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setHasValidated(false);
          }}
          className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
          placeholder="name,phone,address,area,daily_rate,start_date,delivery_boy"
        />

        <div className="flex justify-end">
          <button
            onClick={validateRows}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Validate & Preview Rows</span>
          </button>
        </div>
      </div>

      {/* Validation Results Table */}
      {hasValidated && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Parsed Data Preview</h3>
              <p className="text-xs text-slate-500">
                {validCount} valid subscribers ready to import | {invalidCount} with errors or duplicates.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={validCount === 0 || importResult !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Import {validCount} Customers</span>
            </button>
          </div>

          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <p className="font-bold text-sm">✓ Import Completed Successfully!</p>
              <p>
                Successfully imported {importResult.imported} customers into the live database.
                You can now view them in the{' '}
                <Link href="/admin/customers" className="underline font-bold">
                  Customer Directory
                </Link>
                .
              </p>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Address & Area</th>
                  <th className="py-2.5 px-3">Daily Rate</th>
                  <th className="py-2.5 px-3">Delivery Staff</th>
                  <th className="py-2.5 px-3">Validation Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, i) => (
                  <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 text-rose-900'}>
                    <td className="py-2.5 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Invalid</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{r.name || '—'}</td>
                    <td className="py-2.5 px-3 font-mono">{r.phone || '—'}</td>
                    <td className="py-2.5 px-3">
                      {r.address}, <strong className="text-slate-800">{r.area}</strong>
                    </td>
                    <td className="py-2.5 px-3 font-bold">₹{r.daily_rate.toFixed(2)}</td>
                    <td className="py-2.5 px-3">{r.delivery_boy || 'Unassigned'}</td>
                    <td className="py-2.5 px-3 text-slate-500 italic">
                      {r.isValid ? 'Ready to import' : <span className="text-rose-700 font-medium">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
