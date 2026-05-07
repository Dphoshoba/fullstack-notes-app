import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, DollarSign, Download, FileText, Search } from "lucide-react";

import { apiRequest } from "../api/http.js";

export function FinanceHub({ actionData, onStatusChange }) {
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInvoices = async () => {
    try {
      const payload = await apiRequest("/api/invoices");
      setInvoices(Array.isArray(payload?.invoices) ? payload.invoices : []);
    } catch {
      setInvoices([]);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (actionData?.type === "invoices_generated") {
      fetchInvoices();
    }
  }, [actionData]);

  const generateInvoices = async () => {
    setIsGenerating(true);
    try {
      const payload = await apiRequest("/api/invoices/generate", { method: "POST" });
      setInvoices(Array.isArray(payload?.invoices) ? payload.invoices : []);
      if (typeof onStatusChange === "function") {
        onStatusChange({ type: "invoices_generated", count: Array.isArray(payload?.invoices) ? payload.invoices.length : 0 });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Finance &amp; Billing</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage facility invoices, view timesheet costs, and track agency profit.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-200">
          <Download size={18} /> Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute right-0 top-0 -z-10 h-24 w-24 rounded-bl-full bg-blue-50/50 transition-transform duration-500 group-hover:scale-110" />
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Billed YTD</p>
            <div className="rounded-xl bg-blue-100/80 p-2.5 text-blue-600">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">
            $1.24<span className="text-2xl font-bold text-slate-400">M</span>
          </h3>
          <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
            <ArrowUpRight size={14} /> +12.5% from last year
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute right-0 top-0 -z-10 h-24 w-24 rounded-bl-full bg-rose-50/50 transition-transform duration-500 group-hover:scale-110" />
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Paid YTD</p>
            <div className="rounded-xl bg-rose-100/80 p-2.5 text-rose-600">
              <ArrowDownRight size={20} strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">
            $954<span className="text-2xl font-bold text-slate-400">K</span>
          </h3>
          <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
            Agency Margin: ~23.4%
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute right-0 top-0 -z-10 h-24 w-24 rounded-bl-full bg-amber-50/50 transition-transform duration-500 group-hover:scale-110" />
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">A/R Aging</p>
            <div className="rounded-xl bg-amber-100/80 p-2.5 text-amber-600">
              <FileText size={20} strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">
            $142<span className="text-2xl font-bold text-slate-400">K</span>
          </h3>
          <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            $24K &gt; 30 days past due
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="relative flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <div className="relative flex gap-2">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`relative px-4 py-4 text-sm font-bold transition-colors ${
                activeTab === "invoices"
                  ? "text-blue-600"
                  : "rounded-t-xl text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
              }`}
            >
              Facility Invoices
              {activeTab === "invoices" ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" /> : null}
            </button>
            <button
              onClick={() => setActiveTab("receivables")}
              className={`relative px-4 py-4 text-sm font-bold transition-colors ${
                activeTab === "receivables"
                  ? "text-blue-600"
                  : "rounded-t-xl text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
              }`}
            >
              Accounts Receivable
              {activeTab === "receivables" ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              ) : null}
            </button>
          </div>

          <div className="relative flex items-center gap-2 pb-2">
            <button
              onClick={generateInvoices}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold leading-none text-white shadow-sm transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Invoices"}
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search invoices..."
                className="h-[36px] w-48 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm leading-none shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "invoices" ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-white font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-4 tracking-wide">Invoice #</th>
                  <th className="px-6 py-4 tracking-wide">Facility</th>
                  <th className="px-6 py-4 tracking-wide">Date</th>
                  <th className="px-6 py-4 text-right tracking-wide">Amount</th>
                  <th className="px-6 py-4 text-center tracking-wide">Status</th>
                  <th className="px-6 py-4 text-right tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="m-2 inline-block rounded-md border border-slate-100 bg-slate-50 px-6 py-5 font-mono font-bold text-slate-700 group-hover:border-slate-200 group-hover:bg-white">
                      {inv.id}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900">{inv.facility}</td>
                    <td className="px-6 py-5 font-medium text-slate-500">{inv.date}</td>
                    <td className="px-6 py-5 text-right text-base font-bold text-slate-900">
                      ${Number(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                          inv.status === "paid"
                            ? "border-emerald-200/60 bg-emerald-50 text-emerald-700"
                            : inv.status === "sent"
                              ? "border-blue-200/60 bg-blue-50 text-blue-700"
                              : inv.status === "overdue"
                                ? "border-rose-200/60 bg-rose-50 text-rose-700"
                                : "border-amber-200/60 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="flex items-center justify-end gap-2 px-6 py-5 text-right">
                      {inv.status === "overdue" ? (
                        <button className="rounded-lg border border-transparent bg-slate-900 px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-slate-800">
                          Remind
                        </button>
                      ) : null}
                      <button className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                        View PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-slate-50 shadow-inner">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Accounts Receivable Dashboard</h3>
              <p className="max-w-md text-center text-sm font-medium">
                Detailed aging reports are pending generation for this period.
              </p>
              <button className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
