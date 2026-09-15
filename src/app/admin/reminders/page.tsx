'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Phone,
  Search,
  Filter,
  AlertCircle,
  IndianRupee,
  Users,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  X,
  Edit3,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency } from '@/lib/utils';

interface ReminderItem {
  customer: any;
  phone: string;
  cleanPhone: string;
  area: string;
  totalPendingDue: number;
  lastBillMonth: string;
  unpaidBillsCount: number;
  message: string;
  whatsappUrl: string;
}

const DEFAULT_TEMPLATE = `Namaskar {name} ji,
Lokmat newspaper bill for {month}: ₹{amount}.
Kindly clear the pending balance.
Payment mode: Cash / UPI ({upi}).
Thank you,
{agency}`;

const PRESET_TEMPLATES = [
  {
    name: 'Standard Friendly',
    template: `Namaskar {name} ji,
Lokmat newspaper bill for {month}: ₹{amount}.
Kindly clear the pending balance.
Payment mode: Cash / UPI ({upi}).
Thank you,
{agency}`,
  },
  {
    name: 'Polite Follow-up (Urgent)',
    template: `Namaskar {name} ji,
This is a gentle reminder regarding your Lokmat newspaper bill for {month} totaling ₹{amount}.
Please clear the pending balance today via UPI ({upi}) or cash to delivery staff.
Thank you,
{agency}`,
  },
  {
    name: 'Marathi Official (मराठी आवृत्ती)',
    template: `नमस्कार {name} जी,
आपले {month} महिन्याचे लोकमत वृत्तपत्राचे बिल ₹{amount} बाकी आहे.
कृपया UPI ({upi}) द्वारे किंवा पेपर टाकणाऱ्या मुलाकडे रोख रक्कम देऊन बिल भरावे.
धन्यवाद,
{agency}`,
  },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [minDue, setMinDue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);

  // Template Customization Drawer State
  const [showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Per-Customer Edit/Preview Modal State
  const [previewItem, setPreviewItem] = useState<ReminderItem | null>(null);
  const [modalEditedMessage, setModalEditedMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState<boolean>(false);

  const agency = dataService.getAgencySettings();

  useEffect(() => {
    loadReminders(activeTemplate);
  }, [selectedArea, minDue, activeTemplate]);

  const compileMessage = (template: string, item: { name: string; month: string; amount: number }) => {
    return template
      .replace(/{name}/g, item.name)
      .replace(/{month}/g, item.month)
      .replace(/{amount}/g, item.amount.toFixed(2))
      .replace(/{upi}/g, agency.upi_id || 'papertrack@upi')
      .replace(/{agency}/g, agency.agency_name || 'PaperTrack - Lokmat Agency');
  };

  const loadReminders = (template: string) => {
    const list = dataService.getReminderCustomers(selectedArea, minDue);

    // Apply active template to all reminders
    const updatedList = list.map((item) => {
      const customMsg = compileMessage(template, {
        name: item.customer.name,
        month: item.lastBillMonth,
        amount: item.totalPendingDue,
      });

      return {
        ...item,
        message: customMsg,
        whatsappUrl: `https://wa.me/${item.cleanPhone}?text=${encodeURIComponent(customMsg)}`,
      };
    });

    setReminders(updatedList);

    // Extract unique areas
    const all = dataService.getCustomers();
    const uniqueAreas = Array.from(new Set(all.map((c) => c.area))).filter(Boolean);
    setAreas(uniqueAreas);
  };

  const handleOpenEditModal = (item: ReminderItem) => {
    setPreviewItem(item);
    setModalEditedMessage(item.message);
    setModalCopied(false);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyModalMessage = () => {
    navigator.clipboard.writeText(modalEditedMessage);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2500);
  };

  const handleInsertVariable = (variable: string) => {
    if (!templateTextareaRef.current) return;
    const start = templateTextareaRef.current.selectionStart;
    const end = templateTextareaRef.current.selectionEnd;
    const updated = activeTemplate.substring(0, start) + variable + activeTemplate.substring(end);
    setActiveTemplate(updated);
    setTimeout(() => {
      templateTextareaRef.current?.focus();
      templateTextareaRef.current?.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  const filteredList = reminders.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.customer.name.toLowerCase().includes(q) ||
      item.phone.includes(q) ||
      item.area.toLowerCase().includes(q)
    );
  });

  const totalOutstanding = filteredList.reduce((sum, item) => sum + item.totalPendingDue, 0);

  // Dynamic modal WhatsApp URL based on edited message
  const modalWhatsappUrl = previewItem
    ? `https://wa.me/${previewItem.cleanPhone}?text=${encodeURIComponent(modalEditedMessage)}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Payment Follow-ups
            </span>
            <span className="text-xs text-slate-500">Customizable WhatsApp Reminders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            WhatsApp Payment Reminders Desk
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Personalize, edit and dispatch WhatsApp billing notices with pre-filled wa.me links, UPI details, and Marathi/English templates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
              showTemplateEditor
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>{showTemplateEditor ? 'Close Template Editor' : 'Edit Default Message Template'}</span>
            {showTemplateEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/admin/collections"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Collections</span>
          </Link>

          <Link
            href="/admin/payments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Global Template Customizer Drawer (Feature: Edit WhatsApp Message) */}
      {showTemplateEditor && (
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in zoom-in-98 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Master WhatsApp Message Template</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Global Template
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edits made here instantly update the default message sent to all customers across the agency.
              </p>
            </div>

            <button
              onClick={() => setActiveTemplate(DEFAULT_TEMPLATE)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Agency Default</span>
            </button>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1.5">
              Quick Preset Templates:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setActiveTemplate(preset.template)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeTemplate === preset.template
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Variable Injection Chips */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1.5">
              Click to Insert Smart Placeholders:
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { tag: '{name}', label: '+ Customer Name' },
                { tag: '{month}', label: '+ Billing Month' },
                { tag: '{amount}', label: '+ Pending Due (₹)' },
                { tag: '{upi}', label: '+ Agency UPI ID' },
                { tag: '{agency}', label: '+ Agency Name' },
              ].map((pill) => (
                <button
                  key={pill.tag}
                  type="button"
                  onClick={() => handleInsertVariable(pill.tag)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-semibold border border-slate-300 transition-colors"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Editor Grid: Textarea + Live Sample Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Editor Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Edit Template Text:
              </label>
              <textarea
                ref={templateTextareaRef}
                rows={6}
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value)}
                className="w-full text-xs font-sans p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 leading-relaxed"
                placeholder="Type your WhatsApp reminder message..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keep the curly braces intact (e.g. <code>{'{name}'}</code>) to auto-fill customer details.
              </p>
            </div>

            {/* Right: Live Preview Bubble */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Live Sample Output Preview (Anand Kulkarni):
              </label>
              <div className="bg-[#EFEAE2] p-4 rounded-xl border border-slate-200 min-h-[148px]">
                <div className="bg-white rounded-lg p-3 text-xs text-slate-800 whitespace-pre-line shadow-xs font-sans leading-relaxed border-l-4 border-emerald-500">
                  {compileMessage(activeTemplate, {
                    name: 'Anand Kulkarni',
                    month: '2026-08',
                    amount: 155.0,
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                  <span>Simulated WhatsApp message</span>
                  <span className="font-semibold text-emerald-700">✓ Ready to dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customers with Dues</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{filteredList.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Pending monthly newspaper payments</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pending Dues</span>
            <IndianRupee className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-2">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting collection across filtered list</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Default UPI Collection ID</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-mono font-bold text-slate-900 mt-2">
            {agency.upi_id || 'papertrack@upi'}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5 font-medium">Included automatically in reminder texts</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, phone or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Area:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-red-600 bg-white"
            >
              <option value="ALL">All Areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Min Dues:</span>
            <select
              value={minDue}
              onChange={(e) => setMinDue(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-red-600 bg-white"
            >
              <option value={0}>All Pending (&gt; ₹0)</option>
              <option value={150}>Dues &gt; ₹150</option>
              <option value={300}>Dues &gt; ₹300 (Overdue)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Pending Bill Customers ({filteredList.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click &apos;Edit &amp; Preview&apos; to customize individual messages before sending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Latest Bill Month</th>
                <th className="py-3 px-4 text-right">Pending Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No pending balances found!</p>
                    <p className="text-xs text-slate-400 mt-1">All customers in this filter are fully cleared.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.customer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/customers/${item.customer.id}`}
                        className="font-bold text-slate-900 hover:text-red-700 transition-colors"
                      >
                        {item.customer.name}
                      </Link>
                      <span className="block text-[11px] text-slate-500">
                        {item.unpaidBillsCount} unpaid bill(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {item.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {item.area}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.lastBillMonth}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-red-700 text-sm">
                      {formatCurrency(item.totalPendingDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit & Preview Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit message & preview before sending"
                          className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Edit &amp; Preview</span>
                        </button>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyMessage(item.message, item.customer.id)}
                          title="Copy text message"
                          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          {copiedId === item.customer.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Direct WhatsApp Send */}
                        <a
                          href={item.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Per-Customer Message Editor & Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit WhatsApp Reminder for {previewItem.customer.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Phone: <strong className="font-mono text-slate-800">{previewItem.phone}</strong> • Due: <strong className="text-red-700">{formatCurrency(previewItem.totalPendingDue)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Editable Textarea & Chat Bubble */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Quick Append Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Quick Message Add-ons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setModalEditedMessage((prev) => `${prev}\n\nKindly send receipt screenshot after paying.`)
                    }
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    + Ask for screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalEditedMessage((prev) => `${prev}\n\nPlease clear before evening delivery.`)
                    }
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    + Pay before evening
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalEditedMessage((prev) => `${prev}\n\n(Call delivery boy if paying cash).`)
                    }
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    + Cash delivery boy note
                  </button>
                </div>
              </div>

              {/* Editable Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Editable WhatsApp Message:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {modalEditedMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={modalEditedMessage}
                  onChange={(e) => setModalEditedMessage(e.target.value)}
                  className="w-full text-xs font-sans p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 leading-relaxed shadow-2xs"
                  placeholder="Edit customer message..."
                />
              </div>

              {/* Simulated WhatsApp Chat Bubble */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  What Customer Will See on WhatsApp:
                </span>
                <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-slate-200">
                  <div className="bg-white rounded-lg p-3 text-xs text-slate-800 whitespace-pre-line shadow-xs font-sans leading-relaxed border-l-4 border-emerald-500">
                    {modalEditedMessage}
                  </div>
                  <p className="text-[10px] text-slate-400 text-right mt-1">
                    Will open directly in WhatsApp app / web
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setModalEditedMessage(previewItem.message)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Reset to Original
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyModalMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs"
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <a
                  href={modalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPreviewItem(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
